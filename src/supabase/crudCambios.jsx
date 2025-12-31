import { supabase } from "../index";

const schema = "test";
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
  empleado_replace_id,
  created_at,
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
      sucursal:sucursales(id, name, address)
    )
  ),
  empleado_reemplazo:empleados!empleado_replace_id(
    id,
    first_name,
    last_name,
    is_active
  )
`;

export async function getEmpleadoCambioContext(empleadoId) {
  if (!empleadoId) return null;
  const { data, error } = await supabase
    .schema(schema)
    .from("empleados")
    .select(
      `
      id,
      empresa_id,
      puesto_id,
      puesto:puestos_laborales(id_area),
      sucursal:sucursales_empleados(sucursal_id)
    `
    )
    .eq("id", empleadoId)
    .maybeSingle();

  if (error) throw error;

  const sucursalData = Array.isArray(data?.sucursal)
    ? data.sucursal[0]
    : data?.sucursal;

  return {
    empleado_id: data?.id ?? empleadoId,
    empresa_id: data?.empresa_id ?? null,
    puesto_id: data?.puesto_id ?? null,
    area_id: data?.puesto?.id_area ?? null,
    sucursal_id: sucursalData?.sucursal_id ?? null,
  };
}

export async function getEmpleadosReemplazoOptions({ empleadoId }) {
  if (!empleadoId) return [];
  const context = await getEmpleadoCambioContext(empleadoId);

  if (!context?.sucursal_id || !context?.area_id) {
    return [];
  }

  const { data, error } = await supabase
    .schema(schema)
    .from("empleados")
    .select(
      `
      id,
      first_name,
      last_name,
      is_active,
      puestos_laborales!inner(id_area),
      sucursales_empleados!inner(sucursal_id)
    `
    )
    .eq("sucursales_empleados.sucursal_id", context.sucursal_id)
    .eq("puestos_laborales.id_area", context.area_id)
    .eq("is_active", true)
    .neq("id", empleadoId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw error;

  const unique = new Map();
  (data ?? []).forEach((item) => {
    if (!item?.id) return;
    const firstName = item.first_name ?? "";
    const lastName = item.last_name ?? "";
    unique.set(item.id, {
      id: item.id,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
    });
  });
  return Array.from(unique.values());
}

export async function getCambiosByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("created_at", { ascending: false });
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

export async function deleteCambio(id) {
  const { error } = await supabase
    .schema(schema)
    .from(table)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
