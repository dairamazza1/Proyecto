import { supabase } from "../index";

const schema = "test";
const table = "empresas";

/**
 * Obtiene todas las empresas activas
 */
export async function getEmpresas({
  orderBy = "name",
  ascending = true
} = {}) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select("id, name, cuit, created_at")
    .order(orderBy, { ascending });

  if (error) throw error;
  return data ?? [];
}

/**
 * Obtiene una empresa por ID
 */
export async function getEmpresaById(id) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .select("id, name, cuit, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Inserta una nueva empresa
 */
export async function insertEmpresa(payload) {
  const { data, error } = await supabase
    .schema(schema)
    .from(table)
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Actualiza una empresa
 */
export async function updateEmpresa(id, payload) {
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
