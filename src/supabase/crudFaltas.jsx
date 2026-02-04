import { supabase } from "../index";

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
  documento:empleados_documentos(id, file_path, document_type)
`;

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
