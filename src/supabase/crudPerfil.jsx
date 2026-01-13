import { supabase } from "../index";

const table = "perfiles";

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
    "id, user_id, first_name, last_name, employee_id_number, document_type, document_number, professional_number, telephone, hire_date, termination_date, is_active";

  if (!perfilId) return null;

  const isNumericId = /^\d+$/.test(String(perfilId));
  if (!isNumericId) return null;

  const { data, error } = await supabase
    
    .from("empleados")
    .select(selectFields)
    .eq("user_id", perfilId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;

}
