
create or replace function public.check_member_exists(p_email text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_phone text := trim(coalesce(p_phone, ''));
begin
  if v_email <> '' and exists (select 1 from public.members where email = v_email) then
    return jsonb_build_object('status', 'email_exists');
  end if;
  if v_phone <> '' and exists (select 1 from public.members where whatsapp_number = v_phone) then
    return jsonb_build_object('status', 'phone_exists');
  end if;
  return jsonb_build_object('status', 'ok');
end;
$$;

revoke execute on function public.check_member_exists(text, text) from public, anon, authenticated;
grant execute on function public.check_member_exists(text, text) to service_role;
