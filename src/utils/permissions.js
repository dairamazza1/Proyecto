/**
 * ============================================
 * SISTEMA DE PERMISOS - CONFIGURACIÓN
 * ============================================
 * 
 * Define roles, recursos y permisos del sistema.
 * Única fuente de verdad para autorización.
 */

// ============================================
// ROLES DISPONIBLES
// ============================================
export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  RRHH: 'rrhh',
  EMPLOYEE: 'employee'
};

// ============================================
// RECURSOS DEL SISTEMA
// ============================================
export const RESOURCES = {
  EMPLEADOS: 'empleados',
  VACACIONES: 'vacaciones',
  LICENCIAS: 'licencias',
  CAMBIOS: 'cambios',
  SANCIONES: 'sanciones',
  CATEGORIAS: 'categorias',
  CONFIGURACION: 'configuracion',
  SUCURSALES: 'sucursales'
};

// ============================================
// ACCIONES POSIBLES
// ============================================
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
};

// ============================================
// MAPA DE PERMISOS POR ROL
// ============================================
export const PERMISSIONS = {
  [ROLES.SUPERADMIN]: {
    [RESOURCES.EMPLEADOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.VACACIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.LICENCIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CAMBIOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SANCIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CATEGORIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SUCURSALES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CONFIGURACION]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    }
  },
  [ROLES.ADMIN]: {
    [RESOURCES.EMPLEADOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.VACACIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.LICENCIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CAMBIOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SANCIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CATEGORIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SUCURSALES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CONFIGURACION]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    }
  },

  [ROLES.RRHH]: {
    [RESOURCES.EMPLEADOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.VACACIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.LICENCIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CAMBIOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SANCIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CATEGORIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.SUCURSALES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: true, 
      [ACTIONS.DELETE]: true 
    },
    [RESOURCES.CONFIGURACION]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    }
  },

  [ROLES.EMPLOYEE]: {
    [RESOURCES.EMPLEADOS]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.VACACIONES]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.LICENCIAS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.CAMBIOS]: { 
      [ACTIONS.CREATE]: true, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.SANCIONES]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: false, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.CATEGORIAS]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.SUCURSALES]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    },
    [RESOURCES.CONFIGURACION]: { 
      [ACTIONS.CREATE]: false, 
      [ACTIONS.READ]: true, 
      [ACTIONS.UPDATE]: false, 
      [ACTIONS.DELETE]: false 
    }
  }
};

// ============================================
// FUNCIONES DE VERIFICACIÓN
// ============================================

/**
 * Verifica si un rol tiene permiso para una acción en un recurso
 * @param {string} role - Rol del usuario (ROLES.RRHH, ROLES.EMPLOYEE, etc)
 * @param {string} resource - Recurso (RESOURCES.EMPLEADOS, etc)
 * @param {string} action - Acción (ACTIONS.CREATE, ACTIONS.READ, etc)
 * @returns {boolean}
 */
export function hasPermission(role, resource, action) {
  if (!role || !resource || !action) return false;
  
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions[action] === true;
}

/**
 * Verifica si un rol puede hacer cualquier operación de escritura (CUD)
 * @param {string} role - Rol del usuario
 * @param {string} resource - Recurso
 * @returns {boolean}
 */
export function canWrite(role, resource) {
  return (
    hasPermission(role, resource, ACTIONS.CREATE) ||
    hasPermission(role, resource, ACTIONS.UPDATE) ||
    hasPermission(role, resource, ACTIONS.DELETE)
  );
}

/**
 * Obtiene todos los permisos de un rol para un recurso
 * @param {string} role - Rol del usuario
 * @param {string} resource - Recurso
 * @returns {Object} { create: boolean, read: boolean, update: boolean, delete: boolean }
 */
export function getResourcePermissions(role, resource) {
  if (!role || !resource) {
    return {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: false,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false
    };
  }

  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) {
    return {
      [ACTIONS.CREATE]: false,
      [ACTIONS.READ]: false,
      [ACTIONS.UPDATE]: false,
      [ACTIONS.DELETE]: false
    };
  }

  return rolePermissions[resource] || {
    [ACTIONS.CREATE]: false,
    [ACTIONS.READ]: false,
    [ACTIONS.UPDATE]: false,
    [ACTIONS.DELETE]: false
  };
}
