import { supabase } from "../index";

const schema = "test";
const table = "empleados_licencias";
const tableCategorias = "licencias_categorias";
const tableTipos = "licencias_tipos";
const tableDocumentos = "empleados_documentos";
const bucketDocuments = "documents";
const selectFields = `
  id,
  empleado_id,
  licencia_tipo_id,
  start_date,
  end_date,
  days,
  certificate_url,
  document_id,
  status,
  created_at,
  licencia_tipo:licencias_tipos(id, name, requires_certificate, categoria_licencia_id),
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
  return `licencias/${empleadoId}/${uniqueId}_${safeName}`;
}

export async function getLicenciasCategorias() {
  const { data, error } = await supabase
    .schema(schema)
    .from(tableCategorias)
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getLicenciasTiposByCategoria(categoriaId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(tableTipos)
    .select("id, name, requires_certificate, categoria_licencia_id")
    .eq("categoria_licencia_id", categoriaId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getLicenciaTipoById(tipoId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(tableTipos)
    .select("id, name, requires_certificate, categoria_licencia_id")
    .eq("id", tipoId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getLicenciasByEmpleadoId(empleadoId) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select(selectFields)
    .eq("empleado_id", empleadoId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertEmpleadoLicencia(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateEmpleadoLicencia(id, payload) {
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

export async function insertEmpleadoDocumento(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(tableDocumentos)
    .insert(payload)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadLicenciaCertificado({ empleadoId, file }) {
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

export async function getDocumentoSignedUrl(filePath, expiresInSeconds = 60) {
  const { data, error } = await supabase.storage
    .from(bucketDocuments)
    .createSignedUrl(filePath, expiresInSeconds);
  if (error) throw error;
  return data?.signedUrl;
}

export const insertLicencia = insertEmpleadoLicencia;
export const updateLicencia = updateEmpleadoLicencia;
