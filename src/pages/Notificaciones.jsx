import { Navigate } from "react-router-dom";
import { NotificacionesTemplate, usePermissions } from "../index";

export function Notificaciones() {
  const { userRole } = usePermissions();
  const canAccess = ["admin", "rrhh"].includes(userRole);

  if (!canAccess) {
    return <Navigate to="/perfil" replace />;
  }

  return <NotificacionesTemplate />;
}
