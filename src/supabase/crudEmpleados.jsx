import { supabase } from "../index";

const schema = "test";
const table = "empleados";
const selectFields =
  "id, document_number, first_name, last_name, employee_type, empresa_id";
export async function getEmpleados({
  empresa_id,
  orderBy = "last_name",
  ascending = true
} = {}) {
  let query = supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .order(orderBy, { ascending });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  // TODO: usar sucursal_id con test.sucursales_empleados cuando se implemente filtro.

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
  const term = search?.trim();
  let query = supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .order(orderBy, { ascending });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  if (term) {
    const filters = [
      `first_name.ilike.%${term}%`,
      `last_name.ilike.%${term}%`,
      `employee_type.ilike.%${term}%`,
    ];

    if (/^\d+$/.test(term)) {
      filters.push(`document_number.eq.${term}`);
    }

    query = query.or(filters.join(","));
  }

  // TODO: usar sucursal_id con test.sucursales_empleados cuando se implemente filtro.

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function insertEmpleado(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
