import { supabase, getPuestoById, getSucursalEmpleado } from "../index";

const table = "empleados_faltas";
const tableCategorias = "faltas_categorias";
const tableTipos = "faltas_tipos";
const bucketDocuments = "documents";
const documentsFolder = "licencias";
const selectFields = `
  id,
  empleado_id,
  falta_tipo_id,
  start_date,
  end_date,
  days,
  observations,
  document_id,
  status,
  created_by,
  created_at,
  verified_by,
  verified_at,
  is_justified,
  empleado_replace_id,
  creador:perfiles!empleados_faltas_created_by_fkey(
    id,
    email,
    empleado:empleados(id, first_name, last_name)
  ),
  verificador:perfiles!empleados_faltas_verified_by_fkey(
    id,
    email,
    empleado:empleados(id, first_name, last_name)
  ),
  falta_tipo:faltas_tipos(
    id,
    name,
    requires_certificate,
    categoria_falta_id,
    categoria:faltas_categorias(id, name)
  ),
  empleado_reemplazo:empleados!empleados_faltas_empleado_replace_id_fkey(
    id,
    first_name,
    last_name,
    is_active
  ),
  documento:empleados_documentos(id, file_path, document_type)
`;

async function getEmpleadoFaltaContext(empleadoId) {
  if (!empleadoId) return null;
  const { data, error } = await supabase
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

  if (!data) return null;

  const sucursalData = Array.isArray(data?.sucursal)
    ? data.sucursal[0]
    : data?.sucursal;

  let areaId = data?.puesto?.id_area ?? null;
  if (!areaId && data?.puesto_id) {
    const puesto = await getPuestoById(data.puesto_id);
    areaId = puesto?.id_area ?? null;
  }

  let sucursalId = sucursalData?.sucursal_id ?? null;
  if (!sucursalId) {
    const sucursalEmpleado = await getSucursalEmpleado(empleadoId);
    sucursalId = sucursalEmpleado?.sucursal_id ?? null;
  }

  return {
    empleado_id: data?.id ?? empleadoId,
    empresa_id: data?.empresa_id ?? null,
    puesto_id: data?.puesto_id ?? null,
    area_id: areaId,
    sucursal_id: sucursalId,
  };
}

export async function getEmpleadosReemplazoOptions({ empleadoId }) {
  if (!empleadoId) return [];
  const context = await getEmpleadoFaltaContext(empleadoId);

  if (!context?.sucursal_id || !context?.area_id) {
    return [];
  }

  const { data, error } = await supabase
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

function buildDocumentPath(empleadoId, fileName) {
  const safeName = String(fileName ?? "archivo")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString();
  return `${documentsFolder}/${empleadoId}/${uniqueId}_${safeName}`;
}

export async function getFaltasCategorias() {
  const { data, error } = await supabase
    .from(tableCategorias)
    .select("id, name")
    .order("name", { ascending: true });
    
  if (error) throw error;
  return data ?? [];
}

export async function getFaltasTiposByCategoria(categoriaId) {
  const { data, error } = await supabase
    .from(tableTipos)
    .select("id, name, requires_certificate, categoria_falta_id")
    .eq("categoria_falta_id", categoriaId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFaltaTipoById(tipoId) {
  const { data, error } = await supabase
    .from(tableTipos)
    .select("id, name, requires_certificate, categoria_falta_id")
    .eq("id", tipoId)
    .maybeSingle();
    
  if (error) throw error;
  return data ?? null;
}

export async function getFaltasByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertEmpleadoFalta(payload) {
  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateEmpleadoFalta(id, payload) {
  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEmpleadoFalta(id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function uploadFaltaCertificado({ empleadoId, file }) {
  const filePath = buildDocumentPath(empleadoId, file?.name);
  const { error } = await supabase.storage
    .from(bucketDocuments)
    .upload(filePath, file, {
      cacheControl: "0",
      upsert: false,
    });
  if (error) throw error;
  return filePath;
}

export const insertFalta = insertEmpleadoFalta;
export const updateFalta = updateEmpleadoFalta;
