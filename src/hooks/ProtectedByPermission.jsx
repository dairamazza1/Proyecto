import { Navigate } from "react-router-dom";
import { usePermissions } from "./usePermissions";

/**
 * ============================================
 * COMPONENTE: ProtectedByPermission
 * ============================================
 * 
 * Componente que protege rutas o secciones basándose en permisos.
 * 
 * EJEMPLOS DE USO:
 * 
 * 1. Proteger una ruta completa:
 * <Route 
 *   path="/configuracion" 
 *   element={
 *     <ProtectedByPermission 
 *       resource="configuracion" 
 *       action="read"
 *       fallback={<Navigate to="/home" />}
 *     >
 *       <ConfigurationPage />
 *     </ProtectedByPermission>
 *   } 
 * />
 * 
 * 2. Proteger una sección dentro de un componente:
 * <ProtectedByPermission resource="empleados" action="create">
 *   <button>Crear Empleado</button>
 * </ProtectedByPermission>
 * 
 * 3. Con mensaje personalizado:
 * <ProtectedByPermission 
 *   resource="sanciones" 
 *   action="delete"
 *   fallback={<span>No tienes permiso</span>}
 * >
 *   <DeleteButton />
 * </ProtectedByPermission>
 */

export function ProtectedByPermission({ 
  resource, 
  action, 
  children, 
  fallback = null,
  redirectTo = null 
}) {
  const { can } = usePermissions();

  const hasAccess = can(resource, action);

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return fallback;
  }

  return children;
}

/**
 * ============================================
 * COMPONENTE: RequireRole
 * ============================================
 * 
 * Componente que verifica roles específicos
 * 
 * EJEMPLO:
 * <RequireRole roles={['rrhh', 'superadmin']} fallback={<p>Acceso denegado</p>}>
 *   <AdminPanel />
 * </RequireRole>
 */
export function RequireRole({ roles = [], children, fallback = null, redirectTo = null }) {
  const { userRole } = usePermissions();

  const hasRole = roles.includes(userRole);

  if (!hasRole) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return fallback;
  }

  return children;
}
