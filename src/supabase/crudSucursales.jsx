import { supabase } from "../index";

const schema = "test";

// Obtener todas las sucursales de una empresa
export async function getSucursales({ empresa_id } = {}) {
  let query = supabase
    .schema(schema)
    .from("sucursales")
    .select("id, name, address, zone, province, tel")
    .order("name", { ascending: true });

  if (empresa_id) {
    query = query.eq("empresa_id", empresa_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Relacionar empleado con sucursal en la tabla sucursales_empleados
export async function insertSucursalEmpleado(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from("sucursales_empleados")
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSucursalEmpleado(empleado_id) {
  const { data, error } = await supabase
    .schema(schema)
    .from("sucursales_empleados")
    .select("id, empleado_id, sucursal_id")
    .eq("empleado_id", empleado_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertSucursalEmpleado({ empleado_id, sucursal_id }) {
  const existing = await getSucursalEmpleado(empleado_id);
  if (existing?.id) {
    const { data, error } = await supabase
      .schema(schema)
      .from("sucursales_empleados")
      .update({ sucursal_id })
      .eq("id", existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .schema(schema)
    .from("sucursales_empleados")
    .insert({ empleado_id, sucursal_id })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Obtener empleados por sucursal con join
export async function getEmpleadosBySucursal({
  sucursal_id,
  empresa_id,
  orderBy = "last_name",
  ascending = true
} = {}) {
  let query = supabase
    .schema(schema)
    .from("sucursales_empleados")
    .select(
      `
      empleado_id,
      empleados:empleado_id (
        id,
        document_number,
        first_name,
        last_name,
        puesto:puestos_laborales(name),
        empresa_id
      )
    `
    );

  if (sucursal_id) {
    query = query.eq("sucursal_id", sucursal_id);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Aplanar los datos para que sean compatibles con la tabla existente
  let empleados = data?.map((item) => item.empleados).filter(Boolean) ?? [];

  // Filtrar por empresa si se proporciona
  if (empresa_id) {
    empleados = empleados.filter((emp) => emp.empresa_id === empresa_id);
  }

  // Ordenar los resultados
  empleados.sort((a, b) => {
    const aVal = a[orderBy] ?? "";
    const bVal = b[orderBy] ?? "";
    if (ascending) {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return empleados;
}

// Buscar empleados por sucursal
export async function searchEmpleadosBySucursal({
  sucursal_id,
  empresa_id,
  search = "",
  orderBy = "last_name",
  ascending = true
} = {}) {
  const term = search?.trim();
  let empleados = await getEmpleadosBySucursal({
    sucursal_id,
    empresa_id,
    orderBy,
    ascending
  });

  if (term) {
    empleados = empleados.filter((emp) => {
      const matchName =
        emp.first_name?.toLowerCase().includes(term.toLowerCase()) ||
        emp.last_name?.toLowerCase().includes(term.toLowerCase()) ||
        emp.puesto?.name?.toLowerCase().includes(term.toLowerCase());

      const matchNumber = /^\d+$/.test(term)
        ? emp.document_number === term
        : false;

      return matchName || matchNumber;
    });
  }

  return empleados;
}
