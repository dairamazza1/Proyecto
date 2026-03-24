import { ROLE_IDS, ROLE_LABELS } from "./permissions";

export const resolveEmpleadoFromPerfil = (perfil) => {
  if (!perfil) return null;
  const raw = perfil.empleado ?? perfil.empleados;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
};

const resolveSingleRelation = (value) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const resolvePuestoNameFromEmpleado = (empleado) => {
  if (!empleado) return null;
  const puesto = resolveSingleRelation(empleado.puesto ?? empleado.puestos_laborales);
  if (typeof puesto === "string") {
    const normalized = puesto.trim();
    return normalized || null;
  }
  const name = String(puesto?.name ?? "").trim();
  return name || null;
};

const resolveAppRoleName = (perfil) => {
  const appRole = resolveSingleRelation(perfil?.app_role);
  if (typeof appRole === "string") {
    const normalized = appRole.trim();
    if (normalized) return normalized;
  }

  const relationName = String(appRole?.name ?? "").trim();
  if (relationName) return relationName;

  const roleId = Number(perfil?.app_role_id);
  return ROLE_LABELS[roleId] ?? null;
};

export const resolvePerfilDisplayName = (perfil, perfilId) => {
  if (perfilId === null || perfilId === undefined || perfilId === "") {
    return "-";
  }
  const empleado = resolveEmpleadoFromPerfil(perfil);
  const firstName = empleado?.first_name ?? "";
  const lastName = empleado?.last_name ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  const email = perfil?.email ?? "";
  if (email) return email;
  const resolvedId = perfil?.id ?? perfilId;
  if (resolvedId === null || resolvedId === undefined || resolvedId === "") {
    return "-";
  }
  return `ID ${resolvedId}`;
};

export const resolvePerfilRoleDisplay = (perfil) => {
  if (!perfil) return "-";

  const roleId = Number(perfil?.app_role_id);
  const empleado = resolveEmpleadoFromPerfil(perfil);
  const puestoName = resolvePuestoNameFromEmpleado(empleado);

  if (roleId === ROLE_IDS.EMPLOYEE) {
    return puestoName || ROLE_LABELS[ROLE_IDS.EMPLOYEE];
  }

  return resolveAppRoleName(perfil) || "-";
};
