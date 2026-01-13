import { supabase } from "../index";

const table = "empleados";
const selectFields =
  "id, document_number, first_name, last_name, puesto:puestos_laborales(name), empresa_id, employee_id_number,professional_number,telephone";
export async function getEmpleados({
  empresa_id,
  orderBy = "last_name",
  ascending = true
} = {}) {
  let query = supabase
    
    .from(table)
    .select(selectFields)
    .order(orderBy, { ascending });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }


  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function searchEmpleados({
  empresa_id,
  search = "",
  orderBy = "last_name",
  ascending = true
} = {}) {
  const term = (search ?? "").trim();
  const isNumeric = /^\d+$/.test(term);

  let q = supabase
    
    .from(table)
    .select(selectFields)
    .order(orderBy, { ascending })

  if (empresa_id) q = q.eq("empresa_id", empresa_id);

  if (!term) {
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }

  // 1) OR para columnas locales (empleados)
  const localFilters = [
    `first_name.ilike.%${term}%`,
    `last_name.ilike.%${term}%`,
    `professional_number.ilike.%${term}%`,
  ];

  if (isNumeric) {
    localFilters.push(`document_number.eq.${term}`);
    localFilters.push(`employee_id_number.eq.${term}`);
  }

  const { data: localData, error: localError } = await q.or(
    localFilters.join(",")
  );
  if (localError) throw localError;

  // 2) Busqueda por puesto (tabla relacionada)
  let puestoQuery = supabase
    
    .from("empleados")
    .select(
      "id, document_number, first_name, last_name, puesto:puestos_laborales!inner(name), empresa_id, employee_id_number, professional_number"
    )
    .order(orderBy, { ascending })
    .ilike("puestos_laborales.name", `%${term}%`);

  if (empresa_id) {
    puestoQuery = puestoQuery.eq("empresa_id", empresa_id);
  }

  const { data: puestoData, error: puestoError } = await puestoQuery;
  if (puestoError) throw puestoError;

  const merged = new Map();
  (localData ?? []).forEach((item) => merged.set(item.id, item));
  (puestoData ?? []).forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}


export async function insertEmpleado(payload) {
  const { data, error } = await supabase
    
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateEmpleado(id, payload) {
  const { data, error } = await supabase
    
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function checkEmpleadoDuplicate({
  document_number,
  employee_id_number,
  excludeId,
} = {}) {
  let documentExists = false;
  let legajoExists = false;

  if (document_number) {
    let query = supabase
      
      .from(table)
      .select("id")
      .eq("document_number", document_number)
      .limit(1);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    documentExists = (data ?? []).length > 0;
  }

  if (employee_id_number) {
    let query = supabase
      
      .from(table)
      .select("id")
      .eq("employee_id_number", employee_id_number)
      .limit(1);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    legajoExists = (data ?? []).length > 0;
  }

  return { documentExists, legajoExists };
}

export async function getEmpleadoById(id) {
  const { data, error } = await supabase
    
    .from(table)
    .select("*, puesto:puestos_laborales(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getActiveEmpleados({ empresa_id } = {}) {
  let query = supabase
    
    .from(table)
    .select("id, first_name, last_name, employee_id_number, is_active, empresa_id")
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAvailableEmpleados({ empresa_id } = {}) {
  let query = supabase
    
    .from(table)
    .select(
      "id, first_name, last_name, employee_id_number, is_active, empresa_id, user_id"
    )
    .eq("is_active", true)
    .is("user_id", null)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
