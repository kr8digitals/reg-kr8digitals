
-- Extensions
create extension if not exists pgcrypto;

-- ========== SETTINGS TABLE (group links / config) ==========
create table public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
grant all on public.settings to service_role;
alter table public.settings enable row level security;
-- No anon/authenticated policies: fully locked, server-side (service role) only.

insert into public.settings (key, value) values
  ('link_VE', 'https://chat.whatsapp.com/Ggqee4dvcRWFKANtcNcNT9'),
  ('link_WD', 'https://chat.whatsapp.com/EqdAOw1TxiM7KqTB5EXh8v'),
  ('link_FD', 'https://chat.whatsapp.com/HZEj8TF8XwJ3MDsTaklmS6'),
  ('link_GD', 'https://chat.whatsapp.com/C6GTBUWkpxMF3SneOhPyyA'),
  ('link_SM', 'https://chat.whatsapp.com/Fw6qXMR1wjcHzl3naizLwo'),
  ('link_MK', 'https://chat.whatsapp.com/KhlzuwVKKN1Et1juXp5tkS')
on conflict (key) do nothing;

-- ========== SEQUENCE for registration numbers ==========
create sequence if not exists public.member_seq start 1;

-- ========== MEMBERS TABLE (fully locked) ==========
create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  whatsapp_number text not null unique,
  date_of_birth date not null,
  age integer not null,
  country text not null,
  is_student boolean not null default false,
  school_name text,
  school_level text,
  skill_code text not null,
  generated_reg_number text not null unique,
  sequence_number integer not null,
  change_pin text not null,
  reset_screenshot_url text,
  created_at timestamptz not null default now()
);
grant all on public.members to service_role;
alter table public.members enable row level security;
-- No policies for anon/authenticated: zero direct client access (PII locked).

-- ========== RPC: register_member ==========
create or replace function public.register_member(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p->>'email'));
  v_phone text := trim(p->>'whatsapp_number');
  v_dob date := (p->>'date_of_birth')::date;
  v_skill text := upper(trim(p->>'skill_code'));
  v_age integer;
  v_seq integer;
  v_year text := to_char(now(), 'YYYY');
  v_reg text;
  v_pin text;
  v_link text;
begin
  if exists (select 1 from public.members where email = v_email) then
    return jsonb_build_object('status', 'email_exists');
  end if;
  if exists (select 1 from public.members where whatsapp_number = v_phone) then
    return jsonb_build_object('status', 'phone_exists');
  end if;

  v_age := date_part('year', age(v_dob));
  v_seq := nextval('public.member_seq');
  v_reg := 'KR8-' || v_year || lpad(v_seq::text, 4, '0') || v_skill || 'VFD';
  v_pin := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  insert into public.members (
    full_name, email, whatsapp_number, date_of_birth, age, country,
    is_student, school_name, school_level, skill_code,
    generated_reg_number, sequence_number, change_pin
  ) values (
    trim(p->>'full_name'), v_email, v_phone, v_dob, v_age, trim(p->>'country'),
    coalesce((p->>'is_student')::boolean, false),
    nullif(trim(coalesce(p->>'school_name','')), ''),
    nullif(trim(coalesce(p->>'school_level','')), ''),
    v_skill, v_reg, v_seq, v_pin
  );

  select value into v_link from public.settings where key = 'link_' || v_skill;

  return jsonb_build_object(
    'status', 'ok',
    'reg_number', v_reg,
    'skill_code', v_skill,
    'group_link', v_link,
    'full_name', trim(p->>'full_name'),
    'email', v_email
  );
end;
$$;

-- ========== RPC: recover_registration ==========
create or replace function public.recover_registration(identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := trim(identifier);
  m record;
  v_link text;
begin
  select * into m from public.members
  where email = lower(v_id) or whatsapp_number = v_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select value into v_link from public.settings where key = 'link_' || m.skill_code;

  return jsonb_build_object(
    'status', 'ok',
    'reg_number', m.generated_reg_number,
    'skill_code', m.skill_code,
    'group_link', v_link,
    'full_name', m.full_name,
    'email', m.email
  );
end;
$$;

-- ========== RPC: get_member_for_reset ==========
create or replace function public.get_member_for_reset(identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := trim(identifier);
  m record;
begin
  select * into m from public.members
  where email = lower(v_id) or whatsapp_number = v_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'reg_number', m.generated_reg_number,
    'skill_code', m.skill_code,
    'full_name', m.full_name,
    'email', m.email
  );
end;
$$;

-- ========== RPC: reset_registration ==========
create or replace function public.reset_registration(identifier text, new_skill_code text, screenshot_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := trim(identifier);
  v_skill text := upper(trim(new_skill_code));
  m record;
  v_old_reg text;
  v_new_reg text;
  v_year text;
  v_link text;
begin
  select * into m from public.members
  where email = lower(v_id) or whatsapp_number = v_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_old_reg := m.generated_reg_number;
  v_year := substr(v_old_reg, 5, 4);
  v_new_reg := 'KR8-' || v_year || lpad(m.sequence_number::text, 4, '0') || v_skill || 'VFD';

  update public.members
  set skill_code = v_skill,
      generated_reg_number = v_new_reg,
      reset_screenshot_url = screenshot_url
  where id = m.id;

  select value into v_link from public.settings where key = 'link_' || v_skill;

  return jsonb_build_object(
    'status', 'ok',
    'old_reg_number', v_old_reg,
    'reg_number', v_new_reg,
    'skill_code', v_skill,
    'group_link', v_link,
    'full_name', m.full_name,
    'email', m.email
  );
end;
$$;

-- Lock down RPC execution: server (service role) only, never anon/public.
revoke execute on function public.register_member(jsonb) from public, anon, authenticated;
revoke execute on function public.recover_registration(text) from public, anon, authenticated;
revoke execute on function public.get_member_for_reset(text) from public, anon, authenticated;
revoke execute on function public.reset_registration(text, text, text) from public, anon, authenticated;
grant execute on function public.register_member(jsonb) to service_role;
grant execute on function public.recover_registration(text) to service_role;
grant execute on function public.get_member_for_reset(text) to service_role;
grant execute on function public.reset_registration(text, text, text) to service_role;
