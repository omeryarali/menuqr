-- One-time phone normalization to +90XXXXXXXXXX.
--
-- The column was free text, so the rows hold "0532 …", "+90 532 …", "532 …"
-- and worse. The dashboard now shows a fixed +90 and edits only the national
-- part, and lib/phone.ts writes the single shape from here on; this migration
-- brings the existing rows up to it.
--
-- Deliberately NO check constraint: a number that does not parse (a 444 service
-- line, a foreign number, a typo) is left exactly as it is so the owner can
-- still see and fix it. A CHECK would have to reject those rows instead.
--
-- The branches mirror trNationalDigits() in lib/phone.ts one for one. Anything
-- that states a country code other than +90 is skipped: "+49 30 123456" is ten
-- digits once punctuation is stripped and would otherwise become Turkish.

begin;

with candidates as (
  select
    id,
    btrim(phone) as raw,
    regexp_replace(phone, '\D', '', 'g') as digits
  from public.restaurants
  where phone is not null
    and btrim(phone) <> ''
),
local_only as (
  select
    id,
    case
      when length(digits) > 12 and left(digits, 2) = '00' then substr(digits, 3)
      else digits
    end as digits
  from candidates
  where not (raw like '+%' and raw not like '+90%')
    and not (raw like '00%' and raw not like '0090%')
),
national as (
  select
    id,
    case
      when length(digits) = 13 and left(digits, 3) = '090' then substr(digits, 4)
      when length(digits) = 12 and left(digits, 2) = '90' then substr(digits, 3)
      when length(digits) = 11 and left(digits, 1) = '0' then substr(digits, 2)
      else digits
    end as digits
  from local_only
)
update public.restaurants r
set phone = '+90' || n.digits
from national n
where r.id = n.id
  and length(n.digits) = 10
  -- A national number never starts with 0; padding one into +900532… would
  -- invent a number.
  and left(n.digits, 1) <> '0'
  and r.phone is distinct from '+90' || n.digits;

commit;

-- Before and after, to see what changed and what was left alone:
--   select id, name, phone from public.restaurants
--   where phone is not null and btrim(phone) <> '' order by phone;
