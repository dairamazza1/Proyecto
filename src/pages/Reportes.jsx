import { Navigate } from "react-router-dom";
import { ReportesTemplate, usePermissions } from "../index";

export function Reportes() {
  const { canRead } = usePermissions();
  if (!canRead("reportes")) {
    return <Navigate to="/perfil" replace />;
  }
  return <ReportesTemplate />;
}
