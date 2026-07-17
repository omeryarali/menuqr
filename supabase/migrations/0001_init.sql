-- MenuQR :: 0001_init
-- Core schema: profiles, restaurants, categories, products, qr_codes.
-- All tables use UUID primary keys and created_at/updated_at timestamps.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles :: 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Populate a profile whenever a user signs up. SECURITY DEFINER because the
-- signup transaction runs as the auth admin, not as the new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- restaurants :: the tenant boundary. Everything below hangs off restaurant_id.
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  name          text not null check (char_length(trim(name)) between 1 and 120),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description   text,
  address       text,
  phone         text,
  currency      text not null default 'TRY' check (char_length(currency) = 3),
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index restaurants_owner_id_idx on public.restaurants (owner_id);
create index restaurants_slug_idx on public.restaurants (slug) where is_published;

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 1 and 80),
  description    text,
  position       integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index categories_restaurant_id_idx on public.categories (restaurant_id, position);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
--
-- restaurant_id is denormalized from categories on purpose: RLS checks run per
-- row, and carrying the tenant key directly avoids a join in every policy.
-- The trigger below keeps it honest so it can never drift from the category.
-- ---------------------------------------------------------------------------
create table public.products (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  category_id    uuid not null references public.categories (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 1 and 120),
  description    text,
  price          numeric(10, 2) not null default 0 check (price >= 0),
  image_url      text,
  is_available   boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index products_restaurant_id_idx on public.products (restaurant_id);
create index products_category_id_idx on public.products (category_id, position);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Force products.restaurant_id to match its category's restaurant. Without this
-- a client could file a product under someone else's category.
--
-- Clients should omit restaurant_id entirely on insert. BEFORE ROW triggers run
-- ahead of NOT NULL/CHECK evaluation, so this populates the column in time, and
-- RLS's WITH CHECK then tests the derived value rather than the client's.
create or replace function public.sync_product_restaurant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_restaurant uuid;
begin
  select c.restaurant_id into category_restaurant
  from public.categories c
  where c.id = new.category_id;

  if category_restaurant is null then
    raise exception 'category % does not exist', new.category_id;
  end if;

  new.restaurant_id = category_restaurant;
  return new;
end;
$$;

-- Fires on every write, not just category_id changes: restaurant_id is always
-- derived, so a direct write to it must never be able to stick.
create trigger products_sync_restaurant
  before insert or update on public.products
  for each row execute function public.sync_product_restaurant();

-- ---------------------------------------------------------------------------
-- qr_codes
--
-- Provisioned, but nothing writes to it yet. The MVP derives a restaurant's QR
-- code deterministically from its slug (/api/qr/{slug}), so no row is needed to
-- render or download one. This table is where per-table / per-campaign codes and
-- their scan_count will live once that ships; scan_count stays 0 until then.
-- ---------------------------------------------------------------------------
create table public.qr_codes (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  label          text not null default 'Default',
  target_url     text not null,
  scan_count     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index qr_codes_restaurant_id_idx on public.qr_codes (restaurant_id);

create trigger qr_codes_set_updated_at
  before update on public.qr_codes
  for each row execute function public.set_updated_at();
