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
- **Currency is a closed list in three places**: the CHECK in `0014_currency.sql`, the zod enum in
  `lib/validators/restaurant.ts` and `CURRENCY_CODES` in `lib/currencies.ts`. Adding a fifth code
  means touching all three; a code present in only one either fails the save or renders the Base UI
  trigger blank.
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
- `lib/phone.ts` is the only place that decides what a phone number is. The column holds
  `+90XXXXXXXXXX` (migration `0015` normalized the old free text), and the form shows a fixed +90
  while editing only the national part. Values that do not parse — a 444 service line, a foreign
  number, a typo — are left exactly as they are rather than mangled into the pattern, which is why
  `0015` adds no CHECK. A number carrying a country code other than +90 is never reinterpreted:
  "+49 30 123456" is ten digits once punctuation is stripped.
- Supabase auth emails are **not** covered by any of this; they're configured in the Supabase
  dashboard (Authentication → Email Templates) and ship in English by default.

## Menu translations (TR/EN)

The **public menu** is bilingual; the dashboard is not. Turkish is the base and lives in the ordinary
`name`/`description` columns — `translations` JSONB (migration `0013`) only holds overrides, so an
untranslated menu behaves exactly as before and a half-finished one falls back field by field.
Restaurant names are deliberately not translatable.

- Locale comes from `?lang=en`, never a cookie or state: a shared link then carries the language, and
  the base locale drops the parameter so the canonical Turkish URL stays identical to what the QR
  encodes.
- **`MenuStrings` must stay serialisable.** It is passed as a prop into client components, and a
  function anywhere in it fails at runtime with "Functions cannot be passed directly to Client
  Components" — which typecheck and build both pass. That is why `metaDescription()` is a standalone
  function rather than a key.
- Translations inherit the parent row's RLS, which is the reason for JSONB over a child table: a
  translation can never be more or less visible than the thing it translates.

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

## Featured products

`products.is_featured` (migration `0012`) marks a dish as the chef's recommendation. It changes only
how the item is *marked* — never where it appears. Ordering belongs to the owner's drag-and-drop, and
auto-pinning featured items to the top would silently fight it.

The mark has to be added in all three surfaces or they disagree: the public menu, the detail modal
(`GalleryItem.isFeatured`) and the paper menu.

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
- `/qr-print/[id]` and `/menu-print/[id]` live **outside** the `(dashboard)` group so the sidebar
  never reaches the paper — which makes auth their own responsibility (`requireUser` + owner-scoped
  `getRestaurant`). Both drive layout switching through `components/dashboard/print-sheet.tsx`.
- Menu categories are native `<details>`/`<summary>`, closed by default (open when the menu has a
  single category). No React state: it works without JavaScript and the products stay in the DOM
  while collapsed, so crawlers and link previews still see the whole menu. The page's `@media print`
  block forces every section open with **two** selectors — `::details-content` on current engines,
  `display` on the non-summary children elsewhere — because browsers hide closed content differently.
- Print layouts must not depend on Tailwind's responsive prefixes. `sm:` and friends key off the
  viewport, and if the print layout measures narrower than the breakpoint the rule silently drops —
  a two-column menu quietly prints as one. Put print rules in the page's own `@media print` block
  (see `.menu-two-col`).

## Bulk pricing

`lib/pricing.ts` is shared on purpose: the dialog previews with `computeNewPrice` and
`bulkUpdatePrices` re-runs the same function server-side before writing. The action deliberately
ignores the prices the client sends and recomputes from the change spec, so a preview can never show
one number and save another.

`computeNewPrice` clamps at both ends — a discount larger than the price lands on 0 rather than a
negative the CHECK would reject, and the result never exceeds what `numeric(10,2)` holds.

`set_product_prices` (migration `0011`) takes JSONB, not parallel id/price arrays: pairing two arrays
by index is how a menu silently gets mispriced. SECURITY INVOKER, like the reorder RPCs.

## Address and geocoding

`restaurants.latitude`/`longitude` (migration `0016`) are set from the Leaflet picker next to the
address box. They are stored whole or not at all — both the CHECK and the zod refine say so, since
half a coordinate is a point in the Gulf of Guinea. The text `address` stays the source of truth
for what a customer reads; the map only fills it in, and a map click overwrites the text only when
the field wrote it itself.

- Leaflet is loaded through `dynamic(..., { ssr: false })` — it touches `window` at module scope.
- **Nominatim is reached only from the server** (`lib/geocode.ts` behind `/api/geocode`). Their
  policy caps one request per second per source and requires an identifying User-Agent, neither of
  which a browser can honour on our behalf. The route is signed-in only: an open proxy in front of
  a rate-limited third party is a free way to get our IP blocked.
- Search is restricted to Turkey (`countrycodes=tr`), matching the Turkish UI and +90 phones.
- The OSM tile attribution is a condition of use, not decoration. Don't remove it.

## Out of scope

Theme builder, subscriptions, multi-user roles, per-table QR codes.

QR images are derived from the restaurant slug (`/api/qr/{slug}`) — there is no row per code. The
SVG branch returns the framed artwork (`renderFramedQrSvg`, built in module units from
`QRCode.create`); the PNG branch is the bare code, because drawing the caption server-side would
need a font rasterizer. The dashboard builds the framed PNG in the browser by drawing that SVG to
a canvas, which only works while the SVG stays self-contained — no external font, no CSS. A
`qr_codes` table existed for that from `0001` until `0010` dropped it unused; if per-table codes ever
ship, design the table then rather than reviving that one. Menu traffic lives in `menu_events`.
