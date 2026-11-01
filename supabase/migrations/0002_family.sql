-- Family, assistant and rewards. Run in the Supabase SQL editor after 0001_init.sql.

-- Whether a check-in's outdoor time overlapped that day's Go Time, for the Clean Escape badge.
alter table checkins add column if not exists in_go_time boolean not null default false;

create table household_goal_joins (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  primary key (household_id, user_id, week_start)
);

alter table household_goal_joins enable row level security;

create policy "members see goal joins" on household_goal_joins for select
  using (is_household_member(household_id));
create policy "join goal yourself" on household_goal_joins for insert
  with check (user_id = auth.uid() and is_household_member(household_id));
create policy "leave goal yourself" on household_goal_joins for delete
  using (user_id = auth.uid());

-- Daily totals for everyone in a household. Members see totals, never each other's details,
-- so this returns no meals, trips or setup answers. Members with no check-ins get one row with no date.
create function household_summary(target uuid, since date)
returns table (
  user_id uuid,
  display_name text,
  role text,
  date date,
  lives_kept numeric,
  shared_kg numeric,
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
    coalesce((c.co2_breakdown ->> 'travel')::numeric, 0) + coalesce((c.co2_breakdown ->> 'food')::numeric, 0)
      + coalesce((c.co2_breakdown ->> 'deliveries')::numeric, 0)
  from household_members m
  left join profiles p on p.id = m.user_id
  left join checkins c on c.user_id = m.user_id and c.date >= since
  where m.household_id = target and is_household_member(target);
$$;

revoke execute on function household_summary(uuid, date) from public, anon;
grant execute on function household_summary(uuid, date) to authenticated;
