import { useContext } from "react";
import { useAuthStore } from "../context/AuthStoreWithPermissions";
import { PermissionsContext } from "../context/permissionsContext.jsx";
import { FEATURE_ALIASES, FEATURES } from "../utils/features";
import { ROLE_IDS } from "../utils/permissions";

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
 * const { can, canCreate, canUpdate, canDelete } = usePermissions();
 *
 * // Verificar permiso especÃ­fico
 * if (can("empleados", "create")) {
 *   <button>Crear empleado</button>
 * }
 *
 * // Helpers directos
 * {canCreate("empleados") && <button>Crear</button>}
 * {canUpdate("empleados") && <button>Editar</button>}
 * {canDelete("empleados") && <button>Eliminar</button>}
 */

export function usePermissions() {
  // Suscribirse a profile para que se actualice cuando cambie el usuario
  const profile = useAuthStore((state) => state.profile);
  const empleado = useAuthStore((state) => state.empleado);
  const permissionsContext = useContext(PermissionsContext);

  // Calcular el rol directamente desde profile para asegurar reactividad
  const userRoleId =
    typeof profile?.app_role_id === "number"
      ? profile.app_role_id
      : ROLE_IDS.EMPLOYEE;
  const isAdminRole = userRoleId === ROLE_IDS.ADMIN;
  const isRRHHRole = userRoleId === ROLE_IDS.RRHH;
  const isEmployeeRole = userRoleId === ROLE_IDS.EMPLOYEE;
  const isAuditorRole = userRoleId === ROLE_IDS.AUDITOR;

  const normalizeStatus = (value) => String(value ?? "").toLowerCase();
  const normalizeShift = (value) => String(value ?? "").trim().toLowerCase();
  const normalizePuesto = (value) => String(value ?? "").trim().toLowerCase();

  const isPendingStatus = (row) => normalizeStatus(row?.status) === "pending";

  const isCreatedByCurrentUser = (row) => {
    const perfilId = profile?.id;
    const createdBy = row?.created_by;
    if (!perfilId || createdBy === null || createdBy === undefined) return false;
    return String(createdBy) === String(perfilId);
  };

  const isWithinEditWindow = (row) => {
    const createdAt = row?.created_at;
    if (!createdAt) return false;
    const createdAtMs = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtMs)) return false;
    return Date.now() <= createdAtMs + 24 * 60 * 60 * 1000;
  };

  const resolveFeature = (resource) =>
    FEATURE_ALIASES[resource] ?? resource;

  const normalizeAction = (action) => {
    const normalized = String(action ?? "view").toLowerCase();
    if (normalized === "read") return "view";
    return normalized;
  };

  const hasClinicalSectionAccess = () =>
    empleado?.clinical_section_access === true;

  const can = (resource, action = "view") => {
    const feature = resolveFeature(resource);
    const normalizedAction = normalizeAction(action);

    if (feature === FEATURES.PACIENTES && normalizedAction === "view") {
      return (
        isAdminRole ||
        hasClinicalSectionAccess() ||
        (isAuditorRole && Boolean(permissionsContext?.can?.(feature, "view")))
      );
    }

    if (feature === FEATURES.PACIENTES && isAuditorRole) {
      return false;
    }

    if (!permissionsContext?.can) return false;
    return permissionsContext.can(feature, action);
  };

  const canEditSolicitud = (row, resource) => {
    if (can(resource, "update")) return true;
    if (!can(resource, "create")) return false;
    if (!isEmployeeRole) return false;
    return (
      isCreatedByCurrentUser(row) &&
      isPendingStatus(row) &&
      isWithinEditWindow(row)
    );
  };

  const canDeleteSolicitud = (_row, resource) => can(resource, "delete");

  const canApproveRejectSolicitud = (_row, resource) =>
    can(resource, "validate");

  const isNurseEmployee = () => {
    if (!isEmployeeRole) return false;
    const puesto = empleado?.puesto?.name ?? empleado?.puesto ?? "";
    return (normalizePuesto(puesto) === "enfermero/a" || normalizePuesto(puesto) === "Enfermero/a");
  };

  const defaultTabFromShift = (shift) => {
    const raw = normalizeShift(shift);
    if (raw === "manana") return "manana";
    if (raw === "tarde") return "tarde";
    if (raw === "noche") return "noche";
    return "manana";
  };

  const canEditNurseRecord = (row) => {
    if (isAdminRole) return true;
    if (!isNurseEmployee()) return false;
    return isCreatedByCurrentUser(row) && isWithinEditWindow(row);
  };

  return {
    // Rol del usuario
    userRoleId,
    profile,
    empleado,
    hasClinicalSectionAccess,

    /**
     * Verificar si el usuario tiene un permiso especÃ­fico
     * @param {string} resource - Recurso (ej: 'empleados', 'vacaciones')
     * @param {string} action - Acción (ej: 'create', 'view', 'update', 'delete')
     * @returns {boolean}
     */
    can,

    /**
     * Verificar si puede CREAR en un recurso
     */
    canCreate: (resource) => can(resource, "create"),

    /**
     * Verificar si puede LEER/VER un recurso
     */
    canRead: (resource) => can(resource, "view"),

    /**
     * Verificar si puede exportar (descargar) recursos
     */
    canExport: (resource) => can(resource, "view"),

    /**
     * Verificar si puede ACTUALIZAR un recurso
     */
    canUpdate: (resource) => can(resource, "update"),

    /**
     * Verificar si puede ELIMINAR en un recurso
     */
    canDelete: (resource) => can(resource, "delete"),

    /**
     * Verificar si puede VALIDAR (aprobar/rechazar) un recurso
     */
    canValidate: (resource) => can(resource, "validate"),

    /**
     * Verificar si puede hacer cualquier escritura (CREATE, UPDATE, DELETE)
     */
    canWrite: (resource) =>
      can(resource, "create") ||
      can(resource, "update") ||
      can(resource, "delete"),

    /**
     * Obtener todos los permisos de un recurso
     */
    getPermissions: (resource) =>
      permissionsContext?.getPermissions?.(resolveFeature(resource)) ?? {
        can_view: false,
        can_create: false,
        can_update: false,
        can_delete: false,
        can_validate: false,
        source: "none",
        inherited: false,
        row: null,
      },

    /**
     * Compat: no existe superadmin en app_roles
     */
    isSuperAdmin: () => false,

    /**
     * Verificar si es admin
     */
    isAdmin: () => {
      return isAdminRole;
    },

    /**
     * Verificar si es RRHH
     */
    isRRHH: () => {
      return isRRHHRole;
    },

    /**
     * Verificar si es empleado
     */
    isEmployee: () => {
      return isEmployeeRole;
    },

    /**
     * Verificar si es auditor
     */
    isAuditor: () => {
      return isAuditorRole;
    },

    /**
     * Permisos para solicitudes (vacaciones/licencias/cambios)
     */
    canEditSolicitud,
    canDeleteSolicitud,
    canApproveRejectSolicitud,

    /**
     * Helpers para enfermeria
     */
    isNurseEmployee,
    canEditNurseRecord,
    defaultTabFromShift,

    permissionsLoading: permissionsContext?.isLoading ?? false,
    permissionsError: permissionsContext?.error ?? null,
    refreshPermissions:
      permissionsContext?.refreshPermissions ?? (async () => null),
  };
}
