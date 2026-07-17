-- MenuQR :: 0002_rls
-- Multi-tenant isolation. Every table is deny-by-default; access is granted
-- only through the policies below.
--
-- Two audiences:
--   authenticated -> may touch only rows belonging to restaurants they own
--   anon          -> may read only rows of PUBLISHED restaurants
--
-- Ownership is resolved through SECURITY DEFINER helpers rather than inline
-- sub-selects. A policy that queries public.restaurants directly would itself
-- be filtered by restaurants' RLS, which nests policy evaluation and (for
-- self-referencing cases) recurses. The helpers run with the definer's rights,
-- so they see the base table and answer one clean boolean.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_restaurant_owner(p_restaurant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id
      and r.owner_id = (select auth.uid())
  );
$$;

create or replace function public.is_restaurant_published(p_restaurant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id
      and r.is_published
  );
$$;

revoke all on function public.is_restaurant_owner(uuid) from public;
revoke all on function public.is_restaurant_published(uuid) from public;
grant execute on function public.is_restaurant_owner(uuid) to authenticated;
grant execute on function public.is_restaurant_published(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.restaurants enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.qr_codes    enable row level security;

-- ---------------------------------------------------------------------------
-- profiles :: a user sees only themselves. No insert policy: rows are created
-- by the handle_new_user trigger. No delete policy: deletion cascades from
-- auth.users.
-- ---------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
create policy "restaurants_select_own"
  on public.restaurants for select
  to authenticated
  using ((select auth.uid()) = owner_id);

-- The public menu entry point. Unpublished restaurants stay invisible.
--
-- Granted to authenticated as well as anon: policies are OR'd, so without the
-- authenticated grant a signed-in owner browsing someone else's menu would
-- match no policy and get an empty result. Being logged in must not take away
-- access the general public has.
create policy "restaurants_select_published"
  on public.restaurants for select
  to anon, authenticated
  using (is_published);

create policy "restaurants_insert_own"
  on public.restaurants for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "restaurants_update_own"
  on public.restaurants for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "restaurants_delete_own"
  on public.restaurants for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create policy "categories_all_own"
  on public.categories for all
  to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

create policy "categories_select_published"
  on public.categories for select
  to anon, authenticated
  using (is_active and public.is_restaurant_published(restaurant_id));

-- ---------------------------------------------------------------------------
-- products
--
-- Unavailable products are still readable by anon so the menu can render them
-- as sold out. Filter in the query, not the policy.
-- ---------------------------------------------------------------------------
create policy "products_all_own"
  on public.products for all
  to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));

create policy "products_select_published"
  on public.products for select
  to anon, authenticated
  using (public.is_restaurant_published(restaurant_id));

-- ---------------------------------------------------------------------------
-- qr_codes :: owner-only. The public never reads this table; the menu page is
-- reached by slug, not by QR row.
-- ---------------------------------------------------------------------------
create policy "qr_codes_all_own"
  on public.qr_codes for all
  to authenticated
  using (public.is_restaurant_owner(restaurant_id))
  with check (public.is_restaurant_owner(restaurant_id));
