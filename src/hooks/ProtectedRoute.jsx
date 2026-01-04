import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../context/AuthStoreWithPermissions";

export const ProtectedRoute = ({ redirectTo = "/login", children }) => {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);

    if (loading) return null; // O un spinner si prefieres
    if (!user) {
        return <Navigate replace to={redirectTo} />;
    }
    return children ? children : <Outlet />;
};