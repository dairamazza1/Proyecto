import { supabase } from "../index";

const table = "user_invitations";
const notificationsTable = "notificaciones";

const mapInviteErrorMessage = (message, status) => {
  const raw = String(message ?? "").trim();
  if (!raw) return "Error inesperado";
  const normalized = raw.toLowerCase();

  if (normalized.includes("auth user already linked")) {
    return "El email ya esta vinculado a otro empleado.";
  }
  if (normalized.includes("empleado already linked")) {
    return "El empleado ya tiene un usuario vinculado.";
  }
  if (normalized.includes("email already invited for another empleado")) {
    return "El email ya tiene una invitacion asociada a otro empleado.";
  }
  if (normalized.includes("inviter has no company association")) {
    return "No se encontro una empresa asociada al usuario invitador.";
  }
  if (normalized.includes("company mismatch")) {
    return "La empresa seleccionada no coincide con la del usuario.";
  }
  if (normalized.includes("inviter profile not found")) {
    return "No se encontro el perfil del usuario invitador.";
  }
  if (normalized.includes("insufficient permissions")) {
    return "No tienes permisos para realizar esta accion.";
  }
  if (normalized.includes("empleado not found")) {
    return "Empleado no encontrado.";
  }
  if (normalized.includes("empleado already unlinked")) {
    return "El empleado ya no tiene usuario vinculado.";
  }
  if (normalized.includes("invalid email")) {
    return "Email invalido.";
  }
  if (normalized.includes("missing bearer token")) {
    return "Sesion vencida. Vuelve a iniciar sesion.";
  }

  if (
    status === 409 &&
    (normalized.includes("edge function returned") ||
      normalized.includes("conflict") ||
      normalized === "error inesperado")
  ) {
    return "El email ya esta registrado o vinculado a otro empleado.";
  }

  return raw;
};

const parseContextBody = (contextBody) => {
  if (!contextBody) return null;
  if (typeof contextBody === "string") {
    try {
      const parsed = JSON.parse(contextBody);
      return parsed?.error || parsed?.message || contextBody;
    } catch {
      return contextBody;
    }
  }
  if (typeof contextBody === "object") {
    return contextBody?.error || contextBody?.message || null;
  }
  return null;
};

const parseFunctionError = async (error) => {
  if (!error) return "Error inesperado";

  const status =
    error.context?.response?.status ||
    error.context?.status ||
    error.status ||
    null;
  let message = parseContextBody(error.context?.body);

  if (!message && typeof error.context?.body?.text === "function") {
    try {
      const text = await error.context.body.text();
      message = parseContextBody(text);
    } catch {
      message = null;
    }
  }

  if (!message && typeof error.context?.response?.text === "function") {
    try {
      const response = error.context.response;
      const responseClone = response.clone ? response.clone() : response;
      if (typeof responseClone.json === "function") {
        try {
          const responseJson = await responseClone.json();
          message = parseContextBody(responseJson);
        } catch {
          message = null;
        }
      }
      if (!message && typeof responseClone.text === "function") {
        const responseText = await responseClone.text();
        message = parseContextBody(responseText);
      }
    } catch {
      message = null;
    }
  }

  if (!message) {
    message =
      error.context?.error ||
      error.context?.message ||
      error.message ||
      "Error inesperado";
  }

  return mapInviteErrorMessage(message, status);
};

const parseRpcError = (error) => {
  if (!error) return "Error inesperado";
  const message = error.message || error.details || error.hint || "Error inesperado";
  return mapInviteErrorMessage(message, error.code);
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

export async function unlinkEmpleado(empleado_id) {
  if (!empleado_id) {
    throw new Error("Empleado no valido");
  }

  const { data, error } = await supabase.rpc("unlink_empleado", {
    p_empleado_id: empleado_id,
  });

  if (error) {
    throw new Error(parseRpcError(error));
  }

  if (data?.ok === false) {
    throw new Error(data.error || "No se pudo desvincular el empleado");
  }

  return data ?? null;
}

export async function deleteInvitation(id) {
  if (!id) {
    throw new Error("Invitacion no valida");
  }
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
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

export async function getNotificaciones({
  empresa_id,
  recipient_perfil_id,
  status,
  type,
  limit = 100,
} = {}) {
  if (!empresa_id) return [];

  let query = supabase
    .from(notificationsTable)
    .select(
      "id, empresa_id, recipient_perfil_id, type, entity_table, entity_id, empleado_id, empleado:empleados(id, first_name, last_name), title, status, created_at, read_at"
    )
    .eq("empresa_id", empresa_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (recipient_perfil_id) {
    query = query.eq("recipient_perfil_id", recipient_perfil_id);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getNotificacionesCountUnread({
  empresa_id,
  recipient_perfil_id,
} = {}) {
  if (!empresa_id) return 0;

  let query = supabase
    .from(notificationsTable)
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", empresa_id)
    .eq("status", "unread");

  if (recipient_perfil_id) {
    query = query.eq("recipient_perfil_id", recipient_perfil_id);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificacionRead(id) {
  if (!id) {
    throw new Error("Notificacion no valida");
  }

  const { data, error } = await supabase
    .from(notificationsTable)
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function markAllRead(empresa_id) {
  if (!empresa_id) {
    throw new Error("Empresa no valida");
  }

  const { data, error } = await supabase
    .from(notificationsTable)
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("empresa_id", empresa_id)
    .eq("status", "unread")
    .select("id");

  if (error) throw error;
  return data ?? [];
}
