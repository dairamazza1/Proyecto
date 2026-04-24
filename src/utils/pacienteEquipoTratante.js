import { getArgentinaTodayDateInput } from "./argentinaDateTime";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const resolveSingleRelation = (value) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};

const normalizeDateKey = (value) => {
  const raw = safeString(value).trim();
  if (!raw) return "";
  const isoMatch = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch?.[0]) return isoMatch[0];

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
};

export const buildPacienteEquipoProfesionalLabel = (row) => {
  const empleado = resolveSingleRelation(row?.empleado) ?? row ?? null;
  const fullName = [empleado?.first_name, empleado?.last_name]
    .map((value) => safeString(value).trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) return fullName;
  return `Empleado ${safeString(row?.empleado_id ?? empleado?.id).trim() || "-"}`;
};

export const getPacienteEquipoPuesto = (row) => {
  const empleado = resolveSingleRelation(row?.empleado) ?? row ?? null;
  const puesto = resolveSingleRelation(empleado?.puesto);
  return puesto ?? null;
};

export const getPacienteEquipoArea = (row) => {
  const puesto = getPacienteEquipoPuesto(row);
  return resolveSingleRelation(puesto?.area) ?? resolveSingleRelation(row?.area) ?? null;
};

export const isPacienteEquipoEmpleadoActive = (row) => {
  const empleado = resolveSingleRelation(row?.empleado) ?? row ?? null;
  return empleado?.is_active !== false;
};

export const hasPacienteEquipoClinicalSectionAccess = (row) => {
  const empleado = resolveSingleRelation(row?.empleado) ?? row ?? null;
  const puesto = getPacienteEquipoPuesto(row);

  if (typeof puesto?.clinical_section_access === "boolean") {
    return puesto.clinical_section_access;
  }

  if (typeof empleado?.clinical_section_access === "boolean") {
    return empleado.clinical_section_access;
  }

  if (typeof row?.clinical_section_access === "boolean") {
    return row.clinical_section_access;
  }

  return false;
};

export const isPacienteEquipoClinicallyEligible = (row) => {
  if (!isPacienteEquipoEmpleadoActive(row)) {
    return false;
  }

  return hasPacienteEquipoClinicalSectionAccess(row);
};

export const isPacienteEquipoAssignmentActive = (
  row,
  referenceDate = getArgentinaTodayDateInput(),
) => {
  if (!isPacienteEquipoEmpleadoActive(row)) return false;

  const endDate = normalizeDateKey(row?.end_date);
  if (!endDate) return true;
  return !referenceDate || endDate > referenceDate;
};

export const sortPacienteEquipoRows = (rows = [], referenceDate) =>
  [...rows].sort((left, right) => {
    const leftActive = isPacienteEquipoAssignmentActive(left, referenceDate);
    const rightActive = isPacienteEquipoAssignmentActive(right, referenceDate);
    if (leftActive !== rightActive) return rightActive ? 1 : -1;

    const endDateCompare = normalizeDateKey(right?.end_date).localeCompare(
      normalizeDateKey(left?.end_date),
    );
    if (endDateCompare !== 0) return endDateCompare;

    const createdAtCompare = safeString(right?.created_at).localeCompare(
      safeString(left?.created_at),
    );
    if (createdAtCompare !== 0) return createdAtCompare;

    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });

export const mapPacienteEquipoRow = (row) => {
  const empleado = resolveSingleRelation(row?.empleado) ?? null;
  const puesto = getPacienteEquipoPuesto({ ...row, empleado });
  const area = getPacienteEquipoArea({ ...row, empleado, puesto });

  return {
    ...row,
    empleado,
    puesto,
    area,
    professional_label: buildPacienteEquipoProfesionalLabel({ ...row, empleado }),
    clinical_section_access: hasPacienteEquipoClinicalSectionAccess({
      ...row,
      empleado,
      puesto,
      area,
    }),
  };
};

export const filterPacienteEquipoRowsByIngreso = (rows = [], ingresoId = null) => {
  const normalizedIngresoId = safeString(ingresoId).trim();
  if (!normalizedIngresoId) return sortPacienteEquipoRows(rows);

  const filtered = (rows ?? []).filter((row) => {
    const rowIngresoId = safeString(row?.ingreso_id).trim();
    return !rowIngresoId || rowIngresoId === normalizedIngresoId;
  });

  return sortPacienteEquipoRows(filtered);
};

export const dedupePacienteEquipoProfessionals = (rows = []) => {
  const seen = new Set();
  return (rows ?? []).filter((row) => {
    const empleadoId = safeString(row?.empleado_id ?? row?.id).trim();
    if (!empleadoId || seen.has(empleadoId)) return false;
    seen.add(empleadoId);
    return true;
  });
};

