alter table public.profiles
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text;

create index if not exists profiles_blocked_at_idx on public.profiles(blocked_at);

create or replace function public.protect_shift_post_origin()
returns trigger
language plpgsql
as $$
begin
  if old.airport_id is distinct from new.airport_id
    or old.station_id is distinct from new.station_id
    or old.company_id is distinct from new.company_id then
    raise exception 'Shift post airport, station, and company cannot be changed after creation.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_shift_post_origin_on_shift_posts on public.shift_posts;
create trigger protect_shift_post_origin_on_shift_posts
  before update of airport_id, station_id, company_id on public.shift_posts
  for each row execute function public.protect_shift_post_origin();

drop function if exists public.admin_list_profiles();

create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  email_verified_at timestamptz,
  created_at timestamptz,
  company_name text,
  airport_code text,
  station_name text,
  blocked_at timestamptz,
  blocked_reason text
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
    p.role,
    p.email_verified_at,
    p.created_at,
    coalesce(p.custom_company_name, c.name) as company_name,
    a.iata_code as airport_code,
    s.name as station_name,
    p.blocked_at,
    p.blocked_reason
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  left join public.airports a on a.id = p.airport_id
  left join public.stations s on s.id = p.station_id
  order by p.created_at desc
  limit 200;
end;
$$;

grant execute on function public.admin_list_profiles() to authenticated;

create or replace function public.admin_block_profile(target_user_id uuid, reason text default null)
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
    raise exception 'You cannot block your own backend account.';
  end if;

  update public.profiles
  set blocked_at = coalesce(blocked_at, now()),
      blocked_reason = nullif(trim(reason), ''),
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

grant execute on function public.admin_block_profile(uuid, text) to authenticated;

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
  set banned_until = null,
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_unblock_profile(uuid) to authenticated;

create or replace function public.admin_list_shift_posts()
returns table (
  id uuid,
  category text,
  shift_date date,
  day_of_week text,
  shift_start time,
  shift_end time,
  location_team text,
  status text,
  created_at timestamptz,
  poster_email text,
  poster_name text,
  airport_code text,
  station_name text
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
    sp.status,
    sp.created_at,
    p.email as poster_email,
    coalesce(nullif(sp.poster_name_snapshot, ''), p.full_name) as poster_name,
    a.iata_code as airport_code,
    s.name as station_name
  from public.shift_posts sp
  left join public.profiles p on p.id = sp.user_id
  left join public.airports a on a.id = sp.airport_id
  left join public.stations s on s.id = sp.station_id
  order by sp.created_at desc
  limit 200;
end;
$$;

grant execute on function public.admin_list_shift_posts() to authenticated;

create or replace function public.admin_delete_shift_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_backend_owner() then
    raise exception 'Only the backend owner can manage posts.';
  end if;

  delete from public.shift_posts
  where id = target_post_id;

  if not found then
    raise exception 'Post not found.';
  end if;
end;
$$;

grant execute on function public.admin_delete_shift_post(uuid) to authenticated;
