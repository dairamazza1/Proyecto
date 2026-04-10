import { supabase } from "./supabase.config";

const notificationsTable = "notifications";
const readsTable = "notification_reads";

function normalizeReadArgs(notificationIdsOrPayload = [], maybePerfilId = null) {
  if (Array.isArray(notificationIdsOrPayload)) {
    return {
      notificationIds: notificationIdsOrPayload,
      perfilId: maybePerfilId,
    };
  }

  if (
    notificationIdsOrPayload &&
    typeof notificationIdsOrPayload === "object"
  ) {
    return {
      notificationIds: notificationIdsOrPayload.notificationIds ?? [],
      perfilId: notificationIdsOrPayload.perfilId ?? maybePerfilId,
    };
  }

  return {
    notificationIds: [],
    perfilId: maybePerfilId,
  };
}

function getUniqueNotificationIds(notificationIds = []) {
  return Array.from(
    new Set(
      (notificationIds ?? []).filter((id) => id !== null && id !== undefined)
    )
  );
}

export async function getNotifications({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from(notificationsTable)
    .select("id, empleado_id, type, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getNotificationReads(notificationIdsOrPayload = [], maybePerfilId = null) {
  const { notificationIds, perfilId } = normalizeReadArgs(
    notificationIdsOrPayload,
    maybePerfilId
  );
  const uniqueIds = getUniqueNotificationIds(notificationIds);
  if (!uniqueIds.length || !perfilId) return [];

  const { data, error } = await supabase
    .from(readsTable)
    .select("notification_id, read_at")
    .eq("perfil_id", perfilId)
    .in("notification_id", uniqueIds);
  if (error) throw error;
  return data ?? [];
}

export async function markRead(payload) {
  const notificationId =
    typeof payload === "object" ? payload.notificationId : payload;
  const perfilId = typeof payload === "object" ? payload.perfilId : null;

  if (!notificationId) {
    throw new Error("Notificacion no valida");
  }

  if (!perfilId) {
    throw new Error("Perfil no disponible");
  }

  const { data: existingRead, error: existingError } = await supabase
    .from(readsTable)
    .select("notification_id, read_at")
    .eq("perfil_id", perfilId)
    .eq("notification_id", notificationId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingRead) {
    return existingRead;
  }

  const readAt = new Date().toISOString();
  const { data, error } = await supabase
    .from(readsTable)
    .insert({
      notification_id: notificationId,
      perfil_id: perfilId,
      read_at: readAt,
    })
    .select("notification_id, read_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { notification_id: notificationId, read_at: null };
    }
    throw error;
  }

  return data ?? null;
}

export async function markAllRead({ notificationIds = [], perfilId } = {}) {
  const uniqueIds = getUniqueNotificationIds(notificationIds);

  if (!uniqueIds.length) {
    return [];
  }

  if (!perfilId) {
    throw new Error("Perfil no disponible");
  }

  const existingReads = await getNotificationReads({ notificationIds: uniqueIds, perfilId });
  const existingIds = new Set(
    (existingReads ?? []).map((item) => item.notification_id)
  );
  const pendingIds = uniqueIds.filter((id) => !existingIds.has(id));

  if (!pendingIds.length) {
    return existingReads;
  }

  const readAt = new Date().toISOString();
  const rows = pendingIds.map((notificationId) => ({
    notification_id: notificationId,
    perfil_id: perfilId,
    read_at: readAt,
  }));

  const { data, error } = await supabase
    .from(readsTable)
    .insert(rows)
    .select("notification_id, read_at");

  if (error) {
    if (error.code === "23505") {
      return getNotificationReads({ notificationIds: uniqueIds, perfilId });
    }
    throw error;
  }

  return data ?? [];
}

export async function getUnreadCount({ limit = 500, perfilId } = {}) {
  if (!perfilId) return 0;

  const { data: notifications, error } = await supabase
    .from(notificationsTable)
    .select("id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  if (!notifications?.length) return 0;

  const ids = notifications.map((item) => item.id);
  const { data: reads, error: readsError } = await supabase
    .from(readsTable)
    .select("notification_id")
    .eq("perfil_id", perfilId)
    .in("notification_id", ids);

  if (readsError) throw readsError;

  const readSet = new Set((reads ?? []).map((item) => item.notification_id));
  const unreadCount = ids.reduce(
    (count, id) => (readSet.has(id) ? count : count + 1),
    0
  );

  return unreadCount;
}
