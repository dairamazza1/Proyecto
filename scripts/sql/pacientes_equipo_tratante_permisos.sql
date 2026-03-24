-- ==========================================================
-- Pacientes + equipo tratante + permisos clinicos por ingreso
-- ==========================================================

-- 1) Modelo minimo para elegibilidad clinica y equipo por ingreso
alter table public.areas_laborales
  add column if not exists grants_patient_clinical_permissions boolean not null default false;

alter table public.pacientes_equipo_tratante
  add column if not exists ingreso_id bigint null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pacientes_equipo_tratante_ingreso_id_fkey'
      and conrelid = 'public.pacientes_equipo_tratante'::regclass
  ) then
    alter table public.pacientes_equipo_tratante
      add constraint pacientes_equipo_tratante_ingreso_id_fkey
      foreign key (ingreso_id)
      references public.pacientes_ingresos (id)
      on delete cascade;
  end if;
end
$$;

create index if not exists idx_pacientes_equipo_tratante_ingreso
  on public.pacientes_equipo_tratante (ingreso_id);

create index if not exists idx_pacientes_equipo_tratante_paciente_ingreso
  on public.pacientes_equipo_tratante (paciente_id, ingreso_id);

create unique index if not exists ux_pacientes_equipo_tratante_ingreso_empleado_active
  on public.pacientes_equipo_tratante (ingreso_id, empleado_id)
  where ingreso_id is not null and end_date is null;

with ingreso_activo as (
  select distinct on (i.paciente_id)
    i.paciente_id,
    i.id as ingreso_id
  from public.pacientes_ingresos i
  where i.status = 'admitted'
    and i.discharge_at is null
  order by i.paciente_id, i.admission_at desc, i.id desc
)
update public.pacientes_equipo_tratante pet
set ingreso_id = ia.ingreso_id
from ingreso_activo ia
where pet.ingreso_id is null
  and pet.paciente_id = ia.paciente_id
  and (pet.end_date is null or pet.end_date >= current_date);

insert into public.funcionalidades (name)
select feature_name
from (
  values
    ('pacientes'),
    ('evolucion'),
    ('indicaciones'),
    ('estudios')
) as pending(feature_name)
where not exists (
  select 1
  from public.funcionalidades f
  where lower(f.name) = lower(pending.feature_name)
);

-- 2) Helpers de permisos globales y clinicos
create or replace function public.app_current_empleado_puesto_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select e.puesto_id
  from public.empleados e
  where e.id = public.app_current_empleado_id()
  limit 1
$$;

create or replace function public.app_has_feature_permission(
  p_feature_name text,
  p_action text default 'view'
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role_id bigint;
  v_puesto_id bigint;
  v_action text;
  v_result boolean := false;
begin
  v_role_id := public.app_current_role_id();
  v_puesto_id := public.app_current_empleado_puesto_id();
  v_action := lower(trim(coalesce(p_action, 'view')));

  if v_role_id is null or trim(coalesce(p_feature_name, '')) = '' then
    return false;
  end if;

  select
    case v_action
      when 'create' then coalesce(fr.can_create, false)
      when 'update' then coalesce(fr.can_update, false)
      when 'delete' then coalesce(fr.can_delete, false)
      when 'validate' then coalesce(fr.can_validate, false)
      else coalesce(fr.can_view, false)
    end
  into v_result
  from public.funcionalidades_roles fr
  join public.funcionalidades f on f.id = fr.feature_id
  where fr.app_role_id = v_role_id
    and lower(f.name) = lower(trim(p_feature_name))
    and (fr.puesto_id = v_puesto_id or fr.puesto_id is null)
  order by
    case
      when v_puesto_id is not null and fr.puesto_id = v_puesto_id then 0
      else 1
    end,
    fr.id desc
  limit 1;

  return coalesce(v_result, false);
end;
$$;

create or replace function public.app_current_empleado_is_patient_clinical_eligible()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empleados e
    join public.puestos_laborales pl on pl.id = e.puesto_id
    join public.areas_laborales al on al.id = pl.id_area
    where e.id = public.app_current_empleado_id()
      and coalesce(e.is_active, true) = true
      and coalesce(al.grants_patient_clinical_permissions, false) = true
  )
$$;

create or replace function public.app_is_active_paciente_team_member_for_ingreso(
  p_ingreso_id bigint,
  p_paciente_id bigint default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select
      p_ingreso_id as ingreso_id,
      coalesce(
        p_paciente_id,
        (
          select i.paciente_id
          from public.pacientes_ingresos i
          where i.id = p_ingreso_id
          limit 1
        )
      ) as paciente_id
  )
  select exists (
    select 1
    from public.pacientes_equipo_tratante pet
    cross join target t
    where t.ingreso_id is not null
      and pet.empleado_id = public.app_current_empleado_id()
      and (pet.end_date is null or pet.end_date >= current_date)
      and (
        pet.ingreso_id = t.ingreso_id
        or (pet.ingreso_id is null and pet.paciente_id = t.paciente_id)
      )
  )
$$;

create or replace function public.app_can_manage_patient_clinical_feature(
  p_feature text,
  p_ingreso_id bigint,
  p_paciente_id bigint,
  p_action text default 'create'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.app_is_admin()
    or (
      public.app_has_feature_permission(p_feature, p_action)
      and public.app_can_read_ingreso(p_ingreso_id)
      and public.app_current_empleado_is_patient_clinical_eligible()
      and public.app_is_active_paciente_team_member_for_ingreso(
        p_ingreso_id,
        p_paciente_id
      )
    )
$$;

-- 3) Scope de lectura/escritura del modulo Pacientes + modulo por permiso global
create or replace function public.app_can_read_ingreso(p_ingreso_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.app_has_feature_permission('pacientes', 'view')
    and case
      when public.app_current_role_id() in (1, 2, 4) then exists (
        select 1
        from public.pacientes_ingresos i
        where i.id = p_ingreso_id
          and i.empresa_id = public.app_current_empresa_id()
      )
      when public.app_current_role_id() = 3 then exists (
        select 1
        from public.pacientes_ingresos i
        where i.id = p_ingreso_id
          and i.empresa_id = public.app_current_empresa_id()
          and i.sucursal_id = public.app_current_sucursal_id()
      )
      else false
    end
$$;

create or replace function public.app_can_read_paciente(p_paciente_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.app_has_feature_permission('pacientes', 'view')
    and case
      when public.app_current_role_id() in (1, 2, 4) then exists (
        select 1
        from public.pacientes p
        where p.id = p_paciente_id
          and p.empresa_id = public.app_current_empresa_id()
      )
      when public.app_current_role_id() = 3 then exists (
        select 1
        from public.pacientes p
        join public.pacientes_ingresos i on i.paciente_id = p.id
        where p.id = p_paciente_id
          and p.empresa_id = public.app_current_empresa_id()
          and i.sucursal_id = public.app_current_sucursal_id()
      )
      else false
    end
$$;

create or replace function public.app_can_write_ingreso_sucursal(p_sucursal_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.app_has_feature_permission('pacientes', 'update')
    and case
      when p_sucursal_id is null then false
      when public.app_current_role_id() in (1, 2) then exists (
        select 1
        from public.sucursales s
        where s.id = p_sucursal_id
          and s.empresa_id = public.app_current_empresa_id()
      )
      when public.app_current_role_id() = 3 then
        p_sucursal_id = public.app_current_sucursal_id()
      else false
    end
$$;

-- 4) Policies
drop policy if exists pacientes_update on public.pacientes;
create policy pacientes_update
on public.pacientes
for update
to authenticated
using (
  empresa_id = public.app_current_empresa_id()
  and public.app_has_feature_permission('pacientes', 'update')
  and public.app_can_read_paciente(id)
)
with check (
  empresa_id = public.app_current_empresa_id()
);

drop policy if exists pacientes_ingresos_update on public.pacientes_ingresos;
create policy pacientes_ingresos_update
on public.pacientes_ingresos
for update
to authenticated
using (
  public.app_has_feature_permission('pacientes', 'update')
  and public.app_can_read_ingreso(id)
)
with check (
  empresa_id = public.app_current_empresa_id()
  and public.app_can_write_ingreso_sucursal(sucursal_id)
);

drop policy if exists pacientes_equipo_tratante_access on public.pacientes_equipo_tratante;
drop policy if exists pacientes_equipo_tratante_select on public.pacientes_equipo_tratante;
drop policy if exists pacientes_equipo_tratante_insert on public.pacientes_equipo_tratante;
drop policy if exists pacientes_equipo_tratante_update on public.pacientes_equipo_tratante;

create policy pacientes_equipo_tratante_select
on public.pacientes_equipo_tratante
for select
to authenticated
using (
  (ingreso_id is not null and public.app_can_read_ingreso(ingreso_id))
  or (ingreso_id is null and public.app_can_read_paciente(paciente_id))
);

create policy pacientes_equipo_tratante_insert
on public.pacientes_equipo_tratante
for insert
to authenticated
with check (
  ingreso_id is not null
  and public.app_has_feature_permission('pacientes', 'update')
  and public.app_can_read_ingreso(ingreso_id)
);

create policy pacientes_equipo_tratante_update
on public.pacientes_equipo_tratante
for update
to authenticated
using (
  ingreso_id is not null
  and public.app_has_feature_permission('pacientes', 'update')
  and public.app_can_read_ingreso(ingreso_id)
)
with check (
  ingreso_id is not null
  and public.app_has_feature_permission('pacientes', 'update')
  and public.app_can_read_ingreso(ingreso_id)
);

drop policy if exists pacientes_evoluciones_access on public.pacientes_evoluciones;
drop policy if exists pacientes_evoluciones_select on public.pacientes_evoluciones;
drop policy if exists pacientes_evoluciones_insert on public.pacientes_evoluciones;
drop policy if exists pacientes_evoluciones_update on public.pacientes_evoluciones;

create policy pacientes_evoluciones_select
on public.pacientes_evoluciones
for select
to authenticated
using (
  ingreso_id is not null
  and public.app_can_read_ingreso(ingreso_id)
);

create policy pacientes_evoluciones_insert
on public.pacientes_evoluciones
for insert
to authenticated
with check (
  ingreso_id is not null
  and public.app_can_manage_patient_clinical_feature(
    'evolucion',
    ingreso_id,
    paciente_id,
    'create'
  )
);

create policy pacientes_evoluciones_update
on public.pacientes_evoluciones
for update
to authenticated
using (
  public.app_is_today_argentina(evolution_at)
  and (
    public.app_is_admin()
    or (
      created_by = public.app_current_perfil_id()
      and public.app_can_manage_patient_clinical_feature(
        'evolucion',
        ingreso_id,
        paciente_id,
        'update'
      )
    )
  )
)
with check (
  public.app_is_today_argentina(evolution_at)
  and (
    public.app_is_admin()
    or (
      created_by = public.app_current_perfil_id()
      and public.app_can_manage_patient_clinical_feature(
        'evolucion',
        ingreso_id,
        paciente_id,
        'update'
      )
    )
  )
);

drop policy if exists pacientes_indicaciones_access on public.pacientes_indicaciones;
drop policy if exists pacientes_indicaciones_select on public.pacientes_indicaciones;
drop policy if exists pacientes_indicaciones_insert on public.pacientes_indicaciones;
drop policy if exists pacientes_indicaciones_update on public.pacientes_indicaciones;

create policy pacientes_indicaciones_select
on public.pacientes_indicaciones
for select
to authenticated
using (
  ingreso_id is not null
  and public.app_can_read_ingreso(ingreso_id)
);

create policy pacientes_indicaciones_insert
on public.pacientes_indicaciones
for insert
to authenticated
with check (
  ingreso_id is not null
  and public.app_can_manage_patient_clinical_feature(
    'indicaciones',
    ingreso_id,
    paciente_id,
    'create'
  )
);

create policy pacientes_indicaciones_update
on public.pacientes_indicaciones
for update
to authenticated
using (
  ingreso_id is not null
  and (
    public.app_is_admin()
    or (
      created_by = public.app_current_perfil_id()
      and public.app_can_manage_patient_clinical_feature(
        'indicaciones',
        ingreso_id,
        paciente_id,
        'update'
      )
    )
  )
)
with check (
  ingreso_id is not null
  and (
    public.app_is_admin()
    or (
      created_by = public.app_current_perfil_id()
      and public.app_can_manage_patient_clinical_feature(
        'indicaciones',
        ingreso_id,
        paciente_id,
        'update'
      )
    )
  )
);

drop policy if exists pacientes_estudios_access on public.pacientes_estudios;
drop policy if exists pacientes_estudios_select on public.pacientes_estudios;
drop policy if exists pacientes_estudios_insert on public.pacientes_estudios;
drop policy if exists pacientes_estudios_update on public.pacientes_estudios;

create policy pacientes_estudios_select
on public.pacientes_estudios
for select
to authenticated
using (
  ingreso_id is not null
  and public.app_can_read_ingreso(ingreso_id)
);

create policy pacientes_estudios_insert
on public.pacientes_estudios
for insert
to authenticated
with check (
  ingreso_id is not null
  and public.app_can_manage_patient_clinical_feature(
    'estudios',
    ingreso_id,
    paciente_id,
    'create'
  )
);

create policy pacientes_estudios_update
on public.pacientes_estudios
for update
to authenticated
using (
  ingreso_id is not null
  and public.app_can_manage_patient_clinical_feature(
    'estudios',
    ingreso_id,
    paciente_id,
    'update'
  )
)
with check (
  ingreso_id is not null
  and public.app_can_manage_patient_clinical_feature(
    'estudios',
    ingreso_id,
    paciente_id,
    'update'
  )
);
