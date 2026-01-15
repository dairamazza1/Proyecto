import { useAuthStore } from "../context/AuthStoreWithPermissions";
import { hasPermission, canWrite, getResourcePermissions } from "../utils/permissions";

/**
 * ============================================
 * HOOK: usePermissions
 * ============================================
 * 
 * Hook personalizado que expone funciones para verificar permisos
 * en componentes de React.
 * 
 * EJEMPLO DE USO:
 * 
 * const { can, canCreate, canUpdate, canDelete, userRole } = usePermissions();
 * 
 * // Verificar permiso específico
 * if (can('empleados', 'create')) {
 *   <button>Crear empleado</button>
 * }
 * 
 * // Helpers directos
 * {canCreate('empleados') && <button>Crear</button>}
 * {canUpdate('empleados') && <button>Editar</button>}
 * {canDelete('empleados') && <button>Eliminar</button>}
 */

export function usePermissions() {
  // Suscribirse a profile para que se actualice cuando cambie el usuario
  const profile = useAuthStore((state) => state.profile);
  
  // Calcular el rol directamente desde profile para asegurar reactividad
  const userRole = profile?.app_role || 'employee';

  return {
    // Rol del usuario
    userRole,
    profile,

    /**
     * Verificar si el usuario tiene un permiso específico
     * @param {string} resource - Recurso (ej: 'empleados', 'vacaciones')
     * @param {string} action - Acción (ej: 'create', 'read', 'update', 'delete')
     * @returns {boolean}
     */
    can: (resource, action) => {
      return hasPermission(userRole, resource, action);
    },

    /**
     * Verificar si puede CREAR en un recurso
     */
    canCreate: (resource) => {
      return hasPermission(userRole, resource, 'create');
    },

    /**
     * Verificar si puede LEER un recurso
     */
    canRead: (resource) => {
      return hasPermission(userRole, resource, 'read');
    },

    /**
     * Verificar si puede exportar (descargar) recursos
     */
    canExport: (resource) => {
      const hasRead = hasPermission(userRole, resource, 'read');
      const allowedRoles = ['rrhh', 'admin', 'superadmin'];
      return hasRead && allowedRoles.includes(userRole);
    },

    /**
     * Verificar si puede ACTUALIZAR un recurso
     */
    canUpdate: (resource) => {
      return hasPermission(userRole, resource, 'update');
    },

    /**
     * Verificar si puede ELIMINAR en un recurso
     */
    canDelete: (resource) => {
      return hasPermission(userRole, resource, 'delete');
    },

    /**
     * Verificar si puede hacer cualquier escritura (CREATE, UPDATE, DELETE)
     */
    canWrite: (resource) => {
      return canWrite(userRole, resource);
    },

    /**
     * Obtener todos los permisos de un recurso
     */
    getPermissions: (resource) => {
      return getResourcePermissions(userRole, resource);
    },

    /**
     * Verificar si es superadmin
     */
    isSuperAdmin: () => {
      return userRole === 'superadmin';
    },

    /**
     * Verificar si es RRHH
     */
    isRRHH: () => {
      return userRole === 'rrhh';
    },

    /**
     * Verificar si es empleado
     */
    isEmployee: () => {
      return userRole === 'employee';
    }
  };
}
