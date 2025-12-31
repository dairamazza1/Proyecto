import { supabase } from "../index";

const schema = "test";
const table = "empleados_sanciones";
const selectFields = `
  id,
  empleado_id,
  sanction_type,
  description,
  policy_reference,
  sanction_date_start,
  sanction_date_end,
  document_id,
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
  )
`;

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

export async function deleteSancion(id) {
  const { error } = await supabase
    .schema(schema)
    .from(table)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
