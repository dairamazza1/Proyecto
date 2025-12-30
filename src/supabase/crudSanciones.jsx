import { supabase } from "../index";

const schema = "test";
const table = "empleados_sanciones";
const selectFields =
  "id, empleado_id, sanction_type, description, policy_reference, sanction_date_start, sanction_date_end, document_id, created_at";

export async function getSancionesByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("sanction_date_start", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertSancion(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSancion(id, payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}
