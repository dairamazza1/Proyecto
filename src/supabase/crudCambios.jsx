import { supabase } from "../index";

const schema = "test";
const table = "empleados_cambios_actividades";
const selectFields =
  "id, empleado_id, previous_schedule, new_schedule, previous_tasks, new_tasks, change_reason, effective_date, status, empleado_replace_id, created_at";

export async function getCambiosByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("effective_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertCambio(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCambio(id, payload) {
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
