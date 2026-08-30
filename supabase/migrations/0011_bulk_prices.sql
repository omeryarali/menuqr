-- MenuQR :: 0011_bulk_prices
-- Applies a whole batch of new prices in one statement.
--
-- Same shape and reasoning as reorder_products (0008): one round trip instead
-- of one UPDATE per product, and SECURITY INVOKER (the default) so the caller's
-- RLS still filters the rows — an id belonging to another owner simply matches
-- nothing. Never make this DEFINER; it would let anyone reprice any menu.
--
-- Prices arrive already computed, so the preview the owner approved and the
-- values written here are produced by the same code (lib/pricing.ts). The
-- table's own CHECK (price >= 0) and numeric(10,2) remain the last line of
-- defence against a bad payload.
--
-- jsonb rather than parallel arrays: pairing ids and prices by index is the
-- kind of thing that silently misprices a menu when one array is off by one.

create or replace function public.set_product_prices(p_updates jsonb)
returns void
language sql
as $$
  update public.products p
  set price = (item->>'price')::numeric
  from jsonb_array_elements(p_updates) as item
  where p.id = (item->>'id')::uuid;
$$;

revoke all on function public.set_product_prices(jsonb) from public, anon;
grant execute on function public.set_product_prices(jsonb) to authenticated;
