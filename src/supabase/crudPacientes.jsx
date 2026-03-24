import { supabase } from "./supabase.config.jsx";
import {
  getArgentinaDateRangeUtcBounds,
  getArgentinaDayUtcRange,
} from "../utils/argentinaDateTime";
import {
  dedupePacienteEquipoProfessionals,
  mapPacienteEquipoRow,
  sortPacienteEquipoRows,
} from "../utils/pacienteEquipoTratante";

const tablePacientes = "pacientes";
const tableIngresos = "pacientes_ingresos";
const tableEgresos = "pacientes_egresos";
const tableCoberturas = "pacientes_coberturas";
const tableEvoluciones = "pacientes_evoluciones";
const tableIndicaciones = "pacientes_indicaciones";
const tableEstudios = "pacientes_estudios";
const tableEstudiosArchivos = "pacientes_estudios_archivos";
const tableEquipo = "pacientes_equipo_tratante";
const tableIcd10Mental = "icd10_mental_nodes";
const tableCoberturasFinanciadores = "coberturas_financiadores";
const tableCoberturasPlanes = "coberturas_financiadores_planes";
const bucketDocuments = "documents";
const estudiosDocumentsFolder = "storage_pacientes_estudios";
const evolucionSelectFields = `
  id,
  paciente_id,
  ingreso_id,
  evolution_at,
  notes,
  created_by,
  created_at,
  creador:perfiles!pacientes_evoluciones_created_by_fkey(
    id,
    email,
    app_role_id,
    app_role:app_roles(id, name),
    empleado:empleados(
      id,
      first_name,
      last_name,
      puesto_id,
      puesto:puestos_laborales(id, name)
    )
  )
`;
const indicacionSelectFields = `
  id,
  paciente_id,
  ingreso_id,
  evolucion_id,
  indication_at,
  description,
  indication_obs,
  indication_ref,
  created_by,
  created_at,
  creador:perfiles!pacientes_indicaciones_created_by_fkey(
    id,
    email,
    app_role_id,
    app_role:app_roles(id, name),
    empleado:empleados(
      id,
      first_name,
      last_name,
      puesto_id,
      puesto:puestos_laborales(id, name)
    )
  )
`;
const estudioArchivoSelectFields = `
  id,
  estudio_id,
  file_path,
  file_name,
  mime_type,
  created_at
`;
const equipoSelectFields = `
  id,
  paciente_id,
  ingreso_id,
  empleado_id,
  start_date,
  end_date,
  created_at,
  empleado:empleados(
    id,
    first_name,
    last_name,
    document_number,
    employee_id_number,
    professional_number,
    is_active,
    puesto_id,
    puesto:puestos_laborales(
      id,
      name,
      id_area,
      area:areas_laborales(
        id,
        name,
        grants_patient_clinical_permissions
      )
    )
  )
`;
const equipoProfesionalSearchSelectFields = `
  id,
  first_name,
  last_name,
  document_number,
  employee_id_number,
  professional_number,
  is_active,
  empresa_id,
  puesto_id,
  puesto:puestos_laborales(
    id,
    name,
    id_area,
    area:areas_laborales(
      id,
      name,
      grants_patient_clinical_permissions
    )
  )
`;
const estudioSelectFields = `
  id,
  paciente_id,
  ingreso_id,
  evolucion_id,
  requested_at,
  study_type,
  study_name,
  indication,
  status,
  result_text,
  result_at,
  created_by,
  created_at,
  archivos:${tableEstudiosArchivos}(
    ${estudioArchivoSelectFields}
  )
`;
const pacienteSelectFields = `
  id,
  first_name,
  last_name,
  document_type,
  document_number,
  birthday,
  genre,
  telephone,
  email,
  address,
  localidad,
  condition_type,
  estado_civil,
  convivencia,
  educacion,
  alfabetizado,
  ocupacion,
  religion,
  lugar_nacimiento,
  hijos,
  is_active,
  empresa_id
`;
const ingresoPacienteSelectFields = `
  id,
  paciente_id,
  empresa_id,
  sucursal_id,
  admission_at,
  adminission_type,
  admission_diagnosis,
  status,
  discharge_at,
  paciente:pacientes!pacientes_ingresos_paciente_id_fkey(
    ${pacienteSelectFields}
  ),
  sucursal:sucursales!pacientes_ingresos_sucursal_id_fkey(
    id,
    name
  )
`;
const pacienteExportSelectFields = `
  id,
  first_name,
  last_name,
  document_type,
  document_number,
  birthday
`;
const ingresoExportSelectFields = `
  id,
  paciente_id,
  empresa_id,
  sucursal_id,
  admission_at,
  discharge_at,
  adminission_type,
  admission_reason,
  admission_diagnosis,
  sucursal:sucursales!pacientes_ingresos_sucursal_id_fkey(
    id,
    name
  ),
  empresa:empresas!pacientes_ingresos_empresa_id_fkey(
    id,
    name
  )
`;
const VALID_COVERAGE_TYPES = new Set([
  "obra_social",
  "prepaga",
  "particular",
]);

const normalizeSearchTerm = (term) => String(term ?? "").trim();
const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);
const shouldFallbackToManualIngresoPersistence = (error, functionName) => {
  const code = safeString(error?.code).trim().toUpperCase();
  const haystack = [error?.message, error?.details, error?.hint]
    .map((value) => safeString(value).trim().toLowerCase())
    .join(" ");

  return (
    code === "PGRST202" ||
    code === "42883" ||
    (haystack.includes(functionName.toLowerCase()) &&
      haystack.includes("adminission_type"))
  );
};
const shouldFallbackToLegacyPacienteEstudiosSelect = (error) => {
  const code = safeString(error?.code).trim().toUpperCase();
  const haystack = [error?.message, error?.details, error?.hint]
    .map((value) => safeString(value).trim().toLowerCase())
    .join(" ");

  return (
    code === "PGRST200" ||
    code === "42P01" ||
    haystack.includes(tableEstudiosArchivos.toLowerCase()) ||
    (haystack.includes(tableEstudios.toLowerCase()) &&
      haystack.includes("relationship"))
  );
};
const shouldFallbackToLegacyPacienteEquipoSelect = (error) => {
  const code = safeString(error?.code).trim().toUpperCase();
  const haystack = [error?.message, error?.details, error?.hint]
    .map((value) => safeString(value).trim().toLowerCase())
    .join(" ");

  return (
    code === "PGRST200" ||
    code === "PGRST204" ||
    code === "42703" ||
    haystack.includes("areas_laborales") ||
    haystack.includes("grants_patient_clinical_permissions") ||
    haystack.includes("ingreso_id")
  );
};
const toNullableString = (value) => {
  const normalized = safeString(value).trim();
  return normalized ? normalized : null;
};
const toNullableId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const sanitizeFileName = (fileName) =>
  String(fileName ?? "archivo")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80) || "archivo";
const createStorageUniqueSegment = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const normalizeDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch?.[0]) return isoMatch[0];
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
};
const shiftDateKey = (value, amount) => {
  const normalized = normalizeDateKey(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
};
const subtractOneDay = (value) => shiftDateKey(value, -1);
const resolveSingleRelation = (value) => {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
};
const sortEstudioArchivosDesc = (rows = []) =>
  [...rows].sort((left, right) => {
    const createdAtCompare = safeString(right?.created_at).localeCompare(
      safeString(left?.created_at)
    );
    if (createdAtCompare !== 0) return createdAtCompare;
    return Number(right?.id ?? 0) - Number(left?.id ?? 0);
  });
const sortCoberturasDescByStartDate = (rows = []) =>
  [...rows].sort((a, b) => {
    const dateCompare = normalizeDateKey(b?.start_date).localeCompare(
      normalizeDateKey(a?.start_date)
    );
    if (dateCompare !== 0) return dateCompare;
    return Number(b?.id ?? 0) - Number(a?.id ?? 0);
  });
const sortCoberturasAscByStartDate = (rows = []) =>
  [...rows].sort((a, b) => {
    const dateCompare = normalizeDateKey(a?.start_date).localeCompare(
      normalizeDateKey(b?.start_date)
    );
    if (dateCompare !== 0) return dateCompare;
    return Number(a?.id ?? 0) - Number(b?.id ?? 0);
  });
const buildCoverageDisplayName = (coverage) => {
  if (!coverage) return null;
  if (coverage.coverage_type === "particular") return "Particular";
  return (
    [coverage.coverage_provider_name, coverage.coverage_plan_name]
      .filter(Boolean)
      .join(" - ") ||
    coverage.coverage_provider_name ||
    coverage.coverage_plan_name ||
    null
  );
};
const matchesPacienteSearch = (row, term) => {
  const normalizedTerm = normalizeSearchTerm(term).toLowerCase();
  if (!normalizedTerm) return true;

  return [
    row?.document_number,
    row?.first_name,
    row?.last_name,
    row?.condition_type,
    row?.sucursal_name,
  ].some((value) =>
    safeString(value).trim().toLowerCase().includes(normalizedTerm),
  );
};
const mapIngresoPacienteRow = (row) => {
  const paciente = row?.paciente ?? null;
  if (!paciente?.id) return null;

  return {
    ...paciente,
    admission_at: row?.admission_at ?? null,
    adminission_type: row?.adminission_type ?? null,
    admission_diagnosis: row?.admission_diagnosis ?? "",
    ingreso_id: row?.id ?? null,
    ingreso_status: row?.status ?? null,
    discharge_at: row?.discharge_at ?? null,
    sucursal_id: row?.sucursal_id ?? row?.sucursal?.id ?? null,
    sucursal_name: row?.sucursal?.name ?? null,
  };
};
const dedupePacientesFromIngresos = (rows = [], term = "", limit = null) => {
  const seen = new Set();
  const mappedRows = [];

  for (const row of rows ?? []) {
    const mapped = mapIngresoPacienteRow(row);
    if (!mapped?.id || seen.has(mapped.id)) continue;
    if (mapped.is_active === false) continue;
    if (!matchesPacienteSearch(mapped, term)) continue;

    seen.add(mapped.id);
    mappedRows.push(mapped);

    if (limit && mappedRows.length >= limit) break;
  }

  return mappedRows;
};
const mapPacienteEstudioRow = (row) => {
  const archivos = sortEstudioArchivosDesc(row?.archivos ?? []);
  return {
    ...row,
    archivos,
    archivo_principal: archivos[0] ?? null,
  };
};
const mapPacienteEquipoProfesionalRow = (row) =>
  mapPacienteEquipoRow({
    ...row,
    empleado_id: row?.empleado_id ?? row?.id ?? null,
    empleado:
      resolveSingleRelation(row?.empleado) ??
      {
        ...row,
        puesto: resolveSingleRelation(row?.puesto),
      },
  });

const buildPacienteEstudioStoragePath = ({ pacienteId, estudioId, fileName }) => {
  const safePacienteId = toNullableId(pacienteId);
  const safeEstudioId = toNullableId(estudioId);
  if (!safePacienteId || !safeEstudioId) {
    throw new Error("No se pudo resolver el destino del archivo del estudio.");
  }

  return `${estudiosDocumentsFolder}/paciente_${safePacienteId}/estudio_${safeEstudioId}/${createStorageUniqueSegment()}_${sanitizeFileName(fileName)}`;
};
async function getPacienteEstudioById(estudioId) {
  const normalizedId = toNullableId(estudioId);
  if (!normalizedId) return null;

  let response = await supabase
    .from(tableEstudios)
    .select(estudioSelectFields)
    .eq("id", normalizedId)
    .maybeSingle();

  if (response.error && shouldFallbackToLegacyPacienteEstudiosSelect(response.error)) {
    response = await supabase
      .from(tableEstudios)
      .select("*")
      .eq("id", normalizedId)
      .maybeSingle();
  }

  if (response.error) throw response.error;
  return response.data ? mapPacienteEstudioRow(response.data) : null;
}

export function resolvePacienteCoberturaByDate(coberturas = [], referenceDate) {
  const dateKey = normalizeDateKey(referenceDate);
  if (!dateKey) return null;

  return (
    sortCoberturasDescByStartDate(coberturas).find((row) => {
      const startDate = normalizeDateKey(row?.start_date);
      const endDate = normalizeDateKey(row?.end_date);
      return startDate && startDate <= dateKey && (!endDate || endDate >= dateKey);
    }) ?? null
  );
}

async function getCoberturasFinanciadoresByIds(ids = []) {
  const uniqueIds = Array.from(
    new Set((ids ?? []).map((id) => toNullableId(id)).filter(Boolean))
  );
  if (!uniqueIds.length) return [];

  const { data, error } = await supabase
    .from(tableCoberturasFinanciadores)
    .select("id,nombre,tipo,activo")
    .in("id", uniqueIds);
  if (error) throw error;
  return data ?? [];
}

async function getCoberturasPlanesByIds(ids = []) {
  const uniqueIds = Array.from(
    new Set((ids ?? []).map((id) => toNullableId(id)).filter(Boolean))
  );
  if (!uniqueIds.length) return [];

  const { data, error } = await supabase
    .from(tableCoberturasPlanes)
    .select("id,financiador_id,nombre,activo")
    .in("id", uniqueIds);
  if (error) throw error;
  return data ?? [];
}

function mapCoberturaRow(row, financiadoresById, planesById) {
  const financiadorId = toNullableId(row?.financiador_id);
  const planId = toNullableId(row?.plan_id);
  const financiador = financiadorId
    ? financiadoresById.get(financiadorId) ?? null
    : null;
  const plan = planId ? planesById.get(planId) ?? null : null;
  const coverageType = financiador?.tipo ?? (financiadorId ? null : "particular");
  const mappedRow = {
    ...row,
    financiador,
    plan,
    coverage_type: coverageType,
    coverage_provider_name: financiador?.nombre ?? null,
    coverage_plan_name: plan?.nombre ?? null,
  };

  return {
    ...mappedRow,
    coverage_name: buildCoverageDisplayName(mappedRow),
    coverage_display_name: buildCoverageDisplayName(mappedRow),
  };
}

async function hydratePacienteCoberturas(rows = []) {
  const financiadorIds = rows.map((row) => row?.financiador_id);
  const planIds = rows.map((row) => row?.plan_id);
  const [financiadores, planes] = await Promise.all([
    getCoberturasFinanciadoresByIds(financiadorIds),
    getCoberturasPlanesByIds(planIds),
  ]);

  const financiadoresById = new Map(
    (financiadores ?? []).map((row) => [Number(row.id), row])
  );
  const planesById = new Map((planes ?? []).map((row) => [Number(row.id), row]));

  return sortCoberturasDescByStartDate(rows).map((row) =>
    mapCoberturaRow(row, financiadoresById, planesById)
  );
}

function normalizeCoverageSyncPayload({ coverage, pacienteId, effectiveDate, createdBy }) {
  const coverageType = safeString(coverage?.coverage_type).trim().toLowerCase();
  if (!VALID_COVERAGE_TYPES.has(coverageType)) {
    throw new Error("Debe seleccionar el tipo de cobertura.");
  }

  const startDate = normalizeDateKey(effectiveDate);
  if (!startDate) {
    throw new Error("Debe indicar la fecha de vigencia de la cobertura.");
  }

  const financiadorId =
    coverageType === "particular" ? null : toNullableId(coverage?.financiador_id);
  const planId = coverageType === "particular" ? null : toNullableId(coverage?.plan_id);

  if (coverageType !== "particular" && !financiadorId) {
    throw new Error("Debe seleccionar un financiador.");
  }

  if (coverageType === "prepaga" && !planId) {
    throw new Error("Debe seleccionar un plan.");
  }

  return {
    paciente_id: pacienteId,
    financiador_id: financiadorId,
    plan_id: planId,
    affiliate_number:
      coverageType === "particular"
        ? null
        : toNullableString(coverage?.affiliate_number),
    coverage_notes: toNullableString(coverage?.coverage_notes),
    start_date: startDate,
    created_by: createdBy ?? null,
  };
}

function areSameCoberturas(left, right) {
  return (
    toNullableId(left?.financiador_id) === toNullableId(right?.financiador_id) &&
    toNullableId(left?.plan_id) === toNullableId(right?.plan_id) &&
    toNullableString(left?.affiliate_number) ===
      toNullableString(right?.affiliate_number) &&
    toNullableString(left?.coverage_notes) === toNullableString(right?.coverage_notes)
  );
}

function getNextPacienteCobertura(coberturas = [], referenceDate) {
  const dateKey = normalizeDateKey(referenceDate);
  if (!dateKey) return null;
  return (
    sortCoberturasAscByStartDate(coberturas).find(
      (row) => normalizeDateKey(row?.start_date) > dateKey
    ) ?? null
  );
}

async function insertPacienteCobertura(payload) {
  const { data, error } = await supabase
    .from(tableCoberturas)
    .insert(payload)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updatePacienteCobertura(id, payload) {
  const { data, error } = await supabase
    .from(tableCoberturas)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPacientesActivos({
  empresaId,
  search,
  sucursalId,
} = {}) {
  if (!empresaId || !sucursalId) return [];

  const { data, error } = await supabase
    .from(tableIngresos)
    .select(ingresoPacienteSelectFields)
    .eq("empresa_id", empresaId)
    .eq("sucursal_id", sucursalId)
    .eq("status", "admitted")
    .is("discharge_at", null)
    .order("admission_at", { ascending: false });

  if (error) throw error;

  return dedupePacientesFromIngresos(data ?? [], search);
}

export async function getPacientesIngresadosHoy({
  empresaId,
  search,
  sucursalId,
} = {}) {
  return getPacientesActivos({ empresaId, search, sucursalId });
}

export async function searchPacientes({
  empresaId,
  term,
  limit = 15,
  sucursalId,
} = {}) {
  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm || !empresaId || !sucursalId) return [];

  const { data, error } = await supabase
    .from(tableIngresos)
    .select(ingresoPacienteSelectFields)
    .eq("empresa_id", empresaId)
    .eq("sucursal_id", sucursalId)
    .order("admission_at", { ascending: false });

  if (error) throw error;
  return dedupePacientesFromIngresos(data ?? [], normalizedTerm, limit);
}

export async function insertPaciente(payload) {
  const { data, error } = await supabase
    .from(tablePacientes)
    .insert(payload)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePaciente(id, payload) {
  const { data, error } = await supabase
    .from(tablePacientes)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createPacienteConIngreso({ paciente, ingreso } = {}) {
  if (!ingreso?.sucursal_id) {
    throw new Error("Debe seleccionar una sucursal para registrar el ingreso.");
  }

  const rpcPayload = {
    p_first_name: paciente?.first_name ?? null,
    p_last_name: paciente?.last_name ?? null,
    p_document_type: paciente?.document_type ?? null,
    p_document_number: paciente?.document_number ?? null,
    p_birthday: paciente?.birthday ?? null,
    p_genre: paciente?.genre ?? null,
    p_telephone: paciente?.telephone ?? null,
    p_email: paciente?.email ?? null,
    p_address: paciente?.address ?? null,
    p_localidad: paciente?.localidad ?? null,
    p_condition_type: paciente?.condition_type ?? null,
    p_estado_civil: paciente?.estado_civil ?? null,
    p_convivencia: paciente?.convivencia ?? null,
    p_educacion: paciente?.educacion ?? null,
    p_alfabetizado: paciente?.alfabetizado ?? null,
    p_ocupacion: paciente?.ocupacion ?? null,
    p_religion: paciente?.religion ?? null,
    p_lugar_nacimiento: paciente?.lugar_nacimiento ?? null,
    p_hijos: paciente?.hijos ?? null,
    p_sucursal_id: ingreso?.sucursal_id ?? null,
    p_admission_at: ingreso?.admission_at ?? null,
    p_adminission_type: ingreso?.adminission_type ?? null,
    p_admission_reason: ingreso?.admission_reason ?? null,
    p_admission_diagnosis: ingreso?.admission_diagnosis ?? null,
  };
  const { data, error } = await supabase.rpc(
    "create_paciente_con_ingreso",
    rpcPayload,
  );

  if (error) {
    if (
      !shouldFallbackToManualIngresoPersistence(
        error,
        "create_paciente_con_ingreso",
      )
    ) {
      throw error;
    }

    const createdPaciente = await insertPaciente(paciente);
    if (!createdPaciente?.id) {
      throw new Error("No se pudo registrar el paciente.");
    }

    const createdIngreso = await insertPacienteIngreso({
      ...ingreso,
      paciente_id: createdPaciente.id,
    });
    if (!createdIngreso?.id) {
      throw new Error("No se pudo registrar el ingreso.");
    }

    return {
      paciente_id: createdPaciente.id,
      ingreso_id: createdIngreso.id,
    };
  }
  return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
}

export async function insertPacienteIngreso(payload) {
  const { data, error } = await supabase
    .from(tableIngresos)
    .insert(payload)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createReingresoPaciente({
  pacienteId,
  ingreso,
} = {}) {
  if (!pacienteId) {
    throw new Error("No se encontro el paciente para registrar el reingreso.");
  }
  if (!ingreso?.sucursal_id) {
    throw new Error("Debe seleccionar una sucursal para registrar el ingreso.");
  }

  const rpcPayload = {
    p_paciente_id: pacienteId,
    p_sucursal_id: ingreso?.sucursal_id ?? null,
    p_admission_at: ingreso?.admission_at ?? null,
    p_adminission_type: ingreso?.adminission_type ?? null,
    p_admission_reason: ingreso?.admission_reason ?? null,
    p_admission_diagnosis: ingreso?.admission_diagnosis ?? null,
  };
  const { data, error } = await supabase.rpc(
    "create_reingreso_paciente",
    rpcPayload,
  );

  if (error) {
    if (
      !shouldFallbackToManualIngresoPersistence(
        error,
        "create_reingreso_paciente",
      )
    ) {
      throw error;
    }

    const createdIngreso = await insertPacienteIngreso({
      ...ingreso,
      paciente_id: pacienteId,
    });
    return createdIngreso?.id ?? null;
  }
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

export async function updatePacienteIngreso(id, payload) {
  const { data, error } = await supabase
    .from(tableIngresos)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function egresarPacienteIngreso(id, payload) {
  const { data, error } = await supabase
    .from(tableIngresos)
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPacienteEgresoByIngresoId(ingresoId) {
  if (!ingresoId) return null;

  const { data, error } = await supabase
    .from(tableEgresos)
    .select("*")
    .eq("ingreso_id", ingresoId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function upsertPacienteEgreso({
  pacienteId,
  ingresoId,
  payload,
} = {}) {
  if (!pacienteId) {
    throw new Error("No se encontro el paciente para guardar la epicrisis.");
  }
  if (!ingresoId) {
    throw new Error("No se encontro el ingreso para guardar la epicrisis.");
  }

  const upsertPayload = {
    paciente_id: pacienteId,
    ingreso_id: ingresoId,
    ...(payload ?? {}),
  };

  const { data, error } = await supabase
    .from(tableEgresos)
    .upsert(upsertPayload, { onConflict: "ingreso_id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getPacienteById(id) {
  const { data, error } = await supabase
    .from(tablePacientes)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getPacienteCoberturasByPacienteId(pacienteId) {
  const { data, error } = await supabase
    .from(tableCoberturas)
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return hydratePacienteCoberturas(data ?? []);
}

export async function getCoberturasFinanciadoresByTipo(tipo) {
  const normalizedType = safeString(tipo).trim().toLowerCase();
  if (!normalizedType || normalizedType === "particular") return [];
  if (!VALID_COVERAGE_TYPES.has(normalizedType)) {
    throw new Error("Tipo de cobertura invalido.");
  }

  const { data, error } = await supabase
    .from(tableCoberturasFinanciadores)
    .select("id,nombre,tipo,activo")
    .eq("activo", true)
    .eq("tipo", normalizedType)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCoberturasPlanesByFinanciadorId(financiadorId) {
  const normalizedId = toNullableId(financiadorId);
  if (!normalizedId) return [];

  const { data, error } = await supabase
    .from(tableCoberturasPlanes)
    .select("id,financiador_id,nombre,activo")
    .eq("activo", true)
    .eq("financiador_id", normalizedId)
    .order("nombre", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function syncPacienteCoberturaByDate({
  pacienteId,
  effectiveDate,
  coverage,
  createdBy = null,
}) {
  if (!pacienteId) {
    throw new Error("No se encontro el paciente para guardar la cobertura.");
  }

  const normalizedPayload = normalizeCoverageSyncPayload({
    coverage,
    pacienteId,
    effectiveDate,
    createdBy,
  });
  const existingCoberturas = await getPacienteCoberturasByPacienteId(pacienteId);
  const currentCobertura = resolvePacienteCoberturaByDate(
    existingCoberturas,
    normalizedPayload.start_date
  );
  const nextCobertura = getNextPacienteCobertura(
    existingCoberturas,
    normalizedPayload.start_date
  );
  const nextCoverageEndDate = nextCobertura?.start_date
    ? subtractOneDay(nextCobertura.start_date)
    : null;

  if (currentCobertura && areSameCoberturas(currentCobertura, normalizedPayload)) {
    return currentCobertura;
  }

  if (
    currentCobertura &&
    normalizeDateKey(currentCobertura.start_date) === normalizedPayload.start_date
  ) {
    const updated = await updatePacienteCobertura(currentCobertura.id, {
      financiador_id: normalizedPayload.financiador_id,
      plan_id: normalizedPayload.plan_id,
      affiliate_number: normalizedPayload.affiliate_number,
      coverage_notes: normalizedPayload.coverage_notes,
      start_date: normalizedPayload.start_date,
      end_date: currentCobertura.end_date ?? nextCoverageEndDate,
    });
    const hydratedRows = await hydratePacienteCoberturas([updated]);
    return hydratedRows[0] ?? updated;
  }

  if (currentCobertura) {
    const endDate = subtractOneDay(normalizedPayload.start_date);
    if (endDate && endDate >= normalizeDateKey(currentCobertura.start_date)) {
      await updatePacienteCobertura(currentCobertura.id, { end_date: endDate });
    }
  }

  const inserted = await insertPacienteCobertura({
    ...normalizedPayload,
    end_date: nextCoverageEndDate,
  });
  const hydratedRows = await hydratePacienteCoberturas([inserted]);
  return hydratedRows[0] ?? inserted;
}

export async function getPacienteIngresosByPacienteId(pacienteId) {
  const { data, error } = await supabase
    .from(tableIngresos)
    .select(
      `
      *,
      creador:perfiles!pacientes_ingresos_created_by_fkey(
        id,
        email,
        empleado:empleados(id, first_name, last_name)
      ),
      sucursal:sucursales!pacientes_ingresos_sucursal_id_fkey(
        id,
        name
      )
    `
    )
    .eq("paciente_id", pacienteId)
    .order("admission_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEquipoTratanteByPacienteId(pacienteId) {
  if (!pacienteId) return [];

  let response = await supabase
    .from(tableEquipo)
    .select(equipoSelectFields)
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (response.error && shouldFallbackToLegacyPacienteEquipoSelect(response.error)) {
    response = await supabase
      .from(tableEquipo)
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false });
  }

  if (response.error) throw response.error;

  return sortPacienteEquipoRows(
    (response.data ?? []).map((row) => mapPacienteEquipoRow(row)),
  );
}

export async function searchPacienteEquipoProfesionales({
  empresaId,
  term = "",
  limit = 12,
} = {}) {
  if (!empresaId) return [];

  const normalizedTerm = normalizeSearchTerm(term);
  const isNumeric = /^\d+$/.test(normalizedTerm);

  let query = supabase
    .from("empleados")
    .select(equipoProfesionalSearchSelectFields)
    .eq("empresa_id", empresaId)
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (normalizedTerm) {
    const searchFilters = [
      `first_name.ilike.%${normalizedTerm}%`,
      `last_name.ilike.%${normalizedTerm}%`,
      `professional_number.ilike.%${normalizedTerm}%`,
      `employee_id_number.ilike.%${normalizedTerm}%`,
    ];

    if (isNumeric) {
      searchFilters.push(`document_number.eq.${normalizedTerm}`);
    }

    query = query.or(searchFilters.join(","));
  }

  if (limit) {
    query = query.limit(limit);
  }

  let response = await query;
  if (response.error && shouldFallbackToLegacyPacienteEquipoSelect(response.error)) {
    let fallbackQuery = supabase
      .from("empleados")
      .select(
        `
        id,
        first_name,
        last_name,
        document_number,
        employee_id_number,
        professional_number,
        is_active,
        empresa_id,
        puesto_id,
        puesto:puestos_laborales(id, name, id_area)
      `,
      )
      .eq("empresa_id", empresaId)
      .eq("is_active", true)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (normalizedTerm) {
      const fallbackFilters = [
        `first_name.ilike.%${normalizedTerm}%`,
        `last_name.ilike.%${normalizedTerm}%`,
        `professional_number.ilike.%${normalizedTerm}%`,
        `employee_id_number.ilike.%${normalizedTerm}%`,
      ];

      if (isNumeric) {
        fallbackFilters.push(`document_number.eq.${normalizedTerm}`);
      }

      fallbackQuery = fallbackQuery.or(fallbackFilters.join(","));
    }

    if (limit) {
      fallbackQuery = fallbackQuery.limit(limit);
    }

    response = await fallbackQuery;
  }

  if (response.error) throw response.error;

  return dedupePacienteEquipoProfessionals(
    (response.data ?? []).map((row) => mapPacienteEquipoProfesionalRow(row)),
  );
}

async function getPacienteEquipoTratanteAssignmentById(id) {
  const normalizedId = toNullableId(id);
  if (!normalizedId) return null;

  let response = await supabase
    .from(tableEquipo)
    .select(equipoSelectFields)
    .eq("id", normalizedId)
    .maybeSingle();

  if (response.error && shouldFallbackToLegacyPacienteEquipoSelect(response.error)) {
    response = await supabase
      .from(tableEquipo)
      .select("*")
      .eq("id", normalizedId)
      .maybeSingle();
  }

  if (response.error) throw response.error;
  return response.data ? mapPacienteEquipoRow(response.data) : null;
}

async function getPacienteEquipoActivoRow({
  pacienteId,
  ingresoId = null,
  empleadoId,
} = {}) {
  const normalizedPacienteId = toNullableId(pacienteId);
  const normalizedIngresoId = toNullableId(ingresoId);
  const normalizedEmpleadoId = toNullableId(empleadoId);
  if (!normalizedPacienteId || !normalizedEmpleadoId) return null;

  let query = supabase
    .from(tableEquipo)
    .select("id, paciente_id, ingreso_id, empleado_id, end_date, created_at")
    .eq("paciente_id", normalizedPacienteId)
    .eq("empleado_id", normalizedEmpleadoId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (normalizedIngresoId) {
    query = query.or(`ingreso_id.eq.${normalizedIngresoId},ingreso_id.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (
    (data ?? []).find((row) => !row?.end_date) ??
    (data ?? []).find(
      (row) =>
        String(row?.ingreso_id ?? "") === String(normalizedIngresoId ?? ""),
    ) ??
    data?.[0] ??
    null
  );
}

export async function updatePacienteEquipoTratanteAssignment(id, payload = {}) {
  const normalizedId = toNullableId(id);
  if (!normalizedId) {
    throw new Error("No se encontro la asignacion del equipo tratante.");
  }

  const nextPayload = { ...payload };
  if (nextPayload.ingreso_id !== undefined) {
    const normalizedIngresoId = toNullableId(nextPayload.ingreso_id);
    if (normalizedIngresoId) {
      nextPayload.ingreso_id = normalizedIngresoId;
    } else {
      delete nextPayload.ingreso_id;
    }
  }

  let response = await supabase
    .from(tableEquipo)
    .update(nextPayload)
    .eq("id", normalizedId)
    .select(equipoSelectFields)
    .maybeSingle();

  if (response.error && shouldFallbackToLegacyPacienteEquipoSelect(response.error)) {
    delete nextPayload.ingreso_id;
    response = await supabase
      .from(tableEquipo)
      .update(nextPayload)
      .eq("id", normalizedId)
      .select("*")
      .maybeSingle();
  }

  if (response.error) throw response.error;
  return response.data ? mapPacienteEquipoRow(response.data) : null;
}

export async function assignPacienteEquipoTratante({
  pacienteId,
  ingresoId = null,
  empleadoId,
} = {}) {
  const normalizedPacienteId = toNullableId(pacienteId);
  const normalizedIngresoId = toNullableId(ingresoId);
  const normalizedEmpleadoId = toNullableId(empleadoId);

  if (!normalizedPacienteId || !normalizedEmpleadoId) {
    throw new Error("No se pudo resolver la asignacion del equipo tratante.");
  }

  const existing = await getPacienteEquipoActivoRow({
    pacienteId: normalizedPacienteId,
    ingresoId: normalizedIngresoId,
    empleadoId: normalizedEmpleadoId,
  });

  if (existing?.id) {
    if (existing.end_date) {
      return updatePacienteEquipoTratanteAssignment(existing.id, {
        ingreso_id: normalizedIngresoId,
        end_date: null,
      });
    }

    if (
      normalizedIngresoId &&
      String(existing.ingreso_id ?? "") !== String(normalizedIngresoId)
    ) {
      return updatePacienteEquipoTratanteAssignment(existing.id, {
        ingreso_id: normalizedIngresoId,
      });
    }

    return getPacienteEquipoTratanteAssignmentById(existing.id);
  }

  const payload = {
    paciente_id: normalizedPacienteId,
    empleado_id: normalizedEmpleadoId,
    end_date: null,
  };

  if (normalizedIngresoId) {
    payload.ingreso_id = normalizedIngresoId;
  }

  let response = await supabase
    .from(tableEquipo)
    .insert(payload)
    .select(equipoSelectFields)
    .maybeSingle();

  if (response.error && shouldFallbackToLegacyPacienteEquipoSelect(response.error)) {
    delete payload.ingreso_id;
    response = await supabase
      .from(tableEquipo)
      .insert(payload)
      .select("*")
      .maybeSingle();
  }

  if (response.error) throw response.error;
  return response.data ? mapPacienteEquipoRow(response.data) : null;
}

export async function finishPacienteEquipoTratanteAssignment(
  id,
  endDate = normalizeDateKey(new Date()),
) {
  return updatePacienteEquipoTratanteAssignment(id, {
    end_date: endDate || null,
  });
}

export async function reopenPacienteEquipoTratanteAssignment(id) {
  return updatePacienteEquipoTratanteAssignment(id, { end_date: null });
}

export async function syncPacienteEquipoTratanteByIngreso({
  pacienteId,
  ingresoId = null,
  assignments = [],
} = {}) {
  const normalizedPacienteId = toNullableId(pacienteId);
  const normalizedIngresoId = toNullableId(ingresoId);
  if (!normalizedPacienteId) return [];

  const dedupedAssignments = dedupePacienteEquipoProfessionals(
    (assignments ?? []).map((item) => ({
      ...item,
      empleado_id: toNullableId(item?.empleado_id ?? item?.id),
    })),
  ).filter((item) => item?.empleado_id);

  if (!dedupedAssignments.length) return [];

  return Promise.all(
    dedupedAssignments.map((item) =>
      assignPacienteEquipoTratante({
        pacienteId: normalizedPacienteId,
        ingresoId: normalizedIngresoId,
        empleadoId: item.empleado_id,
      }),
    ),
  );
}

export async function getPacienteEvolucionesByDate({
  pacienteId,
  ingresoId = null,
  date,
} = {}) {
  if (!pacienteId || !date) return [];

  const { from, to } = getArgentinaDayUtcRange(date);
  if (!from || !to) return [];

  let query = supabase
    .from(tableEvoluciones)
    .select(evolucionSelectFields)
    .eq("paciente_id", pacienteId)
    .gte("evolution_at", from)
    .lt("evolution_at", to)
    .order("evolution_at", { ascending: true });

  if (ingresoId) {
    query = query.eq("ingreso_id", ingresoId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEvolucionesByRange({
  pacienteId,
  ingresoId = null,
  fromDate,
  toDate,
} = {}) {
  if (!pacienteId || !fromDate || !toDate) return [];

  const { from, to } = getArgentinaDateRangeUtcBounds(fromDate, toDate);
  if (!from || !to) return [];

  let query = supabase
    .from(tableEvoluciones)
    .select(evolucionSelectFields)
    .eq("paciente_id", pacienteId)
    .gte("evolution_at", from)
    .lt("evolution_at", to)
    .order("evolution_at", { ascending: true });

  if (ingresoId) {
    query = query.eq("ingreso_id", ingresoId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEvolucionesByIngresoId(ingresoId) {
  const { data, error } = await supabase
    .from(tableEvoluciones)
    .select(evolucionSelectFields)
    .eq("ingreso_id", ingresoId)
    .order("evolution_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertPacienteEvolucion(payload) {
  const { data, error } = await supabase
    .from(tableEvoluciones)
    .insert(payload)
    .select(evolucionSelectFields)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPacienteEvolucionesExportContext({
  pacienteId,
  ingresoId,
  fromDate,
  toDate,
} = {}) {
  if (!pacienteId) {
    throw new Error("No se encontro el paciente para exportar las evoluciones.");
  }
  if (!ingresoId) {
    throw new Error("Seleccione un ingreso para imprimir las evoluciones.");
  }
  if (!fromDate || !toDate) {
    throw new Error("Debe indicar un rango valido para imprimir.");
  }

  const [pacienteResponse, ingresoResponse, evoluciones] = await Promise.all([
    supabase
      .from(tablePacientes)
      .select(pacienteExportSelectFields)
      .eq("id", pacienteId)
      .maybeSingle(),
    supabase
      .from(tableIngresos)
      .select(ingresoExportSelectFields)
      .eq("id", ingresoId)
      .eq("paciente_id", pacienteId)
      .maybeSingle(),
    getPacienteEvolucionesByRange({
      pacienteId,
      ingresoId,
      fromDate,
      toDate,
    }),
  ]);

  if (pacienteResponse.error) throw pacienteResponse.error;
  if (ingresoResponse.error) throw ingresoResponse.error;

  const paciente = pacienteResponse.data ?? null;
  const ingreso = ingresoResponse.data ?? null;

  if (!paciente) {
    throw new Error("No se pudo cargar la informacion del paciente.");
  }
  if (!ingreso) {
    throw new Error("No se pudo cargar la internacion seleccionada.");
  }

  return {
    paciente,
    ingreso,
    empresa: ingreso?.empresa ?? null,
    evoluciones: evoluciones ?? [],
    fromDate,
    toDate,
  };
}

export async function updatePacienteEvolucion(id, payload) {
  const { data, error } = await supabase
    .from(tableEvoluciones)
    .update(payload)
    .eq("id", id)
    .select(evolucionSelectFields)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertPacienteIndicacion(payload) {
  const { data, error } = await supabase
    .from(tableIndicaciones)
    .insert(payload)
    .select(indicacionSelectFields)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updatePacienteIndicacion(id, payload) {
  const { data, error } = await supabase
    .from(tableIndicaciones)
    .update(payload)
    .eq("id", id)
    .select(indicacionSelectFields)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPacienteIndicacionesByIngresoId(ingresoId) {
  const { data, error } = await supabase
    .from(tableIndicaciones)
    .select(indicacionSelectFields)
    .eq("ingreso_id", ingresoId)
    .order("indication_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPacienteEstudio(payload) {
  const { data, error } = await supabase
    .from(tableEstudios)
    .insert(payload)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return getPacienteEstudioById(data?.id);
}

export async function updatePacienteEstudio(id, payload) {
  const { data, error } = await supabase
    .from(tableEstudios)
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return getPacienteEstudioById(data?.id ?? id);
}

export async function deletePacienteEstudio(id) {
  const { error } = await supabase.from(tableEstudios).delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function insertPacienteEstudioArchivo(payload) {
  const { data, error } = await supabase
    .from(tableEstudiosArchivos)
    .insert(payload)
    .select(estudioArchivoSelectFields)
    .maybeSingle();
  if (error) {
    if (shouldFallbackToLegacyPacienteEstudiosSelect(error)) {
      throw new Error(
        "Falta aplicar el SQL de pacientes_estudios_archivos para adjuntar archivos en estudios."
      );
    }
    throw error;
  }
  return data ?? null;
}

export async function uploadPacienteEstudioArchivo({
  pacienteId,
  estudioId,
  file,
} = {}) {
  const filePath = buildPacienteEstudioStoragePath({
    pacienteId,
    estudioId,
    fileName: file?.name,
  });

  const { error } = await supabase.storage
    .from(bucketDocuments)
    .upload(filePath, file, {
      cacheControl: "0",
      upsert: false,
    });

  if (error) throw error;
  return filePath;
}

export async function removePacienteEstudioArchivo(filePath) {
  if (!filePath) return true;
  const { error } = await supabase.storage
    .from(bucketDocuments)
    .remove([filePath]);
  if (error) throw error;
  return true;
}

export async function getPacienteEstudioArchivoSignedUrl(
  filePath,
  expiresInSeconds = 90
) {
  const { data, error } = await supabase.storage
    .from(bucketDocuments)
    .createSignedUrl(filePath, expiresInSeconds);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function getPacienteEstudiosByIngresoId(ingresoId) {
  let response = await supabase
    .from(tableEstudios)
    .select(estudioSelectFields)
    .eq("ingreso_id", ingresoId)
    .order("requested_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (response.error && shouldFallbackToLegacyPacienteEstudiosSelect(response.error)) {
    response = await supabase
      .from(tableEstudios)
      .select("*")
      .eq("ingreso_id", ingresoId)
      .order("requested_at", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (response.error) throw response.error;
  return (response.data ?? []).map(mapPacienteEstudioRow);
}

export async function getIcd10MentalTreeNodes() {
  const { data, error } = await supabase
    .from(tableIcd10Mental)
    .select("code, description, node_type, parent_code, sort_key")
    .order("sort_key", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function searchIcd10MentalNodes({ term, limit = 30 } = {}) {
  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm) return [];

  const { data, error } = await supabase
    .from(tableIcd10Mental)
    .select("code, description, node_type, parent_code, sort_key")
    .or(`code.ilike.%${normalizedTerm}%,description.ilike.%${normalizedTerm}%`)
    .order("sort_key", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
