-- MenuQR :: 0007_product_images_select
--
-- Fixes cleanup silently doing nothing.
--
-- 0006 created INSERT/UPDATE/DELETE policies but no SELECT policy, on the
-- reasoning that a public bucket needs none — true for *serving* a file, since
-- the public URL bypasses RLS entirely. It is not true for managing files:
--
--   * storage's DELETE endpoint has to resolve the object rows first, so a row
--     RLS hides is a row it cannot delete. It then reports success having
--     deleted nothing, which is why an orphaned photo survived with no error
--     anywhere in the logs.
--   * .list() is a plain SELECT, so removeImagesForRestaurant() could never
--     have seen a single file.
--
-- Scoped to the owner, not to anon: customers already read photos through the
-- public URL, and granting anon SELECT here would let anyone enumerate every
-- tenant's files.

drop policy if exists "product_images_select_own" on storage.objects;
create policy "product_images_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_restaurant_owner(public.safe_uuid((storage.foldername(name))[1]))
  );
