-- EDITH data model. Run in the Supabase SQL editor.
-- Row Level Security: people read and write only their own rows.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  mode text not null default 'hero' check (mode in ('hero', 'plain')),
  onboarded boolean not null default false
);

create table user_setup (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answers jsonb not null default '{}',
  lat double precision,
  lng double precision,
  area text,
  updated_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 10)
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (household_id, user_id)
);

create table household_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  kind text not null check (kind in ('elder', 'child', 'pet')),
  name text not null,
  care_needs text[] not null default '{}',
  pet_type text,
  outdoor_blocks text[] not null default '{}'
);

create table checkins (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meals jsonb not null default '[]',
  trips jsonb not null default '[]',
  energy jsonb not null default '{}',
  deliveries jsonb not null default '{}',
  outdoor_blocks jsonb not null default '[]',
  mission_status text check (mission_status in ('yes', 'partly', 'no')),
  co2_breakdown jsonb not null default '{}',
  lives_kept numeric not null default 5,
  unique (user_id, date)
);

create table one_offs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  kind text not null,
  details jsonb not null default '{}',
  co2_kg numeric not null default 0
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  units numeric not null,
  source text not null check (source in ('photo', 'manual')),
  created_at timestamptz not null default now()
);

create table missions_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mission_id text not null,
  accepted boolean not null default false,
  status text check (status in ('yes', 'partly', 'no')),
  saved_kg numeric,
  saved_inr numeric,
  unique (user_id, date, mission_id)
);

create table xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  kind text not null,
  xp integer not null
);

create table badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- A profile row for every new sign-in.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Runs with definer rights so the household policies below don't recurse into themselves.
create function is_household_member(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members
    where household_id = target and user_id = auth.uid()
  );
$$;

-- Households are created and joined only through these, so nobody can add themselves by id.
create function create_household(household_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to create a household';
  end if;
  insert into households (name) values (household_name) returning id into new_id;
  insert into household_members (household_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create function join_household(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to join a household';
  end if;
  select id into target from households where invite_code = code;
  if target is null then
    raise exception 'Invite code not found';
  end if;
  insert into household_members (household_id, user_id)
  values (target, auth.uid())
  on conflict do nothing;
  return target;
end;
$$;

revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function create_household(text), join_household(text) from public, anon;
grant execute on function create_household(text), join_household(text) to authenticated;

alter table profiles enable row level security;
alter table user_setup enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table household_profiles enable row level security;
alter table checkins enable row level security;
alter table one_offs enable row level security;
alter table bills enable row level security;
alter table missions_log enable row level security;
alter table xp_events enable row level security;
alter table badges enable row level security;

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());
create policy "own setup" on user_setup for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own checkins" on checkins for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own one-offs" on one_offs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own bills" on bills for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own missions" on missions_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own xp" on xp_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own badges" on badges for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "members read household" on households for select
  using (is_household_member(id));
create policy "members update household" on households for update
  using (is_household_member(id)) with check (is_household_member(id));

create policy "members see each other" on household_members for select
  using (is_household_member(household_id));
create policy "leave household" on household_members for delete
  using (user_id = auth.uid());

create policy "members manage profiles" on household_profiles for all
  using (is_household_member(household_id)) with check (is_household_member(household_id));
