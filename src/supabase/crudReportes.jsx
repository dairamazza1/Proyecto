import { supabase } from "../index";

const schema = "test";

function pad(value) {
  return String(value).padStart(2, "0");
}

function applyDateFilters(query, field, { year, month, day } = {}) {
  const numericYear = year ? Number(year) : null;
  const numericMonth = month ? Number(month) : null;
  const numericDay = day ? Number(day) : null;

  if (numericYear && numericMonth && numericDay) {
    const dateValue = `${numericYear}-${pad(numericMonth)}-${pad(numericDay)}`;
    return query.eq(field, dateValue);
  }

  if (numericYear && numericMonth) {
    const start = `${numericYear}-${pad(numericMonth)}-01`;
    const nextMonth = numericMonth === 12 ? 1 : numericMonth + 1;
    const nextYear = numericMonth === 12 ? numericYear + 1 : numericYear;
    const end = `${nextYear}-${pad(nextMonth)}-01`;
    return query.gte(field, start).lt(field, end);
  }

  if (numericYear) {
    const start = `${numericYear}-01-01`;
    const end = `${numericYear + 1}-01-01`;
    return query.gte(field, start).lt(field, end);
  }

  return query;
}

export async function getReportVacaciones({
  year,
  month,
  day,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    .schema(schema)
    .from("empleados_vacaciones")
    .select(
      `
      id,
      empleado_id,
      start_date,
      end_date,
      days_taken,
      status,
      created_at,
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

  query = applyDateFilters(query, "start_date", { year, month, day });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportLicencias({
  year,
  month,
  day,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    .schema(schema)
    .from("empleados_licencias")
    .select(
      `
      id,
      empleado_id,
      start_date,
      end_date,
      days,
      status,
      created_at,
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

  query = applyDateFilters(query, "start_date", { year, month, day });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportCambios({
  year,
  month,
  day,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    .schema(schema)
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
      created_at,
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

  query = applyDateFilters(query, "start_date", { year, month, day });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getReportSanciones({
  year,
  month,
  day,
  empleado_id,
  empresa_id,
} = {}) {
  let query = supabase
    .schema(schema)
    .from("empleados_sanciones")
    .select(
      `
      id,
      empleado_id,
      sanction_type,
      sanction_date_start,
      sanction_date_end,
      created_at,
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

  query = applyDateFilters(query, "sanction_date_start", { year, month, day });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
