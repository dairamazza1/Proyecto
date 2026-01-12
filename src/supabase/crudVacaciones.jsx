import { supabase } from "../index";

const table = "empleados_vacaciones";
const selectFields =
  "id, empleado_id, start_date, end_date, days_taken, status, created_at, approved_at, rejected_reason";

export async function getVacacionesByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertVacacion(payload) {
  const { data, error } = await supabase
    
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateVacacion(id, payload) {
  const { data, error } = await supabase
    
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteVacacion(id) {
  const { error } = await supabase
    
    .from(table)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
