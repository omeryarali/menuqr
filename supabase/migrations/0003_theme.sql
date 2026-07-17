-- MenuQR :: 0003_theme
-- Per-restaurant public-menu theme. Owner picks one of three presets; the
-- customer sees it on /menu/{slug}.
--
-- Enforced as a CHECK rather than a Postgres enum: adding a value to an enum
-- needs ALTER TYPE (can't run in a transaction with other DDL on some
-- managed setups), whereas widening a CHECK is a trivial migration later.

alter table public.restaurants
  add column if not exists theme text not null default 'classic'
    check (theme in ('classic', 'modern', 'warm'));
