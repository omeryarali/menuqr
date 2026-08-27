-- MenuQR :: 0006_product_images
-- Storage bucket for uploaded product photos.
--
-- Layout: product-images/{restaurant_id}/{uuid}.{ext}
--
-- The first path segment is the tenant key — every policy below reads it back
-- out with storage.foldername() and asks the same ownership question the table
-- policies ask. NOT keyed by product id on purpose: an upload happens in the
-- dialog before the product row exists, so there is no id to name the file
-- after. A random uuid also means replacing a photo writes a new object rather
-- than overwriting one that a CDN may still be serving.

-- ---------------------------------------------------------------------------
-- Public read, owner-only write. The menu is public, so the photos are too;
-- file_size_limit and allowed_mime_types are enforced by Storage itself, which
-- is the only limit a hostile client cannot skip.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- A path segment is client-controlled text, so casting it straight to uuid
-- would raise 22P02 on garbage input. Postgres does not guarantee AND
-- short-circuits, so a regex guard in the policy is not reliable either —
-- swallow the cast error here and let a bad segment resolve to NULL, which
-- is_restaurant_owner() answers false for.
-- ---------------------------------------------------------------------------
create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_value::uuid;
exception
  when others then
    return null;
end;
$$;

grant execute on function public.safe_uuid(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage policies. Reads need no policy: the bucket is public, so the menu
-- fetches photos over the public URL with no session at all.
-- ---------------------------------------------------------------------------
drop policy if exists "product_images_insert_own" on storage.objects;
create policy "product_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_restaurant_owner(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "product_images_update_own" on storage.objects;
create policy "product_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_restaurant_owner(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'product-images'
    and public.is_restaurant_owner(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "product_images_delete_own" on storage.objects;
create policy "product_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_restaurant_owner(public.safe_uuid((storage.foldername(name))[1]))
  );
