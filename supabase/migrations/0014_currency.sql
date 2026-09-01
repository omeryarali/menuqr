-- Currency becomes a closed list.
--
-- 0001 only checked char_length(currency) = 3, so the free-text box accepted any
-- three letters ("TRL", "ABC") and the dashboard now offers a picker with four
-- codes. A value outside the list would render the Base UI trigger blank, which
-- is why the rows are normalized here rather than tolerated in the form: the
-- CHECK, the zod enum in lib/validators/restaurant.ts and CURRENCY_CODES in
-- lib/currencies.ts must all describe the same set.
--
-- Run the SELECT at the bottom BEFORE this migration: step 3 rewrites anything
-- unrecognized to TRY, and for a genuinely foreign currency that is a silent
-- reprice of a live menu.

begin;

-- 1. Codes that only differ by case or padding.
update public.restaurants
set currency = upper(btrim(currency))
where currency is distinct from upper(btrim(currency));

-- 2. The retired ISO code for the lira, plus the two-letter form the old input
--    would have rejected anyway.
update public.restaurants
set currency = 'TRY'
where currency in ('TRL', 'TL');

-- 3. Everything still off the list. Nothing is expected to match; the SELECT
--    below is how you find out before running this.
update public.restaurants
set currency = 'TRY'
where currency not in ('TRY', 'USD', 'EUR', 'GBP');

-- 4. Swap the length check for the list. The old constraint carries whatever
--    name Postgres generated for it, so it is looked up by definition.
do $$
declare
  old_name text;
begin
  select con.conname
  into old_name
  from pg_constraint con
  where con.conrelid = 'public.restaurants'::regclass
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%char_length(currency)%';

  if old_name is not null then
    execute format('alter table public.restaurants drop constraint %I', old_name);
  end if;
end
$$;

alter table public.restaurants
  drop constraint if exists restaurants_currency_allowed;

alter table public.restaurants
  add constraint restaurants_currency_allowed
  check (currency in ('TRY', 'USD', 'EUR', 'GBP'));

commit;

-- Inspection query, safe to run on its own beforehand:
--   select currency, count(*) from public.restaurants group by 1 order by 2 desc;
