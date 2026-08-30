-- MenuQR :: 0012_featured_products
-- Marks a dish as the chef's recommendation.
--
-- A plain flag rather than a "featured" position or a separate table: the owner
-- already controls order with drag-and-drop, and a second ordering concept
-- would fight it. This only changes how the item is *marked*, never where it
-- appears — see components/menu/menu-section.tsx.
--
-- No partial index: the menu reads every product of a restaurant anyway, so
-- there is no query that filters on this column alone.

alter table public.products
  add column if not exists is_featured boolean not null default false;
