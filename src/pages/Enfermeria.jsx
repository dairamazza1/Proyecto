import { Navigate } from "react-router-dom";
import { EnfermeriaTemplate, Spinner1, usePermissions } from "../index";
import { useAuthStore } from "../context/AuthStoreWithPermissions";

export function Enfermeria() {
  const loading = useAuthStore((state) => state.loading);
  const { isAdmin, isNurseEmployee } = usePermissions();

  if (loading) {
    return <Spinner1 />;
  }

  const canAccess = isAdmin() || isNurseEmployee();
  if (!canAccess) {
    return <Navigate to="/perfil" replace />;
  }

  return <EnfermeriaTemplate />;
}
