import { supabase } from "./supabase.config";

const notificationsTable = "notifications";
const readsTable = "notification_reads";

export async function getNotifications({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from(notificationsTable)
    .select("id, empleado_id, type, message, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getNotificationReads(notificationIds = []) {
  const uniqueIds = Array.from(
    new Set((notificationIds ?? []).filter((id) => id !== null && id !== undefined))
  );
  if (!uniqueIds.length) return [];

  const { data, error } = await supabase
    .from(readsTable)
    .select("notification_id, read_at")
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

export async function getUnreadCount({ limit = 500 } = {}) {
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
    .in("notification_id", ids);

  if (readsError) throw readsError;

  const readSet = new Set((reads ?? []).map((item) => item.notification_id));
  const unreadCount = ids.reduce(
    (count, id) => (readSet.has(id) ? count : count + 1),
    0
  );

  return unreadCount;
}
