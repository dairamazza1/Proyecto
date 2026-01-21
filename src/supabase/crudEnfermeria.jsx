import { supabase } from "../index";

const table = "enfermeria_registros";
const selectFields = `
  id,
  empleado_id,
  shift,
  registro_date,
  registro_time,
  details,
  created_by,
  created_at,
  sucursal_id,
  creador:perfiles!enfermeria_registros_created_by_fkey(
    id,
    email,
    empleado:empleados(id, first_name, last_name)
  )
`;

export async function getEnfermeriaRecords({
  sucursalId,
  date,
  shift,
} = {}) {
  if (!sucursalId || !date || !shift) return [];

  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .eq("sucursal_id", sucursalId)
    .eq("registro_date", date)
    .eq("shift", shift)
    .order("registro_time", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertEnfermeriaRecord(payload) {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateEnfermeriaRecord(id, payload) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentUserSucursalId() {
  const { data, error } = await supabase.rpc("current_user_sucursal_id");
  if (error) throw error;
  return data ?? null;
}
