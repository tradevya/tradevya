alter table public.airports
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);

update public.airports
set latitude = coords.latitude,
    longitude = coords.longitude
from (
  values
    ('ATL', 33.640700::numeric, -84.427700::numeric),
    ('BOS', 42.365600::numeric, -71.009600::numeric),
    ('CLT', 35.214400::numeric, -80.947300::numeric),
    ('DCA', 38.851200::numeric, -77.040200::numeric),
    ('DEN', 39.856100::numeric, -104.673700::numeric),
    ('DFW', 32.899800::numeric, -97.040300::numeric),
    ('DTW', 42.216200::numeric, -83.355400::numeric),
    ('EWR', 40.689500::numeric, -74.174500::numeric),
    ('IAH', 29.990200::numeric, -95.336800::numeric),
    ('JFK', 40.641300::numeric, -73.778100::numeric),
    ('LAS', 36.084000::numeric, -115.153700::numeric),
    ('LAX', 33.941600::numeric, -118.408500::numeric),
    ('MCO', 28.431200::numeric, -81.308100::numeric),
    ('MIA', 25.795900::numeric, -80.287000::numeric),
    ('MSP', 44.884800::numeric, -93.222300::numeric),
    ('ORD', 41.974200::numeric, -87.907300::numeric),
    ('PHL', 39.874400::numeric, -75.242400::numeric),
    ('PHX', 33.435200::numeric, -112.010100::numeric),
    ('SEA', 47.450200::numeric, -122.308800::numeric),
    ('SFO', 37.621300::numeric, -122.379000::numeric)
) as coords(iata_code, latitude, longitude)
where public.airports.iata_code = coords.iata_code
  and (public.airports.latitude is null or public.airports.longitude is null);

alter table public.profiles
  add column if not exists email_verified_at timestamptz;

update public.profiles
set email_verified_at = auth.users.email_confirmed_at
from auth.users
where public.profiles.id = auth.users.id
  and public.profiles.email_verified_at is null
  and auth.users.email_confirmed_at is not null;

create table if not exists public.airport_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete set null,
  requester_email text,
  iata_code text not null,
  name text not null,
  city text not null,
  state text not null,
  country text not null default 'USA',
  latitude numeric(9,6),
  longitude numeric(9,6),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (iata_code = upper(iata_code) and length(iata_code) = 3)
);

create index if not exists airport_requests_status_created_idx
  on public.airport_requests(status, created_at desc);

drop trigger if exists airport_requests_updated_at on public.airport_requests;
create trigger airport_requests_updated_at
  before update on public.airport_requests
  for each row execute function public.set_updated_at();

alter table public.airport_requests enable row level security;

drop policy if exists "Anyone can submit airport requests" on public.airport_requests;
create policy "Anyone can submit airport requests"
  on public.airport_requests for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and (requester_id is null or requester_id = auth.uid())
    and reviewed_by is null
    and reviewed_at is null
  );

drop policy if exists "Users and admins can read airport requests" on public.airport_requests;
create policy "Users and admins can read airport requests"
  on public.airport_requests for select
  using (
    requester_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  );

drop policy if exists "Admins can update airport requests" on public.airport_requests;
create policy "Admins can update airport requests"
  on public.airport_requests for update
  using (public.current_profile_role() in ('station_admin', 'airport_admin'))
  with check (public.current_profile_role() in ('station_admin', 'airport_admin'));

create or replace function public.approve_airport_request(
  request_id uuid,
  airport_latitude numeric default null,
  airport_longitude numeric default null,
  review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.airport_requests%rowtype;
  reviewer_role text;
  approved_airport_id uuid;
  station_name text;
begin
  select role into reviewer_role
  from public.profiles
  where id = auth.uid();

  if reviewer_role not in ('station_admin', 'airport_admin') then
    raise exception 'Only admins can approve airport requests.';
  end if;

  select *
  into request_row
  from public.airport_requests
  where id = request_id
  for update;

  if not found then
    raise exception 'Airport request not found.';
  end if;

  if request_row.status <> 'pending' then
    raise exception 'Airport request has already been reviewed.';
  end if;

  select id
  into approved_airport_id
  from public.airports
  where iata_code = upper(request_row.iata_code);

  if approved_airport_id is null then
    insert into public.airports (
      iata_code,
      name,
      city,
      state,
      country,
      latitude,
      longitude
    )
    values (
      upper(request_row.iata_code),
      request_row.name,
      request_row.city,
      upper(request_row.state),
      coalesce(request_row.country, 'USA'),
      coalesce(airport_latitude, request_row.latitude),
      coalesce(airport_longitude, request_row.longitude)
    )
    returning id into approved_airport_id;
  else
    update public.airports
    set latitude = coalesce(public.airports.latitude, airport_latitude, request_row.latitude),
        longitude = coalesce(public.airports.longitude, airport_longitude, request_row.longitude)
    where id = approved_airport_id;
  end if;

  foreach station_name in array array['Ramp', 'Gate', 'Customer Service', 'Baggage', 'Operations', 'Maintenance', 'Security']
  loop
    insert into public.stations (airport_id, name, description)
    values (approved_airport_id, station_name, upper(request_row.iata_code) || ' ' || station_name)
    on conflict (airport_id, name) do nothing;
  end loop;

  update public.airport_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      admin_note = review_note
  where id = request_row.id;

  return approved_airport_id;
end;
$$;

create or replace function public.reject_airport_request(
  request_id uuid,
  review_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewer_role text;
begin
  select role into reviewer_role
  from public.profiles
  where id = auth.uid();

  if reviewer_role not in ('station_admin', 'airport_admin') then
    raise exception 'Only admins can reject airport requests.';
  end if;

  update public.airport_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      admin_note = review_note
  where id = request_id
    and status = 'pending';

  if not found then
    raise exception 'Airport request not found or already reviewed.';
  end if;
end;
$$;

grant execute on function public.approve_airport_request(uuid, numeric, numeric, text) to authenticated;
grant execute on function public.reject_airport_request(uuid, text) to authenticated;
