import { supabase } from "./supabase.config.jsx";

const table = "empleados_cambios_actividades";
const selectFields = `
  id,
  empleado_id,
  previous_schedule,
  new_schedule,
  previous_tasks,
  new_tasks,
  change_reason,
  duration_type,
  start_date,
  end_date,
  status,
  created_by,
  created_at,
  verified_by,
  verified_at,
  creador:perfiles!empleados_cambios_actividades_created_by_fkey(
    id,
    email,
    empleado:empleados(id, first_name, last_name)
  ),
  verificador:perfiles!empleados_cambios_actividades_verified_by_fkey(
    id,
    email,
    empleado:empleados(id, first_name, last_name)
  ),
  empleado:empleados!empleado_id(
    id,
    first_name,
    last_name,
    document_type,
    document_number,
    empresa_id,
    empresa:empresas(id, name),
    puesto:puestos_laborales(id, name),
    sucursal:sucursales_empleados(
      sucursal:sucursales(id, name, address, banner_template)
    )
  )
`;

export async function getCambiosByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertCambio(payload) {
  const { data, error } = await supabase
    
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateCambio(id, payload) {
  const { data, error } = await supabase
    
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteCambio(id) {
  const { error } = await supabase
    
    .from(table)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
