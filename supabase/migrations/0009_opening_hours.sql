-- MenuQR :: 0009_opening_hours
-- Per-day opening hours, used for the "open now" badge and for the
-- schema.org openingHoursSpecification the menu emits.
--
-- Stored as JSONB rather than a hours table: it is always read and written as a
-- whole week alongside the restaurant, never queried across restaurants, so a
-- child table would only add a join. Shape (missing/null day = closed):
--
--   {"mon": {"open": "09:00", "close": "22:00"}, "sat": null, ...}
--
-- Times are wall-clock in Europe/Istanbul. No timezone column: every tenant is
-- Turkish, and the same assumption is already baked into the analytics rollup.
-- Add one here first if that ever stops being true.

alter table public.restaurants
  add column if not exists opening_hours jsonb;

-- Only guards the container type. The per-day shape is validated by zod in the
-- app (lib/validators/opening-hours.ts) — a CHECK strict enough to be useful
-- here would need a function, and a malformed week can only ever break the
-- owner's own badge.
alter table public.restaurants
  drop constraint if exists restaurants_opening_hours_object;
alter table public.restaurants
  add constraint restaurants_opening_hours_object
  check (opening_hours is null or jsonb_typeof(opening_hours) = 'object');
