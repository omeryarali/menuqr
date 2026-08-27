-- MenuQR :: 0008_reorder
-- Bulk position updates for drag-and-drop ordering.
--
-- One statement instead of one UPDATE per row: dragging an item to the top of a
-- 40-item menu renumbers every row after it, and 40 round trips would make the
-- list visibly crawl.
--
-- SECURITY INVOKER (the default) is what keeps this safe: the caller's RLS still
-- applies, so ids belonging to another owner simply match no rows. Never make
-- these DEFINER — that would let anyone renumber any restaurant's menu.
--
-- `with ordinality` gives each id its index in the array, which becomes the new
-- position. Positions are rewritten from 0 on every reorder, so gaps and
-- duplicates left by earlier manual edits heal themselves.

create or replace function public.reorder_categories(p_ids uuid[])
returns void
language sql
as $$
  update public.categories c
  set position = ordered.ord - 1
  from unnest(p_ids) with ordinality as ordered(id, ord)
  where c.id = ordered.id;
$$;

create or replace function public.reorder_products(p_ids uuid[])
returns void
language sql
as $$
  update public.products p
  set position = ordered.ord - 1
  from unnest(p_ids) with ordinality as ordered(id, ord)
  where p.id = ordered.id;
$$;

revoke all on function public.reorder_categories(uuid[]) from public, anon;
revoke all on function public.reorder_products(uuid[]) from public, anon;
grant execute on function public.reorder_categories(uuid[]) to authenticated;
grant execute on function public.reorder_products(uuid[]) to authenticated;
