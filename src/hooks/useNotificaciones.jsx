import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationReads,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../supabase/crudNotifications";

const getPayloadData = (payload = {}) => {
  if (!payload || typeof payload !== "object") {
    return {
      perfilId: null,
      notificationIds: [],
      notificationId: null,
    };
  }

  return {
    perfilId: payload.perfilId ?? null,
    notificationIds: Array.isArray(payload.notificationIds)
      ? payload.notificationIds
      : [],
    notificationId: payload.notificationId ?? null,
  };
};

const getUniqueIds = (ids = []) =>
  Array.from(
    new Set((ids ?? []).filter((id) => id !== null && id !== undefined))
  );

const buildNotificationsWithReads = async (notifications = [], perfilId = null) => {
  if (!notifications?.length || !perfilId) return notifications ?? [];

  const ids = notifications.map((item) => item.id);
  const reads = await getNotificationReads({ notificationIds: ids, perfilId });
  const readMap = new Map(
    (reads ?? []).map((item) => [item.notification_id, item.read_at])
  );

  return notifications.map((item) => ({
    ...item,
    is_read: readMap.has(item.id),
    read_at: readMap.get(item.id) ?? null,
  }));
};

export function useNotificationsList(
  { limit = 100, perfilId = null } = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["notifications", perfilId, limit],
    queryFn: async () => {
      const notifications = await getNotifications({ limit });
      return buildNotificationsWithReads(notifications, perfilId);
    },
    enabled: enabled && Boolean(perfilId),
    refetchOnWindowFocus: false,
  });
}

export function useNotificationsUnreadCount(
  { limit = 500, perfilId = null } = {},
  enabled = true
) {
  return useQuery({
    queryKey: ["notificationsUnreadCount", perfilId, limit],
    queryFn: () => getUnreadCount({ limit, perfilId }),
    enabled: enabled && Boolean(perfilId),
    refetchOnWindowFocus: false,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markRead,
    onMutate: async (payload) => {
      const { notificationId, perfilId } = getPayloadData(payload);

      if (!notificationId || !perfilId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: ["notifications", perfilId] });
      await queryClient.cancelQueries({
        queryKey: ["notificationsUnreadCount", perfilId],
      });

      const previousLists = queryClient.getQueriesData({
        queryKey: ["notifications", perfilId],
      });
      const previousCounts = queryClient.getQueriesData({
        queryKey: ["notificationsUnreadCount", perfilId],
      });

      let wasUnread = false;
      previousLists.forEach(([, data]) => {
        if (!Array.isArray(data)) return;
        const match = data.find((item) => item?.id === notificationId);
        if (match && !match.is_read) {
          wasUnread = true;
        }
      });

      const readAt = new Date().toISOString();
      queryClient.setQueriesData(
        { queryKey: ["notifications", perfilId] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item?.id === notificationId
              ? { ...item, is_read: true, read_at: readAt }
              : item
          );
        }
      );

      if (wasUnread) {
        queryClient.setQueriesData(
          { queryKey: ["notificationsUnreadCount", perfilId] },
          (old) => Math.max(0, (old ?? 0) - 1)
        );
      }

      return { previousLists, previousCounts };
    },
    onError: (_err, _id, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousCounts?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_data, _error, payload) => {
      const { perfilId } = getPayloadData(payload);
      if (!perfilId) return;
      queryClient.invalidateQueries({ queryKey: ["notifications", perfilId] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsUnreadCount", perfilId],
      });
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllRead,
    onMutate: async (payload) => {
      const { perfilId, notificationIds } = getPayloadData(payload);
      const uniqueIds = getUniqueIds(notificationIds);

      if (!perfilId || !uniqueIds.length) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: ["notifications", perfilId] });
      await queryClient.cancelQueries({
        queryKey: ["notificationsUnreadCount", perfilId],
      });

      const previousLists = queryClient.getQueriesData({
        queryKey: ["notifications", perfilId],
      });
      const previousCounts = queryClient.getQueriesData({
        queryKey: ["notificationsUnreadCount", perfilId],
      });

      const pendingIdSet = new Set(uniqueIds);
      const readAt = new Date().toISOString();
      let unreadAffectedCount = 0;

      queryClient.setQueriesData(
        { queryKey: ["notifications", perfilId] },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) => {
            if (!pendingIdSet.has(item?.id)) {
              return item;
            }

            if (!item.is_read) {
              unreadAffectedCount += 1;
            }

            return { ...item, is_read: true, read_at: readAt };
          });
        }
      );

      if (unreadAffectedCount > 0) {
        queryClient.setQueriesData(
          { queryKey: ["notificationsUnreadCount", perfilId] },
          (old) => Math.max(0, (old ?? 0) - unreadAffectedCount)
        );
      }

      return { previousLists, previousCounts };
    },
    onError: (_err, _payload, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousCounts?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: (_data, _error, payload) => {
      const { perfilId } = getPayloadData(payload);
      if (!perfilId) return;
      queryClient.invalidateQueries({ queryKey: ["notifications", perfilId] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsUnreadCount", perfilId],
      });
    },
  });
}
