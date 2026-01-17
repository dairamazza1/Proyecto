import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificaciones,
  getNotificacionesCountUnread,
  markNotificacionRead,
} from "../supabase/crudInvitaciones";

export function useNotificacionesCountUnread({
  empresaId,
  recipientPerfilId,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: ["notificacionesUnreadCount", empresaId, recipientPerfilId],
    queryFn: () =>
      getNotificacionesCountUnread({
        empresa_id: empresaId,
        recipient_perfil_id: recipientPerfilId,
      }),
    enabled: Boolean(empresaId) && Boolean(recipientPerfilId) && enabled,
    refetchOnWindowFocus: false,
  });
}

export function useNotificacionesList(filters, enabled = true) {
  return useQuery({
    queryKey: ["notificaciones", filters],
    queryFn: () => getNotificaciones(filters),
    enabled: Boolean(filters?.empresa_id) && enabled,
    refetchOnWindowFocus: false,
  });
}

export function useMarkNotificacionReadMutation({
  empresaId,
  recipientPerfilId,
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificacionRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notificaciones"] });
      const previousLists = queryClient.getQueriesData({
        queryKey: ["notificaciones"],
      });
      const previousCount = queryClient.getQueryData([
        "notificacionesUnreadCount",
        empresaId,
        recipientPerfilId,
      ]);

      let wasUnread = false;
      previousLists.forEach(([, data]) => {
        if (!Array.isArray(data)) return;
        const match = data.find((item) => item?.id === id);
        if (match?.status === "unread") {
          wasUnread = true;
        }
      });

      const readAt = new Date().toISOString();
      queryClient.setQueriesData({ queryKey: ["notificaciones"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) =>
          item?.id === id
            ? { ...item, status: "read", read_at: readAt }
            : item
        );
      });

      if (wasUnread) {
        queryClient.setQueryData(
          ["notificacionesUnreadCount", empresaId, recipientPerfilId],
          (old) => Math.max(0, (old ?? 0) - 1)
        );
      }

      return { previousLists, previousCount };
    },
    onError: (_err, _id, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ["notificacionesUnreadCount", empresaId, recipientPerfilId],
          context.previousCount
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      if (empresaId) {
        queryClient.invalidateQueries({
          queryKey: ["notificacionesUnreadCount", empresaId, recipientPerfilId],
        });
      }
    },
  });
}
