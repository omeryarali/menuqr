# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server
npm run build      # production build — also runs the full typecheck
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

There is no test suite. `npm run build` is the real gate: it typechecks the whole app including
Next's generated route types, which `tsc` alone does not fully cover.

Running `build` or `dev` requires `.env.local` to exist — `lib/env.ts` validates the three
`NEXT_PUBLIC_*` vars at import time and throws if any is missing. To typecheck without real
credentials, pass placeholders inline:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="x" \
NEXT_PUBLIC_SITE_URL="http://localhost:3000" npx next build
```

## Architecture

Security lives in the database, not the app. Read `supabase/migrations/0002_rls.sql` before changing
any data access — it is the actual authorization layer and the comments there explain the
non-obvious parts.

**Request flow:** `proxy.ts` → `lib/supabase/middleware.ts` (refresh token, gate `/dashboard`) →
page/action → `services/*` or `lib/actions/*` → Supabase → RLS decides what's visible.

**Layers:**

- `services/` — server-only reads. **Owner-facing reads must filter by owner explicitly**
  (`listRestaurants`, `getRestaurant`, `listCategories`, `listProducts` all do). RLS is the security
  boundary, but `restaurants`/`categories`/`products` each carry a public-read policy granted to
  `authenticated` too, so an unscoped `select("*")` returns the caller's own rows PLUS every other
  owner's *published* rows. That's correct for the public menu (`services/menu.ts`, deliberately
  unscoped) and wrong for the dashboard. categories/products have no `owner_id`, so they scope via
  `listOwnedRestaurantIds()`. Don't "simplify" these back to relying on RLS alone — that reintroduces
  a cross-tenant leak into the dashboard.
- `lib/actions/` — server-only writes. Return `ActionState` (`lib/actions/types.ts`) instead of
  throwing, so forms can show the real message; only unexpected faults throw.
- `lib/validators/` — zod schemas mirroring the DB's CHECK constraints.
- `lib/supabase/` — three clients: `client` (browser), `server` (RSC/actions, per-request), and
  `middleware` (token refresh). Never hoist the server client to a module singleton — sessions leak.

**Tenancy:** `restaurants` is the boundary; everything hangs off `restaurant_id`. Ownership is
resolved in RLS via `SECURITY DEFINER` helpers (`is_restaurant_owner`, `is_restaurant_published`)
rather than inline sub-selects, which would nest policy evaluation and recurse.

## Conventions that will bite you

- **shadcn/ui here is the Base UI build** (`style: base-nova`), not Radix. There is no `asChild`.
  Use `render={<Link href="…" />}` and put children on the outer component. Check
  `components/ui/*.tsx` for the real prop names before writing markup against remembered Radix APIs.
  Structure differs too, not just props: `DropdownMenuLabel` is Base UI's `Menu.GroupLabel` and
  **throws at menu-open** ("Base UI error #31") unless wrapped in `DropdownMenuGroup` — Radix
  tolerated a bare Label. When a Base UI popup crashes the error boundary on open, suspect a
  missing structural parent before anything else.
- **`middleware.ts` does not exist** — Next 16 renamed the convention to `proxy.ts`. Having both is
  a hard build error.
- **`types/database.ts` is hand-maintained.** Every table needs a `Relationships` key and the schema
  needs `Views`/`Functions`/`Enums`/`CompositeTypes`, even empty. Omit one and supabase-js silently
  resolves every query result to `never` instead of erroring at the query. Regenerate with
  `npx supabase gen types typescript --project-id <id> > types/database.ts` once the project exists.
- **zod v4**: use `{ error: "…" }`, not `invalid_type_error` — the old key is accepted and ignored,
  so your message silently disappears.
- **Never close a dialog from a `useEffect` keyed on action state** — `react-hooks/set-state-in-effect`
  fails the lint. Await the action inside the `<form action={fn}>` handler and close on success;
  `useFormStatus` still drives the pending spinner. See `components/dashboard/category-dialog.tsx`.
- **`products.restaurant_id` is derived.** Omit it on insert; a `BEFORE` trigger sets it from
  `category_id` ahead of the NOT NULL check, and RLS then validates the derived value.
- Public-read RLS policies must be granted to `anon, authenticated` both — policies are OR'd, and
  granting only `anon` means signing in removes access the public has.
- `/menu/[slug]` is `force-dynamic` on purpose: owners see their own drafts there, so a shared cache
  entry would leak an unpublished menu.

## Language

The UI is **Turkish**, hardcoded — there is no i18n library and no dictionary files. New user-facing
strings go in Turkish, inline. `<html lang="tr">`.

- Code, comments, identifiers, commit messages and these docs stay in **English**.
- `services/menu.ts` pins `localeCompare(…, "tr")` via `COLLATION_LOCALE`. Never call `localeCompare`
  without an explicit locale: it uses the *server's* default, which is `en-US` on Vercel and sorts
  Turkish wrong (I precedes İ, O precedes Ö). It silently looks right on a Turkish dev machine and
  only breaks in production.
- `lib/utils/slug.ts` transliterates Turkish letters explicitly before NFD normalization — NFD alone
  drops "ğ" and mangles "ı".
- Supabase auth emails are **not** covered by any of this; they're configured in the Supabase
  dashboard (Authentication → Email Templates) and ship in English by default.

## Out of scope

Theme builder, analytics, subscriptions, multi-user roles, image upload (products take a URL). The
`qr_codes` table is provisioned but unwritten — codes derive from the slug via `/api/qr/{slug}`.
Don't build on `qr_codes.scan_count`; it is always 0.
