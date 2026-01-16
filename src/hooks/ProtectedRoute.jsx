import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../context/AuthStoreWithPermissions";
import {Spinner1} from "../index"

export const ProtectedRoute = ({ redirectTo = "/login", children }) => {
    const user = useAuthStore((state) => state.user);
    const loading = useAuthStore((state) => state.loading);

    if (loading) {
        return <Spinner1 />;
    }
    if (!user) {
        return <Navigate replace to={redirectTo} />;
    }
    return children ? children : <Outlet />;
};