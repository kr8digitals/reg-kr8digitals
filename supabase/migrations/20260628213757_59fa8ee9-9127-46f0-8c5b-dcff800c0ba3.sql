CREATE OR REPLACE FUNCTION public.register_member(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_name text := trim(p->>'full_name');
  v_email text := lower(trim(p->>'email'));
  v_phone text := trim(p->>'whatsapp_number');
  v_dob date := (p->>'date_of_birth')::date;
  v_skill text := upper(trim(p->>'skill_code'));
  v_age integer;
  v_seq integer;
  v_year text := to_char(now(), 'YYYY');
  v_initials text;
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

  v_initials := upper(coalesce((
    select string_agg(left(word, 1), '')
    from regexp_split_to_table(regexp_replace(v_name, '[^A-Za-z ]', '', 'g'), '\s+') as word
    where word <> ''
  ), ''));
  if v_initials = '' then v_initials := 'X'; end if;

  v_age := date_part('year', age(v_dob));
  v_seq := nextval('public.member_seq');
  v_reg := 'KR8' || v_year || v_initials || lpad(v_seq::text, 4, '0') || v_skill || 'VFD';
  v_pin := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  insert into public.members (
    full_name, email, whatsapp_number, date_of_birth, age, country,
    is_student, school_name, school_level, skill_code,
    generated_reg_number, sequence_number, change_pin
  ) values (
    v_name, v_email, v_phone, v_dob, v_age, trim(p->>'country'),
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
    'full_name', v_name,
    'email', v_email
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.reset_registration(identifier text, new_skill_code text, screenshot_url text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id text := trim(identifier);
  v_skill text := upper(trim(new_skill_code));
  m record;
  v_old_reg text;
  v_new_reg text;
  v_year text;
  v_initials text;
  v_link text;
begin
  select * into m from public.members
  where email = lower(v_id) or whatsapp_number = v_id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_old_reg := m.generated_reg_number;
  v_year := to_char(m.created_at, 'YYYY');
  v_initials := upper(coalesce((
    select string_agg(left(word, 1), '')
    from regexp_split_to_table(regexp_replace(m.full_name, '[^A-Za-z ]', '', 'g'), '\s+') as word
    where word <> ''
  ), ''));
  if v_initials = '' then v_initials := 'X'; end if;

  v_new_reg := 'KR8' || v_year || v_initials || lpad(m.sequence_number::text, 4, '0') || v_skill || 'VFD';

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
$function$;