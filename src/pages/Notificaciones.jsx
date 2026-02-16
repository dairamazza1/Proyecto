import { Navigate } from "react-router-dom";
import { NotificacionesTemplate, usePermissions } from "../index";

export function Notificaciones() {
  const { canRead } = usePermissions();
  const canAccess = canRead("notificaciones");

  if (!canAccess) {
    return <Navigate to="/perfil" replace />;
  }

  return <NotificacionesTemplate />;
}
