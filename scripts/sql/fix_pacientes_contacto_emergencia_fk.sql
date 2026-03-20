-- Corrige la constraint erronea sobre public.pacientes_contacto_emergencia.id.
-- La relacion valida es id_paciente -> pacientes.id.
-- Ejecutar en Supabase SQL Editor.

alter table public.pacientes_contacto_emergencia
  drop constraint if exists pacientes_contacto_emergencia_id_fkey;
