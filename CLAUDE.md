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
  missing structural parent before anything else. A `Select` whose trigger shows the raw value
  (e.g. a UUID) instead of the item label needs an `items={{ value: label }}` map on `Select` —
  Base UI's `SelectValue` resolves the label from that map, Radix read it from the rendered item.
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

## Analytics

`menu_events` (migration `0005`) is an append-only log of public-menu opens. Its RLS is deliberately
asymmetric and is the reason the design works: **anon can INSERT but never SELECT**, the owner can
SELECT only their own. There is no UPDATE/DELETE policy, so events are immutable.

- Recorded client-side (`components/menu/menu-tracker.tsx` → `/api/track`), not during the server
  render — the render also runs for crawlers and link-preview bots, which would inflate every number.
- `/api/track` always answers 204 so it can't be used to probe which slugs exist, and it skips the
  owner's own previews.
- A scan is only distinguishable from an ordinary visit by the `?src=qr` marker that `qrTargetUrl()`
  bakes into the QR image. `menuUrl()` (shown/copied in the dashboard) stays clean on purpose —
  keep the two apart or shared links start counting as scans.
- `menu_event_daily_counts` is SECURITY **INVOKER** so the caller's RLS still applies. Never convert
  it to DEFINER — that would expose every tenant's traffic.

## Product images

Two sources, and the difference matters at every layer:

- **Uploaded** to the `product-images` bucket (migration `0006`), path
  `{restaurant_id}/{uuid}.{ext}`. The first path segment is the tenant key — storage policies read it
  back with `storage.foldername()` and run it through `is_restaurant_owner`. Not keyed by product id
  because the upload happens before the product row exists.
- **Pasted** third-party URLs, which still work and are stored in the same `products.image_url`.

`isUploadedImage()` is what separates them, and both callers depend on it: the menu renders uploads
through `next/image` (host allowlisted in `next.config.ts`) and pasted URLs through a plain `<img>`,
because the optimizer rejects non-allowlisted hosts. Cleanup uses `storagePathFromUrl()`, which
returns null for foreign URLs — that is the guard that stops us deleting something we never
uploaded. A lookalike host (`evil.com/storage/v1/object/public/…`) fails both checks.

Postgres cascades products when a category or restaurant is deleted, but the bucket knows nothing
about that cascade, so `lib/storage-cleanup.ts` sweeps the files first. All of it is best effort —
never let cleanup turn a successful delete into a visible failure.

Uploads go browser → Storage directly, not through a server action (a 5 MB file would otherwise be
base64'd into the action payload). Storage RLS is what authorizes the write.

## Dashboard ordering

`position` orders rows *within* a parent — categories within a restaurant, products within a
category. That is why `/dashboard/products` groups by category before rendering: a flat
cross-category table would let you drag a row somewhere its new position means nothing.

Drag-and-drop uses `@dnd-kit` (touch + keyboard sensors — owners edit menus from phones). A drop
rewrites every position from 0 in one statement via the `reorder_categories` / `reorder_products`
RPCs (migration `0008`), which heals gaps and duplicates left by earlier manual position edits. Both
RPCs are SECURITY INVOKER, so RLS still filters the rows — never make them DEFINER.

The sortable lists hold their own copy of the rows for the optimistic move and re-sync from props
**during render**, not in an effect (`react-hooks/set-state-in-effect` would fail, and an effect
would flash the stale order).

## Opening hours, SEO and print

`restaurants.opening_hours` is JSONB (migration `0009`): `{"mon": {"open","close"}, ...}`, a missing
day meaning closed. Always run it through `parseOpeningHours()` — it narrows the untrusted column and
degrades a malformed week to "no hours" rather than throwing on a customer's menu.

- Times are wall-clock **Europe/Istanbul**, matching the analytics rollup. There is no per-tenant
  timezone; add one before assuming otherwise.
- `isOpenNow()` consults *yesterday* as well as today, because a shift like `18:00–02:00` means
  Saturday 01:00 still belongs to Friday. Don't "simplify" that branch away.
- The badge is computed server-side, which is only safe because `/menu/[slug]` is `force-dynamic`.
- `components/menu/menu-json-ld.tsx` emits schema.org Restaurant + Menu, and skips unpublished
  restaurants entirely (they are noindex anyway). The payload is JSON.stringify'd with `<` escaped,
  so a product name can't break out of the script tag.
- `/qr-print/[id]` lives **outside** the `(dashboard)` group so the sidebar never reaches the paper —
  which makes auth its own responsibility (`requireUser` + owner-scoped `getRestaurant`).

## Out of scope

Theme builder, subscriptions, multi-user roles. The `qr_codes` table is provisioned but unwritten —
codes derive from the slug via `/api/qr/{slug}`. Don't build on `qr_codes.scan_count`; it is always 0
and analytics live in `menu_events` instead.
