import { useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  Spinner1,
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsList,
  usePermissions,
} from "../../index";

const typeLabels = {
  vacaciones_pending: "Vacaciones",
  licencia_pending: "Licencia",
  cambio_pending: "Cambio de actividad",
  falta_pending: "Falta",
  
  vacaciones_modified: "Vacaciones",
  licencia_modified: "Licencia",
  cambio_modified: "Cambio de actividad",
  falta_modified: "Falta",
};

const typeTabs = {
  vacaciones_pending: "vacaciones",
  licencia_pending: "licencias",
  cambio_pending: "cambios",
  falta_pending: "faltas",

  vacaciones_modified: "vacaciones",
  licencia_modified: "licencias",
  cambio_modified: "cambios",
  falta_modified: "faltas",
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} hs`;
};

export function NotificacionesSection() {
  const navigate = useNavigate();
  const { profile } = usePermissions();
  const perfilId = profile?.id ?? null;
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useNotificationsList({ limit: 100, perfilId }, Boolean(perfilId));
  const markReadMutation = useMarkReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();
  const unreadNotifications = notifications.filter((item) => !item.is_read);
  const unreadNotificationIds = unreadNotifications.map((item) => item.id);

  const handleOpen = useCallback(
    (item) => {
      if (!item) return;
      if (!item.is_read) {
        if (perfilId) {
          markReadMutation.mutate({
            notificationId: item.id,
            perfilId,
          });
        }
      }

      const tab = typeTabs[item.type] || "vacaciones";      
      if (item.empleado_id) {
        navigate(`/empleados/${item.empleado_id}?tab=${tab}`);
      }
    },
    [markReadMutation, navigate, perfilId]
  );

  const handleMarkAllRead = useCallback(() => {
    if (!perfilId || !unreadNotificationIds.length) return;

    markAllReadMutation.mutate({
      perfilId,
      notificationIds: unreadNotificationIds,
    });
  }, [markAllReadMutation, perfilId, unreadNotificationIds]);

  if (!perfilId || isLoading) {
    return <Spinner1 />;
  }

  if (error) {
    return <span>ha ocurrido un error: {error.message}</span>;
  }

  return (
    <Section>
      <div className="sectionHeader">
        <div className="sectionCopy">
          <h3>Bandeja</h3>
          <p>Las no leidas quedan resaltadas hasta que las marques.</p>
        </div>
        <ActionButton
          type="button"
          onClick={handleMarkAllRead}
          disabled={
            !unreadNotificationIds.length || markAllReadMutation.isPending
          }
        >
          {markAllReadMutation.isPending
            ? "Marcando..."
            : "Marcar todas como leidas"}
        </ActionButton>
      </div>
      {notifications.length ? (
        <List>
          {notifications.map((item) => {
            const typeLabel = typeLabels[item.type] || "Notificacion";
            return (
              <NotificationItem
                type="button"
                key={item.id}
                className={item.is_read ? "read" : "unread"}
                onClick={() => handleOpen(item)}
              >
                <div className="meta">
                  <span className="type">{typeLabel}</span>
                  <span className="date">{formatDate(item.created_at)}</span>
                </div>
                <p className="message">{item.message || "-"}</p>
              </NotificationItem>
            );
          })}
        </List>
      ) : (
        <EmptyState>Sin notificaciones por el momento.</EmptyState>
      )}
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.bg};
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: var(--shadow-elev-1);
  display: grid;
  gap: 16px;

  .sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }

  .sectionCopy {
    display: grid;
    gap: 6px;
  }

  .sectionCopy h3 {
    margin: 0;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.text};
  }

  .sectionCopy p {
    margin: 0;
    color: ${({ theme }) => theme.textsecundary};
    font-size: 0.95rem;
  }

  @media (max-width: 767px) {
    h3 {
      font-size: 1rem;
    }

    .sectionHeader {
      align-items: stretch;
    }

    .sectionCopy {
      width: 100%;
    }
  }
`;

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const NotificationItem = styled.button`
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 16px 18px;
  background: ${({ theme }) => theme.bg};
  text-align: left;
  display: grid;
  gap: 8px;
  cursor: pointer;
  width: 100%;
  font-family: inherit;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &.unread {
    background: ${({ theme }) => theme.bgtotal};
    border-color: ${({ theme }) => theme.color1};
    box-shadow: var(--shadow-elev-1);
  }

  &.read {
    opacity: 0.65;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-elev-2);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color1};
    outline-offset: 2px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.textsecundary};
  }

  .type {
    font-weight: 600;
    color: ${({ theme }) => theme.text};
  }

  .message {
    margin: 0;
    font-size: 0.95rem;
    color: ${({ theme }) => theme.text};
  }
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 12px;
  min-height: 44px;
  padding: 0 16px;
  background: ${({ theme }) => theme.color1};
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
  box-shadow: var(--shadow-elev-1);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-elev-2);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.text};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (max-width: 767px) {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed ${({ theme }) => theme.color2};
  color: ${({ theme }) => theme.textsecundary};
  text-align: center;
`;
