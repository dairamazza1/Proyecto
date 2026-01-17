import { supabase } from "../index";


function applyDateRange(query, field, { fromDate, toDate } = {}) {
  let start = fromDate ? String(fromDate).trim() : "";
  let end = toDate ? String(toDate).trim() : "";

  if (start && end && start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  if (start) {
    query = query.gte(field, start);
  }

  if (end) {
    query = query.lte(field, end);
  }

  return query;
}

export async function getReportVacaciones({
  fromDate,
  toDate,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    
    .from("empleados_vacaciones")
    .select(
      `
      id,
      empleado_id,
      start_date,
      end_date,
      days_taken,
      status,
      verified_by,
      created_at,
      verificador:perfiles!empleados_vacaciones_verified_by_fkey(
        id,
        email,
        empleado:empleados(id, first_name, last_name)
      ),
      empleado:empleados!empleado_id!inner(
        id,
        first_name,
        last_name,
        employee_id_number,
        is_active,
        empresa_id
      )
    `
    )
    .order("start_date", { ascending: false });

  if (empleado_id) {
    query = query.eq("empleado_id", empleado_id);
  }
  if (empresa_id) {
    query = query.eq("empleado.empresa_id", empresa_id);
  }

  query = applyDateRange(query, "start_date", { fromDate, toDate });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportLicencias({
  fromDate,
  toDate,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    
    .from("empleados_licencias")
    .select(
      `
      id,
      empleado_id,
      start_date,
      end_date,
      days,
      status,
      verified_by,
      created_at,
      verificador:perfiles!empleados_licencias_verified_by_fkey(
        id,
        email,
        empleado:empleados(id, first_name, last_name)
      ),
      licencia_tipo:licencias_tipos(name),
      empleado:empleados!inner(
        id,
        first_name,
        last_name,
        employee_id_number,
        is_active,
        empresa_id
      )
    `
    )
    .order("start_date", { ascending: false });

  if (empleado_id) {
    query = query.eq("empleado_id", empleado_id);
  }
  if (empresa_id) {
    query = query.eq("empleado.empresa_id", empresa_id);
  }

  query = applyDateRange(query, "start_date", { fromDate, toDate });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportCambios({
  fromDate,
  toDate,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    
    .from("empleados_cambios_actividades")
    .select(
      `
      id,
      empleado_id,
      change_reason,
      previous_schedule,
      new_schedule,
      start_date,
      end_date,
      status,
      verified_by,
      created_at,
      verificador:perfiles!empleados_cambios_actividades_verified_by_fkey(
        id,
        email,
        empleado:empleados(id, first_name, last_name)
      ),
      empleado:empleados!empleado_id!inner(
        id,
        first_name,
        last_name,
        employee_id_number,
        is_active,
        empresa_id
      ),
      empleado_reemplazo:empleados!empleado_replace_id(
        id,
        first_name,
        last_name
      )
    `
    )
    .order("start_date", { ascending: false });

  if (empleado_id) {
    query = query.eq("empleado_id", empleado_id);
  }
  if (empresa_id) {
    query = query.eq("empleado.empresa_id", empresa_id);
  }

  query = applyDateRange(query, "start_date", { fromDate, toDate });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportSanciones({
  fromDate,
  toDate,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    
    .from("empleados_sanciones")
    .select(
      `
      id,
      empleado_id,
      sanction_type,
      sanction_date_start,
      sanction_date_end,
      created_by,
      created_at,
      creador:perfiles!empleados_sanciones_created_by_fkey(
        id,
        email,
        empleado:empleados(id, first_name, last_name)
      ),
      empleado:empleados!inner(
        id,
        first_name,
        last_name,
        employee_id_number,
        is_active,
        empresa_id
      )
    `
    )
    .order("sanction_date_start", { ascending: false });

  if (empleado_id) {
    query = query.eq("empleado_id", empleado_id);
  }
  if (empresa_id) {
    query = query.eq("empleado.empresa_id", empresa_id);
  }

  query = applyDateRange(query, "sanction_date_start", { fromDate, toDate });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
