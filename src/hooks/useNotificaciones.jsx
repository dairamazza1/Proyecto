import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationReads,
  getNotifications,
  getUnreadCount,
  markRead,
} from "../supabase/crudNotifications";

const buildNotificationsWithReads = async (notifications = []) => {
  if (!notifications?.length) return [];

  const ids = notifications.map((item) => item.id);
  const reads = await getNotificationReads(ids);
  const readMap = new Map(
    (reads ?? []).map((item) => [item.notification_id, item.read_at])
  );

  return notifications.map((item) => ({
    ...item,
    is_read: readMap.has(item.id),
    read_at: readMap.get(item.id) ?? null,
  }));
};

export function useNotificationsList({ limit = 100 } = {}, enabled = true) {
  return useQuery({
    queryKey: ["notifications", limit],
    queryFn: async () => {
      const notifications = await getNotifications({ limit });
      return buildNotificationsWithReads(notifications);
    },
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useNotificationsUnreadCount({ limit = 500 } = {}, enabled = true) {
  return useQuery({
    queryKey: ["notificationsUnreadCount", limit],
    queryFn: () => getUnreadCount({ limit }),
    enabled,
    refetchOnWindowFocus: false,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markRead,
    onMutate: async (payload) => {
      const notificationId =
        typeof payload === "object" ? payload.notificationId : payload;

      if (!notificationId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notificationsUnreadCount"] });

      const previousLists = queryClient.getQueriesData({
        queryKey: ["notifications"],
      });
      const previousCounts = queryClient.getQueriesData({
        queryKey: ["notificationsUnreadCount"],
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
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) =>
          item?.id === notificationId
            ? { ...item, is_read: true, read_at: readAt }
            : item
        );
      });

      if (wasUnread) {
        queryClient.setQueriesData(
          { queryKey: ["notificationsUnreadCount"] },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
    },
  });
}
