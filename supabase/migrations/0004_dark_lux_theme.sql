-- MenuQR :: 0004_dark_lux_theme
-- Add 'dark-lux' to the check constraint for restaurant themes.

alter table public.restaurants
  drop constraint if exists restaurants_theme_check;

alter table public.restaurants
  add constraint restaurants_theme_check check (theme in ('classic', 'modern', 'warm', 'dark-lux'));
