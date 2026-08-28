-- MenuQR :: 0010_drop_qr_codes
-- Removes the qr_codes table.
--
-- Provisioned in 0001 for per-code tracking that was never built: nothing has
-- ever written a row, scan_count stayed 0 in every environment, and QR images
-- are derived from the restaurant slug (/api/qr/{slug}) with no row involved.
-- Menu traffic is measured by menu_events (0005) instead.
--
-- An empty table nobody reads is worse than no table: it invites the next
-- person to "just use scan_count", which silently reports zero.
--
-- 0001 and 0002 are left untouched on purpose — migrations are a history, not
-- a description of the current schema. A fresh database will create this table
-- and then drop it here, which is correct if slightly wasteful.
--
-- Nothing to preserve: no row has ever existed. Bringing it back means
-- reverting this file, not recovering data. `cascade` clears the RLS policy
-- from 0002 along with it.

drop table if exists public.qr_codes cascade;
