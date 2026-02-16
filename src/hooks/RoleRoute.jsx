import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../context/AuthStoreWithPermissions";
import { usePermissions } from "./usePermissions";

export const RoleRoute = ({ roles = [], redirectTo = "/perfil", children }) => {
  const loading = useAuthStore((state) => state.loading);
  const { userRoleId } = usePermissions();

  if (loading) return null;

  if (roles.length && !roles.includes(userRoleId)) {
    return <Navigate replace to={redirectTo} />;
  }

  return children ? children : <Outlet />;
};
