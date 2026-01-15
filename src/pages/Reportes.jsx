import { Navigate } from "react-router-dom";
import { ReportesTemplate, usePermissions } from "../index";

export function Reportes() {
  const { userRole } = usePermissions();
  if (userRole === "employee") {
    return <Navigate to="/perfil" replace />;
  }
  return <ReportesTemplate />;
}
