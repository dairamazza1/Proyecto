-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE test.areas_laborales (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying NOT NULL,
  CONSTRAINT areas_laborales_pkey PRIMARY KEY (id)
);
CREATE TABLE test.empleados (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  empresa_id bigint DEFAULT '1'::bigint,
  user_id bigint,
  first_name character varying,
  last_name character varying,
  document_type character varying DEFAULT 'DNI'::character varying,
  document_number character varying UNIQUE,
  is_registered boolean,
  is_active boolean,
  created_at timestamp without time zone NOT NULL,
  hire_date date,
  employee_id_number character varying,
  professional_number character varying,
  puesto_id bigint,
  CONSTRAINT empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_user_id_fkey FOREIGN KEY (user_id) REFERENCES test.perfiles(id),
  CONSTRAINT empleados_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES test.empresas(id),
  CONSTRAINT empleados_puesto_id_fkey FOREIGN KEY (puesto_id) REFERENCES test.puestos_laborales(id)
);
CREATE TABLE test.empleados_cambios_actividades (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  document_id bigint,
  previous_schedule time without time zone,
  new_schedule time without time zone,
  previous_tasks text,
  new_tasks text,
  change_reason text,
  effective_date date,
  empleado_id bigint,
  empleado_replace_id bigint,
  approved_by bigint,
  approved_at date,
  rejected_reason text,
  created_by bigint,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  CONSTRAINT empleados_cambios_actividades_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_cambios_actividades_document_id_fkey FOREIGN KEY (document_id) REFERENCES test.empleados_documentos(id),
  CONSTRAINT empleados_cambios_actividades_empleado_replace_id_fkey FOREIGN KEY (empleado_replace_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_cambios_actividades_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES test.perfiles(id),
  CONSTRAINT empleados_cambios_actividades_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES test.perfiles(id)
);
CREATE TABLE test.empleados_documentos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  empleado_id bigint,
  document_type character varying,
  document_date date,
  end_date date,
  file_path text UNIQUE,
  created_by bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empleados_documentos_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_documentos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_documentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES test.perfiles(id)
);
CREATE TABLE test.empleados_licencias (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  empleado_id bigint,
  license_type character varying,
  start_date date,
  end_date date,
  days bigint,
  reason text,
  certificate_url text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_by bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_by bigint,
  approved_at date,
  rejected_reason text,
  CONSTRAINT licencias_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_licencias_created_by_fkey FOREIGN KEY (created_by) REFERENCES test.perfiles(id),
  CONSTRAINT empleados_licencias_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES test.perfiles(id)
);
CREATE TABLE test.empleados_sanciones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  document_id bigint,
  sanction_type character varying,
  description text,
  policy_reference text,
  type_duration text,
  sanction_date_end date,
  empleado_id bigint,
  sanction_date_start date,
  CONSTRAINT empleados_sanciones_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_sanciones_document_id_fkey FOREIGN KEY (document_id) REFERENCES test.empleados_documentos(id)
);
CREATE TABLE test.empleados_vacaciones (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  empleado_id bigint,
  start_date date,
  end_date date,
  days_taken bigint,
  created_by bigint,
  created_at date NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  approved_by bigint,
  approved_at date,
  rejected_reason text,
  CONSTRAINT empleados_vacaciones_pkey PRIMARY KEY (id),
  CONSTRAINT employee_vacations_employee_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_vacaciones_created_by_fkey FOREIGN KEY (created_by) REFERENCES test.perfiles(id),
  CONSTRAINT empleados_vacaciones_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES test.perfiles(id)
);
CREATE TABLE test.empresas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  cuit text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empresas_pkey PRIMARY KEY (id)
);
CREATE TABLE test.perfiles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email character varying,
  is_active boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  auth_user_id uuid UNIQUE,
  app_role character varying NOT NULL DEFAULT 'employee'::character varying,
  CONSTRAINT perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE test.puestos_laborales (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  id_area bigint,
  name text,
  requires_professional_number boolean,
  CONSTRAINT puestos_laborales_pkey PRIMARY KEY (id),
  CONSTRAINT puestos_laborales_id_area_fkey FOREIGN KEY (id_area) REFERENCES test.areas_laborales(id)
);
CREATE TABLE test.sucursales (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  empresa_id bigint,
  name character varying,
  address character varying,
  zone character varying,
  province character varying,
  tel character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sucursales_pkey PRIMARY KEY (id),
  CONSTRAINT sucursales_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES test.empresas(id)
);
CREATE TABLE test.sucursales_empleados (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  empleado_id bigint,
  sucursal_id bigint,
  CONSTRAINT sucursales_empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_sucursales_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES test.empleados(id),
  CONSTRAINT empleados_sucursales_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES test.sucursales(id)
);