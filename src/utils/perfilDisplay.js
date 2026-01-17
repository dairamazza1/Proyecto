const resolveEmpleadoFromPerfil = (perfil) => {
  if (!perfil) return null;
  const raw = perfil.empleado ?? perfil.empleados;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
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
