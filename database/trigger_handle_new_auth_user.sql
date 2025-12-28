-- =========================
-- 0) Schema target
-- =========================
create schema if not exists test;

-- ============================================================
-- 1) Trigger: al registrarse en Supabase Auth -> crear perfil
--    - Primer usuario: superadmin
--    - Resto: employee
-- ============================================================
create or replace function test.handle_new_auth_user()
returns trigger
language plpgsql
set search_path = test, public

as $$
declare
  role_name text;
begin
  if not exists (select 1 from test.perfiles) then
    role_name := 'superadmin';
  else
    role_name := 'employee';
  end if;

  insert into test.perfiles (auth_user_id, email, is_active, app_role, created_at)
  values (NEW.id, NEW.email, true, role_name, now())
  on conflict (auth_user_id) do update
    set email = excluded.email;

  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function test.handle_new_auth_user();
