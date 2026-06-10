create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.uuid_or_null(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  if value is null or trim(value) = '' then
    return null;
  end if;

  return value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.is_personal_email(email text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(email, '')) <> 'tradevya@gmail.com'
    and lower(split_part(coalesce(email, ''), '@', 2)) = any(array[
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'aol.com',
      'proton.me',
      'protonmail.com',
      'live.com',
      'msn.com',
      'me.com'
    ]::text[]);
$$;

create or replace function public.is_work_email(email text)
returns boolean
language sql
immutable
as $$
  select coalesce(email, '') ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and not public.is_personal_email(email);
$$;

create or replace function public.enforce_work_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_work_email(new.email) then
    raise exception 'Tradevya requires a real work email address. Personal email domains are not allowed.';
  end if;

  return new;
end;
$$;

drop trigger if exists require_work_email_on_auth_users on auth.users;
create trigger require_work_email_on_auth_users
  before insert or update of email on auth.users
  for each row execute function public.enforce_work_email();

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  company_type text not null default 'employer',
  is_other boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.airports (
  id uuid primary key default gen_random_uuid(),
  iata_code text not null unique,
  name text not null,
  city text not null,
  state text not null,
  country text not null default 'USA',
  created_at timestamptz not null default now()
);

create table public.stations (
  id uuid primary key default gen_random_uuid(),
  airport_id uuid not null references public.airports(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (airport_id, name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  company_id uuid references public.companies(id),
  custom_company_name text,
  airport_id uuid references public.airports(id),
  station_id uuid references public.stations(id),
  role text not null default 'regular_user' check (role in ('regular_user', 'station_admin', 'airport_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_station_id_idx on public.profiles(station_id);
create index profiles_airport_id_idx on public.profiles(airport_id);
create index profiles_company_id_idx on public.profiles(company_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    company_id,
    custom_company_name,
    airport_id,
    station_id
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    public.uuid_or_null(new.raw_user_meta_data ->> 'company_id'),
    nullif(new.raw_user_meta_data ->> 'custom_company_name', ''),
    public.uuid_or_null(new.raw_user_meta_data ->> 'airport_id'),
    public.uuid_or_null(new.raw_user_meta_data ->> 'station_id')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.protect_profile_location_and_role()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'authenticated' then
    if old.role is distinct from new.role then
      raise exception 'Roles cannot be changed from the profile editor.';
    end if;

    if old.company_id is not null and new.company_id is distinct from old.company_id then
      raise exception 'Company changes require a location change request.';
    end if;

    if old.airport_id is not null and new.airport_id is distinct from old.airport_id then
      raise exception 'Airport changes require a location change request.';
    end if;

    if old.station_id is not null and new.station_id is distinct from old.station_id then
      raise exception 'Station changes require a location change request.';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger protect_profile_location_and_role
  before update on public.profiles
  for each row execute function public.protect_profile_location_and_role();

create table public.location_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_company_id uuid references public.companies(id),
  current_airport_id uuid references public.airports(id),
  current_station_id uuid references public.stations(id),
  requested_company_id uuid references public.companies(id),
  requested_custom_company_name text,
  requested_airport_id uuid references public.airports(id),
  requested_station_id uuid references public.stations(id),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewer_id uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shift_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  station_id uuid not null references public.stations(id) on delete cascade,
  airport_id uuid not null references public.airports(id) on delete cascade,
  company_id uuid references public.companies(id),
  poster_name_snapshot text not null default 'Tradevya member',
  category text not null check (category in ('pick_up', 'give_away', 'day_trade', 'looking_for_double')),
  shift_date date not null,
  day_of_week text not null check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  shift_start time not null,
  shift_end time not null,
  location_team text,
  notes text,
  status text not null default 'open' check (status in ('open', 'pending', 'approved', 'declined', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shift_posts_station_date_idx on public.shift_posts(station_id, shift_date);
create index shift_posts_category_idx on public.shift_posts(category);
create index shift_posts_day_idx on public.shift_posts(day_of_week);

create or replace function public.set_shift_post_day_of_week()
returns trigger
language plpgsql
as $$
begin
  new.day_of_week = to_char(new.shift_date, 'FMDay');
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_shift_post_day_of_week
  before insert or update on public.shift_posts
  for each row execute function public.set_shift_post_day_of_week();

create table public.shift_requests (
  id uuid primary key default gen_random_uuid(),
  shift_post_id uuid not null references public.shift_posts(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null default 'take_shift' check (request_type in ('take_shift', 'trade_proposal')),
  proposed_shift_date date,
  proposed_start_time time,
  proposed_end_time time,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  responder_id uuid references public.profiles(id),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shift_requests_post_idx on public.shift_requests(shift_post_id);
create index shift_requests_requester_idx on public.shift_requests(requester_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  shift_post_id uuid references public.shift_posts(id) on delete cascade,
  shift_request_id uuid references public.shift_requests(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table public.airport_board_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  airport_id uuid not null references public.airports(id) on delete cascade,
  station_id uuid references public.stations(id) on delete cascade,
  visibility_scope text not null check (visibility_scope in ('station_only', 'airport_wide')),
  post_type text not null check (post_type in ('official_announcements', 'operations', 'safety', 'lost_and_found', 'buy_and_sell', 'general')),
  title text not null,
  body text not null,
  attachment_placeholder text,
  requires_approval boolean not null default false,
  approval_status text not null default 'published' check (approval_status in ('draft', 'pending', 'published', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.airport_board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.airport_board_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.airport_board_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.airport_board_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'ack',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table public.airport_board_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.airport_board_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'lead')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table public.team_posts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  critical_update boolean not null default false,
  promote_scope text check (promote_scope in ('station_feed', 'airport_board')),
  attachment_placeholder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.team_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default 'ack',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction)
);

create table public.team_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.team_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.flight_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  flight_number text not null,
  flight_date date,
  triggers text[] not null default '{}',
  notify_user_only boolean not null default true,
  notify_team boolean not null default false,
  dedupe_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger location_change_requests_updated_at
  before update on public.location_change_requests
  for each row execute function public.set_updated_at();

create trigger shift_requests_updated_at
  before update on public.shift_requests
  for each row execute function public.set_updated_at();

create trigger airport_board_posts_updated_at
  before update on public.airport_board_posts
  for each row execute function public.set_updated_at();

create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create trigger team_posts_updated_at
  before update on public.team_posts
  for each row execute function public.set_updated_at();

create trigger flight_alerts_updated_at
  before update on public.flight_alerts
  for each row execute function public.set_updated_at();

create or replace function public.current_profile_station_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select station_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_airport_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select airport_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.companies enable row level security;
alter table public.airports enable row level security;
alter table public.stations enable row level security;
alter table public.profiles enable row level security;
alter table public.location_change_requests enable row level security;
alter table public.shift_posts enable row level security;
alter table public.shift_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.airport_board_posts enable row level security;
alter table public.airport_board_comments enable row level security;
alter table public.airport_board_reactions enable row level security;
alter table public.airport_board_reports enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_posts enable row level security;
alter table public.team_post_comments enable row level security;
alter table public.team_post_reactions enable row level security;
alter table public.team_post_reports enable row level security;
alter table public.flight_alerts enable row level security;

create policy "Directory data is public" on public.companies for select using (true);
create policy "Airports are public" on public.airports for select using (true);
create policy "Stations are public" on public.stations for select using (true);

create policy "Users can read self and station peers"
  on public.profiles for select
  using (id = auth.uid() or station_id = public.current_profile_station_id());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Users can create their own location requests"
  on public.location_change_requests for insert
  with check (user_id = auth.uid());

create policy "Users and admins can read relevant location requests"
  on public.location_change_requests for select
  using (
    user_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  );

create policy "Admins can review location requests"
  on public.location_change_requests for update
  using (public.current_profile_role() in ('station_admin', 'airport_admin'))
  with check (public.current_profile_role() in ('station_admin', 'airport_admin'));

create policy "Station members can read station shift posts"
  on public.shift_posts for select
  using (station_id = public.current_profile_station_id());

create policy "Station members can create station shift posts"
  on public.shift_posts for insert
  with check (
    user_id = auth.uid()
    and station_id = public.current_profile_station_id()
    and airport_id = public.current_profile_airport_id()
    and company_id is not distinct from public.current_profile_company_id()
  );

create policy "Owners and admins can update shift posts"
  on public.shift_posts for update
  using (
    user_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  )
  with check (
    station_id = public.current_profile_station_id()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  );

create policy "Participants can read shift requests"
  on public.shift_requests for select
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from public.shift_posts sp
      where sp.id = shift_post_id
        and (sp.user_id = auth.uid() or sp.station_id = public.current_profile_station_id())
    )
  );

create policy "Station members can request visible shifts"
  on public.shift_requests for insert
  with check (
    requester_id = auth.uid()
    and exists (
      select 1 from public.shift_posts sp
      where sp.id = shift_post_id
        and sp.station_id = public.current_profile_station_id()
        and (sp.user_id is null or sp.user_id <> auth.uid())
    )
  );

create policy "Post owners can respond to shift requests"
  on public.shift_requests for update
  using (
    exists (
      select 1 from public.shift_posts sp
      where sp.id = shift_post_id
        and sp.user_id = auth.uid()
    )
    or requester_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.shift_posts sp
      where sp.id = shift_post_id
        and sp.user_id = auth.uid()
    )
    or requester_id = auth.uid()
  );

create policy "Users can read their notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can create action notifications"
  on public.notifications for insert
  with check (actor_id = auth.uid() or user_id = auth.uid());

create policy "Users can update their notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Airport board visibility"
  on public.airport_board_posts for select
  using (
    (visibility_scope = 'station_only' and station_id = public.current_profile_station_id())
    or (visibility_scope = 'airport_wide' and airport_id = public.current_profile_airport_id())
  );

create policy "Station members can draft board posts"
  on public.airport_board_posts for insert
  with check (
    user_id = auth.uid()
    and airport_id = public.current_profile_airport_id()
    and (visibility_scope = 'airport_wide' or station_id = public.current_profile_station_id())
    and (
      visibility_scope = 'station_only'
      or public.current_profile_role() = 'airport_admin'
      or approval_status = 'pending'
    )
  );

create policy "Admins can moderate board posts"
  on public.airport_board_posts for update
  using (public.current_profile_role() in ('station_admin', 'airport_admin'))
  with check (public.current_profile_role() in ('station_admin', 'airport_admin'));

create policy "Board comments visible with posts"
  on public.airport_board_comments for select
  using (exists (select 1 from public.airport_board_posts p where p.id = post_id));

create policy "Board comments by station members"
  on public.airport_board_comments for insert
  with check (user_id = auth.uid());

create policy "Board reactions visible with posts"
  on public.airport_board_reactions for select
  using (exists (select 1 from public.airport_board_posts p where p.id = post_id));

create policy "Board reactions by self"
  on public.airport_board_reactions for insert
  with check (user_id = auth.uid());

create policy "Board reports by self"
  on public.airport_board_reports for insert
  with check (reporter_id = auth.uid());

create policy "Admins read board reports"
  on public.airport_board_reports for select
  using (public.current_profile_role() in ('station_admin', 'airport_admin'));

create policy "Station teams are visible"
  on public.teams for select
  using (station_id = public.current_profile_station_id());

create policy "Station members can create teams"
  on public.teams for insert
  with check (station_id = public.current_profile_station_id());

create policy "Team members are visible in station"
  on public.team_members for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id
        and t.station_id = public.current_profile_station_id()
    )
  );

create policy "Users can join teams in their station"
  on public.team_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.teams t
      where t.id = team_id
        and t.station_id = public.current_profile_station_id()
    )
  );

create policy "Team posts visible to members"
  on public.team_posts for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_posts.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team posts by members"
  on public.team_posts for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = team_posts.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team comments visible to members"
  on public.team_post_comments for select
  using (
    exists (
      select 1 from public.team_posts tp
      join public.team_members tm on tm.team_id = tp.team_id
      where tp.id = post_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team comments by members"
  on public.team_post_comments for insert
  with check (user_id = auth.uid());

create policy "Team reactions visible to members"
  on public.team_post_reactions for select
  using (
    exists (
      select 1 from public.team_posts tp
      join public.team_members tm on tm.team_id = tp.team_id
      where tp.id = post_id
        and tm.user_id = auth.uid()
    )
  );

create policy "Team reactions by members"
  on public.team_post_reactions for insert
  with check (user_id = auth.uid());

create policy "Team reports by self"
  on public.team_post_reports for insert
  with check (reporter_id = auth.uid());

create policy "Admins read team reports"
  on public.team_post_reports for select
  using (public.current_profile_role() in ('station_admin', 'airport_admin'));

create policy "Users can manage their flight alerts"
  on public.flight_alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
