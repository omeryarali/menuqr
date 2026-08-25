-- MenuQR :: 0005_analytics
-- Menu view / QR scan tracking.
--
-- An append-only event log rather than a counter column: counters can't answer
-- "how many views last week", and concurrent increments need locking. Rows are
-- cheap and the aggregate queries below stay fast with the index.
--
-- This deliberately does NOT use the provisioned qr_codes.scan_count — that
-- table models one row per printed code, which we never write. Analytics are
-- per restaurant, so they live here instead.

create table public.menu_events (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  -- 'view'    = menu opened from any link
  -- 'qr_scan' = menu opened from a printed QR (target carries ?src=qr)
  event_type     text not null check (event_type in ('view', 'qr_scan')),
  created_at     timestamptz not null default now()
);

-- Every dashboard query filters by restaurant and a recent time window.
create index menu_events_restaurant_created_idx
  on public.menu_events (restaurant_id, created_at desc);

alter table public.menu_events enable row level security;

-- ---------------------------------------------------------------------------
-- RLS: write-only for the public, read-only for the owner.
--
-- The asymmetry is the whole point. A menu visitor is anonymous and must be
-- able to INSERT, but must never SELECT — otherwise anyone could read every
-- restaurant's traffic numbers. There is deliberately no UPDATE or DELETE
-- policy, so events are immutable once written (nobody can rewrite history,
-- not even the owner).
-- ---------------------------------------------------------------------------

-- Insert is gated on the restaurant being published: draft menus are only
-- visible to their owner, so counting hits on them would just be self-traffic.
create policy "menu_events_insert_published"
  on public.menu_events for insert
  to anon, authenticated
  with check (public.is_restaurant_published(restaurant_id));

create policy "menu_events_select_own"
  on public.menu_events for select
  to authenticated
  using (public.is_restaurant_owner(restaurant_id));

-- ---------------------------------------------------------------------------
-- Daily rollup for the dashboard chart.
--
-- SECURITY INVOKER (the default) on purpose: the caller's RLS still applies, so
-- this can only ever return the caller's own events. A SECURITY DEFINER version
-- would bypass that and leak every tenant's numbers.
--
-- Dates are bucketed in Europe/Istanbul, not UTC — otherwise an evening view in
-- Turkey lands on the next day's bar and the chart looks wrong to the owner.
-- ---------------------------------------------------------------------------
create or replace function public.menu_event_daily_counts(
  p_days integer default 14,
  p_restaurant_id uuid default null
)
returns table (day date, event_type text, event_count bigint)
language sql
stable
as $$
  select
    (e.created_at at time zone 'Europe/Istanbul')::date as day,
    e.event_type,
    count(*) as event_count
  from public.menu_events e
  where e.created_at >= now() - make_interval(days => greatest(p_days, 1))
    and (p_restaurant_id is null or e.restaurant_id = p_restaurant_id)
  group by 1, 2
  order by 1;
$$;

-- Belt and braces. SECURITY INVOKER already means an anonymous caller gets an
-- empty result (no SELECT policy applies to them), but revoking anon's execute
-- makes the intent explicit and keeps the function harmless if anyone ever
-- flips it to DEFINER. `revoke ... from public` alone is not enough: Supabase
-- grants execute to anon explicitly, so anon must be named.
revoke all on function public.menu_event_daily_counts(integer, uuid) from public;
revoke all on function public.menu_event_daily_counts(integer, uuid) from anon;
grant execute on function public.menu_event_daily_counts(integer, uuid) to authenticated;
