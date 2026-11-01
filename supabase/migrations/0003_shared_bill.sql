-- One electricity bill for the home. Run in the Supabase SQL editor after 0002_family.sql.

-- Runs with definer rights so the bills policy can look across household memberships.
create function shares_household(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from household_members mine
    join household_members theirs on theirs.household_id = mine.household_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  );
$$;

-- Anyone in a household can read its bills. Adding and changing stay limited to your own, by "own bills".
create policy "household bills" on bills for select
  using (shares_household(user_id));

-- The summary now also gives electricity on its own, so a bill can replace just that part.
drop function household_summary(uuid, date);

create function household_summary(target uuid, since date)
returns table (
  user_id uuid,
  display_name text,
  role text,
  date date,
  lives_kept numeric,
  shared_kg numeric,
  electricity_kg numeric,
  personal_kg numeric
)
language sql stable security definer set search_path = public as $$
  select
    m.user_id,
    p.display_name,
    m.role,
    c.date,
    c.lives_kept,
    coalesce((c.co2_breakdown ->> 'electricity')::numeric, 0) + coalesce((c.co2_breakdown ->> 'cooking')::numeric, 0),
    coalesce((c.co2_breakdown ->> 'electricity')::numeric, 0),
    coalesce((c.co2_breakdown ->> 'travel')::numeric, 0) + coalesce((c.co2_breakdown ->> 'food')::numeric, 0)
      + coalesce((c.co2_breakdown ->> 'deliveries')::numeric, 0)
  from household_members m
  left join profiles p on p.id = m.user_id
  left join checkins c on c.user_id = m.user_id and c.date >= since
  where m.household_id = target and is_household_member(target);
$$;

revoke execute on function household_summary(uuid, date) from public, anon;
grant execute on function household_summary(uuid, date) to authenticated;
