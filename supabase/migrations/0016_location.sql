-- Map coordinates for the restaurant address.
--
-- `address` stays the source of truth for what a customer reads: the map fills
-- it in, but the owner can still edit the text afterwards (an OSM display_name
-- is often more bureaucratic than useful). The coordinates are what a map link
-- or a "directions" button would need.
--
-- Nullable and paired: half a coordinate points at the Gulf of Guinea, so the
-- CHECK refuses one without the other rather than storing a plausible-looking
-- (0, lon) pair.
--
-- numeric(9,6) holds -180.000000 … 180.000000; six decimals is ~11 cm, far
-- finer than a street address needs.

begin;

alter table public.restaurants
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table public.restaurants
  drop constraint if exists restaurants_latitude_range,
  drop constraint if exists restaurants_longitude_range,
  drop constraint if exists restaurants_coordinates_paired;

alter table public.restaurants
  add constraint restaurants_latitude_range
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add constraint restaurants_longitude_range
    check (longitude is null or (longitude >= -180 and longitude <= 180)),
  add constraint restaurants_coordinates_paired
    check ((latitude is null) = (longitude is null));

commit;

-- No policy changes: the columns live on `restaurants` and inherit its RLS, so
-- they are owner-writable and public-readable exactly like `address` already is.
