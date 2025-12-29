import { supabase } from "../index";

const schema = "test";
const table = "empleados";
const selectFields =
  "id, document_number, first_name, last_name, puesto:puestos_laborales(name), empresa_id, employee_id_number,professional_number";
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
  let baseQuery = supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .order(orderBy, { ascending });

  if (empresa_id) {
    baseQuery = baseQuery.eq("empresa_id", empresa_id);
  }

  if (!term) {
    const { data, error } = await baseQuery;
    if (error) throw error;
    return data ?? [];
  }

  const filters = [
    `first_name.ilike.%${term}%`,
    `last_name.ilike.%${term}%`,
  ];

  if (/^\d+$/.test(term)) {
    filters.push(`document_number.eq.${term}`);
  }

  const { data: localData, error: localError } = await baseQuery.or(
    filters.join(",")
  );
  if (localError) throw localError;

  let puestoQuery = supabase
    .schema(schema)
    .from(table)
    .select("id, document_number, first_name, last_name, puesto:puestos_laborales!inner(name), empresa_id")
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
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getEmpleadoById(id) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select("*, puesto:puestos_laborales(name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
