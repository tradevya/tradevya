alter table public.profiles
  add column if not exists contact_phone text,
  add column if not exists disabled_at timestamptz,
  add column if not exists disabled_reason text;

create index if not exists profiles_disabled_at_idx on public.profiles(disabled_at);

create or replace function public.protect_profile_location_and_role()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'authenticated'
    and current_setting('app.admin_profile_update', true) is distinct from 'true' then
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

drop policy if exists "Owners and admins can update shift posts" on public.shift_posts;
create policy "Owners and admins can update shift posts"
  on public.shift_posts for update
  using (
    user_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  )
  with check (
    user_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  );

drop policy if exists "Owners and admins can delete shift posts" on public.shift_posts;
create policy "Owners and admins can delete shift posts"
  on public.shift_posts for delete
  using (
    user_id = auth.uid()
    or public.current_profile_role() in ('station_admin', 'airport_admin')
  );

drop policy if exists "Owners can read own shift posts" on public.shift_posts;
create policy "Owners can read own shift posts"
  on public.shift_posts for select
  using (user_id = auth.uid());

create or replace function public.admin_get_backend_counts()
returns table (
  companies_count bigint,
  users_count bigint,
  posts_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can view backend totals.';
  end if;

  return query
  select
    (select count(*) from public.companies),
    (select count(*) from public.profiles),
    (select count(*) from public.shift_posts);
end;
$$;

grant execute on function public.admin_get_backend_counts() to authenticated;

create or replace function public.admin_search_profiles(search_text text default null)
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  company_name text,
  airport_code text,
  station_name text,
  blocked_at timestamptz,
  disabled_at timestamptz,
  post_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can search users.';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.role,
    coalesce(p.custom_company_name, c.name) as company_name,
    a.iata_code as airport_code,
    s.name as station_name,
    p.blocked_at,
    p.disabled_at,
    (select count(*) from public.shift_posts sp where sp.user_id = p.id) as post_count
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  left join public.airports a on a.id = p.airport_id
  left join public.stations s on s.id = p.station_id
  where coalesce(trim(search_text), '') = ''
    or p.email ilike '%' || trim(search_text) || '%'
    or p.full_name ilike '%' || trim(search_text) || '%'
    or coalesce(p.custom_company_name, c.name, '') ilike '%' || trim(search_text) || '%'
    or coalesce(a.iata_code, '') ilike '%' || trim(search_text) || '%'
    or coalesce(s.name, '') ilike '%' || trim(search_text) || '%'
    or coalesce(p.contact_phone, '') ilike '%' || trim(search_text) || '%'
  order by p.created_at desc
  limit 50;
end;
$$;

grant execute on function public.admin_search_profiles(text) to authenticated;

create or replace function public.admin_get_profile_detail(target_user_id uuid)
returns table (
  id uuid,
  email text,
  full_name text,
  contact_phone text,
  role text,
  email_verified_at timestamptz,
  created_at timestamptz,
  company_id uuid,
  custom_company_name text,
  airport_id uuid,
  station_id uuid,
  company_name text,
  airport_code text,
  station_name text,
  blocked_at timestamptz,
  blocked_reason text,
  disabled_at timestamptz,
  disabled_reason text,
  post_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage users.';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.contact_phone,
    p.role,
    p.email_verified_at,
    p.created_at,
    p.company_id,
    p.custom_company_name,
    p.airport_id,
    p.station_id,
    coalesce(p.custom_company_name, c.name) as company_name,
    a.iata_code as airport_code,
    s.name as station_name,
    p.blocked_at,
    p.blocked_reason,
    p.disabled_at,
    p.disabled_reason,
    (select count(*) from public.shift_posts sp where sp.user_id = p.id) as post_count
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  left join public.airports a on a.id = p.airport_id
  left join public.stations s on s.id = p.station_id
  where p.id = target_user_id;
end;
$$;

grant execute on function public.admin_get_profile_detail(uuid) to authenticated;

create or replace function public.admin_update_profile_details(
  target_user_id uuid,
  new_email text,
  new_full_name text,
  new_contact_phone text,
  new_company_id uuid,
  new_custom_company_name text,
  new_airport_id uuid,
  new_station_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage users.';
  end if;

  if new_role not in ('regular_user', 'station_admin', 'airport_admin') then
    raise exception 'Invalid role.';
  end if;

  if new_station_id is not null and not exists (
    select 1 from public.stations
    where id = new_station_id
      and airport_id = new_airport_id
  ) then
    raise exception 'Station must belong to the selected airport.';
  end if;

  perform set_config('app.admin_profile_update', 'true', true);

  update public.profiles
  set email = lower(trim(new_email)),
      full_name = trim(new_full_name),
      contact_phone = nullif(trim(new_contact_phone), ''),
      company_id = new_company_id,
      custom_company_name = nullif(trim(new_custom_company_name), ''),
      airport_id = new_airport_id,
      station_id = new_station_id,
      role = new_role,
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;

  update auth.users
  set email = lower(trim(new_email)),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', trim(new_full_name)),
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_update_profile_details(uuid, text, text, text, uuid, text, uuid, uuid, text) to authenticated;

create or replace function public.admin_unblock_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage users.';
  end if;

  update public.profiles
  set blocked_at = null,
      blocked_reason = null,
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;

  update auth.users
  set banned_until = case
      when exists (select 1 from public.profiles where id = target_user_id and disabled_at is not null) then 'infinity'::timestamptz
      else null
    end,
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_unblock_profile(uuid) to authenticated;

create or replace function public.admin_disable_profile(target_user_id uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage users.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot disable your own backend account.';
  end if;

  update public.profiles
  set disabled_at = coalesce(disabled_at, now()),
      disabled_reason = nullif(trim(reason), ''),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;

  update auth.users
  set banned_until = 'infinity'::timestamptz,
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_disable_profile(uuid, text) to authenticated;

create or replace function public.admin_enable_profile(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage users.';
  end if;

  update public.profiles
  set disabled_at = null,
      disabled_reason = null,
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;

  update auth.users
  set banned_until = case
      when exists (select 1 from public.profiles where id = target_user_id and blocked_at is not null) then 'infinity'::timestamptz
      else null
    end,
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_enable_profile(uuid) to authenticated;

create or replace function public.admin_list_user_shift_posts(target_user_id uuid)
returns table (
  id uuid,
  category text,
  shift_date date,
  day_of_week text,
  shift_start time,
  shift_end time,
  location_team text,
  notes text,
  status text,
  created_at timestamptz,
  airport_code text,
  station_name text,
  request_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage posts.';
  end if;

  return query
  select
    sp.id,
    sp.category,
    sp.shift_date,
    sp.day_of_week,
    sp.shift_start,
    sp.shift_end,
    sp.location_team,
    sp.notes,
    sp.status,
    sp.created_at,
    a.iata_code as airport_code,
    s.name as station_name,
    (select count(*) from public.shift_requests sr where sr.shift_post_id = sp.id) as request_count
  from public.shift_posts sp
  left join public.airports a on a.id = sp.airport_id
  left join public.stations s on s.id = sp.station_id
  where sp.user_id = target_user_id
  order by sp.created_at desc
  limit 200;
end;
$$;

grant execute on function public.admin_list_user_shift_posts(uuid) to authenticated;

create or replace function public.admin_update_shift_post(
  target_post_id uuid,
  new_category text,
  new_shift_date date,
  new_shift_start time,
  new_shift_end time,
  new_location_team text,
  new_notes text,
  new_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage posts.';
  end if;

  if new_category not in ('pick_up', 'give_away', 'day_trade', 'looking_for_double') then
    raise exception 'Invalid category.';
  end if;

  if new_status not in ('open', 'pending', 'approved', 'declined', 'closed') then
    raise exception 'Invalid status.';
  end if;

  update public.shift_posts
  set category = new_category,
      shift_date = new_shift_date,
      shift_start = new_shift_start,
      shift_end = new_shift_end,
      location_team = nullif(trim(new_location_team), ''),
      notes = nullif(trim(new_notes), ''),
      status = new_status,
      updated_at = now()
  where id = target_post_id;

  if not found then
    raise exception 'Post not found.';
  end if;
end;
$$;

grant execute on function public.admin_update_shift_post(uuid, text, date, time, time, text, text, text) to authenticated;
