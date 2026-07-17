# MenuQR

Multi-tenant QR menu platform. A restaurant owner signs up, builds a menu, publishes it to
`/menu/{slug}`, and prints a QR code that always points at the current version.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Supabase · Vercel

The UI is Turkish and hardcoded (no i18n layer). Code and comments are English. Default currency is
`TRY`, set per restaurant.

## Setup

### 1. Create a Supabase project

<https://supabase.com/dashboard> → New project.

### 2. Run the migrations

In the Supabase dashboard, open **SQL Editor** and run these in order, once, on a fresh project:

1. `supabase/migrations/0001_init.sql` — tables, triggers, indexes
2. `supabase/migrations/0002_rls.sql` — row level security policies

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**. The app validates these at boot (`lib/env.ts`) and fails
with a readable message rather than a cryptic "Invalid API key" at the first query.

### 4. Run it

```bash
npm install
npm run dev
```

## Commands

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Dev server                        |
| `npm run build`     | Production build (runs typecheck) |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | `tsc --noEmit`                    |

## Deploying to Vercel

Import the repo, then set the same three env vars in the Vercel project. `NEXT_PUBLIC_SITE_URL`
must be the real production origin — it's baked into every QR code and auth redirect, so a wrong
value means printed codes point at the wrong host.

In Supabase → **Authentication → URL Configuration**, add `https://your-app.vercel.app/auth/callback`
to the redirect allow list, or email confirmation links will bounce.

While you're there: the confirmation **email templates default to English**. Turkish replacements are
in [`supabase/email-templates/`](supabase/email-templates/) — paste them into **Authentication →
Email Templates**, which is where they actually live at runtime.

**Before launch, configure custom SMTP.** Supabase's built-in email provider is capped at **2 emails
per hour** across the whole project and cannot be raised without it — which also makes signup testing
fail silently after the second attempt. See `supabase/email-templates/README.md`.

## How isolation works

RLS is the security boundary — it blocks writes to rows you don't own and hides unpublished data.
But it is not the whole story for *reads*, and conflating the two causes a subtle leak:

- `restaurants` is the tenant boundary; everything else hangs off `restaurant_id`.
- Public-read policies are granted to `anon` **and** `authenticated` — otherwise signing in would
  take away access the general public has (a logged-in user must still be able to view any published
  menu).
- The catch: that same policy means an authenticated user's unscoped `select("*")` returns their own
  rows **plus every other owner's published rows**. Correct for the public menu; wrong for the
  dashboard. So the **owner-facing services filter by owner explicitly** (`listRestaurants`,
  `getRestaurant`, `listCategories`, `listProducts`), while `services/menu.ts` stays unscoped on
  purpose. RLS still guarantees nobody can *write* across tenants or read *drafts*.
- `products.restaurant_id` is denormalized (so policies don't join) and force-synced from its
  category by a trigger, so it can't be forged or drift.

Because the owner can also read their own unpublished restaurant, `/menu/{slug}` doubles as a live
draft preview. That's why the page is `force-dynamic`: a cached copy would leak a draft to the next
visitor.

## What's not here

Deliberately out of scope for the 2-week MVP: theme builder, analytics, subscriptions/billing,
multi-user roles per restaurant, and image upload/optimization (products take an image **URL**).

The `qr_codes` table exists but is unwritten — codes are derived from the slug. See the comment in
`0001_init.sql`.
