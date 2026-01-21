import { supabase, getPuestoById } from "../index";

const table = "perfiles";

const normalizeIdArray = (ids = []) => {
  const unique = new Map();
  (ids ?? []).forEach((id) => {
    if (id === null || id === undefined) return;
    const raw = String(id).trim();
    if (!raw || !/^\d+$/.test(raw)) return;
    unique.set(raw, raw);
  });
  return Array.from(unique.values());
};

export async function getPerfilActual({ authUserId } = {}) {
  let resolvedAuthId = authUserId;

  if (!resolvedAuthId) {
    const { data } = await supabase.auth.getSession();
    resolvedAuthId = data?.session?.user?.id ?? null;
  }

  if (!resolvedAuthId) return null;

  const { data, error } = await supabase
    
    .from(table)
    .select("*")
    .eq("auth_user_id", resolvedAuthId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getEmpleadoByPerfil({ perfilId } = {}) {
  const selectFields =
    "id, user_id, first_name, last_name, employee_id_number, document_type, document_number, professional_number, telephone, hire_date, termination_date, is_active, puesto_id, shift";

  if (!perfilId) return null;

  const isNumericId = /^\d+$/.test(String(perfilId));
  if (!isNumericId) return null;

  const { data, error } = await supabase
    
    .from("empleados")
    .select(selectFields)
    .eq("user_id", perfilId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const puesto = await getPuestoById(data?.puesto_id);
  data.puesto = puesto?.name ?? null;

  return data;

}

export async function getEmpleadosByUserIds(userIds = []) {
  const normalizedIds = normalizeIdArray(userIds);
  if (!normalizedIds.length) return [];

  const { data, error } = await supabase
    .from("empleados")
    .select("id, user_id, first_name, last_name")
    .in("user_id", normalizedIds);

  if (error) throw error;
  return data ?? [];
}

export async function getPerfilesByIds(perfilIds = []) {
  const normalizedIds = normalizeIdArray(perfilIds);
  if (!normalizedIds.length) return [];

  const { data, error } = await supabase
    .from(table)
    .select("id, email")
    .in("id", normalizedIds);

  if (error) throw error;
  return data ?? [];
}
