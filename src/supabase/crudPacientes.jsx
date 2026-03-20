import { supabase } from "./supabase.config.jsx";

const tablePacientes = "pacientes";
const tableIngresos = "pacientes_ingresos";
const tableCoberturas = "pacientes_coberturas";
const tableEvoluciones = "pacientes_evoluciones";
const tableIndicaciones = "pacientes_indicaciones";
const tableEstudios = "pacientes_estudios";
const tableEquipo = "pacientes_equipo_tratante";
const tableIcd10Mental = "icd10_mental_nodes";
const tableCoberturasFinanciadores = "coberturas_financiadores";
const tableCoberturasPlanes = "coberturas_financiadores_planes";
const VALID_COVERAGE_TYPES = new Set([
  "obra_social",
  "prepaga",
  "particular",
]);

const normalizeSearchTerm = (term) => String(term ?? "").trim();
const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);
const toNullableString = (value) => {
  const normalized = safeString(value).trim();
  return normalized ? normalized : null;
};
const toNullableId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
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
const isIngresoActivo = (ingreso) =>
  String(ingreso?.status ?? "").toLowerCase() === "admitted" &&
  !ingreso?.discharge_at;

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

export async function getPacientesActivos({ empresaId, search } = {}) {
  const term = normalizeSearchTerm(search);

  let patientsQuery = supabase
    .from(tablePacientes)
    .select(
      `
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
    `
    )
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (empresaId) {
    patientsQuery = patientsQuery.eq("empresa_id", empresaId);
  }

  if (term) {
    patientsQuery = patientsQuery.or(
      `document_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    );
  }

  const { data: patients, error } = await patientsQuery;
  if (error) throw error;

  if (!patients?.length) return [];

  const patientIds = patients.map((patient) => patient.id);
  const { data: ingresos, error: ingresosError } = await supabase
    .from(tableIngresos)
    .select(
      "id,paciente_id,admission_at,admission_diagnosis,status,discharge_at"
    )
    .in("paciente_id", patientIds)
    .order("admission_at", { ascending: false });

  if (ingresosError) throw ingresosError;

  const activeIngresoByPatient = new Map();
  (ingresos ?? []).forEach((ingreso) => {
    if (!isIngresoActivo(ingreso) || activeIngresoByPatient.has(ingreso.paciente_id)) {
      return;
    }
    activeIngresoByPatient.set(ingreso.paciente_id, ingreso);
  });

  return patients
    .filter((patient) => activeIngresoByPatient.has(patient.id))
    .map((patient) => {
      const activeIngreso = activeIngresoByPatient.get(patient.id);
      return {
        ...patient,
        admission_at: activeIngreso?.admission_at ?? null,
        admission_diagnosis: activeIngreso?.admission_diagnosis ?? "",
        ingreso_id: activeIngreso?.id ?? null,
        ingreso_status: activeIngreso?.status ?? null,
        discharge_at: activeIngreso?.discharge_at ?? null,
      };
    });
}

export async function getPacientesIngresadosHoy({ empresaId, search } = {}) {
  return getPacientesActivos({ empresaId, search });
}

export async function searchPacientes({
  empresaId,
  term,
  limit = 15,
} = {}) {
  const normalizedTerm = normalizeSearchTerm(term);
  if (!normalizedTerm) return [];

  let query = supabase
    .from(tablePacientes)
    .select(
      `
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
    `
    )
    .eq("is_active", true)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .limit(limit);

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  query = query.or(
    `document_number.ilike.%${normalizedTerm}%,first_name.ilike.%${normalizedTerm}%,last_name.ilike.%${normalizedTerm}%`
  );

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
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

export async function insertPacienteIngreso(payload) {
  const { data, error } = await supabase
    .from(tableIngresos)
    .insert(payload)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
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
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("admission_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEquipoTratanteByPacienteId(pacienteId) {
  const { data, error } = await supabase
    .from(tableEquipo)
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEvolucionesByIngresoId(ingresoId) {
  const { data, error } = await supabase
    .from(tableEvoluciones)
    .select("*")
    .eq("ingreso_id", ingresoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteIndicacionesByIngresoId(ingresoId) {
  const { data, error } = await supabase
    .from(tableIndicaciones)
    .select("*")
    .eq("ingreso_id", ingresoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteEstudiosByIngresoId(ingresoId) {
  const { data, error } = await supabase
    .from(tableEstudios)
    .select("*")
    .eq("ingreso_id", ingresoId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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
