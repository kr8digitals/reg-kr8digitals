
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
  v_pin := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

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
