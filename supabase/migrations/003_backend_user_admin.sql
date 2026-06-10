create or replace function public.is_backend_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(email) in ('patricio.gerardo@delta.com')
  );
$$;

grant execute on function public.is_backend_owner() to authenticated;

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
  station_name text
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
    s.name as station_name
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  left join public.airports a on a.id = p.airport_id
  left join public.stations s on s.id = p.station_id
  order by p.created_at desc
  limit 200;
end;
$$;

grant execute on function public.admin_list_profiles() to authenticated;

create or replace function public.admin_update_profile_role(target_user_id uuid, new_role text)
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
    raise exception 'You cannot change your own backend role.';
  end if;

  if new_role not in ('regular_user', 'station_admin', 'airport_admin') then
    raise exception 'Invalid role.';
  end if;

  update public.profiles
  set role = new_role,
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;
end;
$$;

grant execute on function public.admin_update_profile_role(uuid, text) to authenticated;

create or replace function public.admin_verify_profile(target_user_id uuid)
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
  set email_verified_at = coalesce(email_verified_at, now()),
      updated_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;

  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_verify_profile(uuid) to authenticated;

create or replace function public.admin_delete_user(target_user_id uuid)
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
    raise exception 'You cannot delete your own backend account.';
  end if;

  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'User not found.';
  end if;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
