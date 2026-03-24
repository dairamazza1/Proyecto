create table if not exists public.pacientes_estudios_archivos (
  id bigint generated always as identity not null,
  estudio_id bigint not null,
  file_path text not null,
  file_name text not null,
  mime_type text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by bigint null,
  updated_by bigint null,
  constraint pacientes_estudios_archivos_pkey primary key (id),
  constraint pacientes_estudios_archivos_estudio_id_fkey
    foreign key (estudio_id)
    references public.pacientes_estudios (id)
    on delete cascade,
  constraint pacientes_estudios_archivos_created_by_fkey
    foreign key (created_by)
    references public.perfiles (id),
  constraint pacientes_estudios_archivos_updated_by_fkey
    foreign key (updated_by)
    references public.perfiles (id)
) tablespace pg_default;

create index if not exists idx_pacientes_estudios_archivos_estudio
  on public.pacientes_estudios_archivos using btree (estudio_id) tablespace pg_default;

create unique index if not exists ux_pacientes_estudios_archivos_file_path
  on public.pacientes_estudios_archivos using btree (file_path) tablespace pg_default;

alter table public.pacientes_estudios_archivos enable row level security;

drop policy if exists pacientes_estudios_archivos_access
  on public.pacientes_estudios_archivos;

create policy pacientes_estudios_archivos_access
on public.pacientes_estudios_archivos
for all
to authenticated
using (
  exists (
    select 1
    from public.pacientes_estudios e
    where e.id = estudio_id
      and e.ingreso_id is not null
      and public.app_can_read_ingreso(e.ingreso_id)
  )
)
with check (
  exists (
    select 1
    from public.pacientes_estudios e
    where e.id = estudio_id
      and e.ingreso_id is not null
      and public.app_can_read_ingreso(e.ingreso_id)
  )
);

drop trigger if exists trg_pacientes_estudios_archivos_audit
on public.pacientes_estudios_archivos;

create trigger trg_pacientes_estudios_archivos_audit
before insert or update on public.pacientes_estudios_archivos
for each row
execute function public.trg_set_created_updated_by();
