-- MenuQR :: 0013_translations
-- English translations for menu content.
--
-- JSONB on the rows themselves rather than a translations table: a translation
-- is only ever read together with its parent, so a child table would add a join
-- to every menu query and a second set of RLS policies to keep in sync. This
-- way translations inherit the parent row's policies exactly — a translation
-- can never be more or less visible than the thing it translates.
--
-- Shape (any missing key falls back to the base Turkish column):
--   {"en": {"name": "Lentil Soup", "description": "With butter and lemon"}}
--
-- Keyed by locale even though only "en" exists today, so adding a language is
-- data, not a migration. Restaurant names are deliberately not translatable —
-- they are proper nouns.

alter table public.categories
  add column if not exists translations jsonb;

alter table public.products
  add column if not exists translations jsonb;

-- Only guards the container type; the per-locale shape is validated by zod in
-- the app (lib/i18n.ts), where a bad value degrades to "no translation" rather
-- than breaking a customer's menu.
alter table public.categories
  drop constraint if exists categories_translations_object;
alter table public.categories
  add constraint categories_translations_object
  check (translations is null or jsonb_typeof(translations) = 'object');

alter table public.products
  drop constraint if exists products_translations_object;
alter table public.products
  add constraint products_translations_object
  check (translations is null or jsonb_typeof(translations) = 'object');
