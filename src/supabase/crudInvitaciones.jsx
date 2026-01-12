import { supabase } from "../index";

const table = "user_invitations";

const parseFunctionError = async (error) => {
  if (!error) return "Error inesperado";
  const contextBody = error.context?.body;
  if (typeof contextBody === "string") {
    try {
      const parsed = JSON.parse(contextBody);
      if (parsed?.error) return parsed.error;
      if (parsed?.message) return parsed.message;
    } catch {
      return contextBody;
    }
  }
  if (error.context?.error) return error.context.error;
  if (error.context?.message) return error.context.message;
  return error.message || "Error inesperado";
};

export async function inviteUser(payload) {
  const { data, error } = await supabase.functions.invoke("invite_user", {
    body: payload,
  });

  if (error) {
    throw new Error(await parseFunctionError(error));
  }

  if (data?.ok === false) {
    throw new Error(data.error || "No se pudo enviar la invitacion");
  }

  return data?.data ?? data ?? null;
}

export async function getInvitations({
  empresa_id,
  status,
  search,
  app_role,
  limit = 200,
} = {}) {
  if (!empresa_id) return [];

  let query = supabase
    
    .from(table)
    .select(
      "id, empresa_id, empleado_id, email, app_role, status, invited_by, auth_user_id, created_at, accepted_at"
    )
    .eq("empresa_id", empresa_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (app_role && app_role !== "all") {
    query = query.eq("app_role", app_role);
  }

  const term = (search ?? "").trim();
  if (term) {
    query = query.ilike("email", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
