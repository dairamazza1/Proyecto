import { supabase } from "./supabase.config.jsx";
import {
  PACIENTE_ANTECEDENTES_ARRAY_FIELD_NAMES,
  PACIENTE_ANTECEDENTES_BOOLEAN_FIELD_NAMES,
  PACIENTE_ANTECEDENTES_TEXT_FIELD_NAMES,
  hasPacienteAntecedentesContent,
  normalizeAntecedentesTextArray,
  toAntecedentesPayloadBoolean,
} from "../utils/pacienteAntecedentes";

const tablePacientesAntecedentes = "pacientes_antecedentes";

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const toNullableString = (value) => {
  const normalized = safeString(value);
  return normalized ? normalized : null;
};

const normalizePacienteAntecedentesPayload = ({ pacienteId, antecedentes }) => {
  const payload = {
    paciente_id: pacienteId,
  };

  PACIENTE_ANTECEDENTES_BOOLEAN_FIELD_NAMES.forEach((fieldName) => {
    payload[fieldName] = toAntecedentesPayloadBoolean(antecedentes?.[fieldName]);
  });

  PACIENTE_ANTECEDENTES_TEXT_FIELD_NAMES.forEach((fieldName) => {
    payload[fieldName] = toNullableString(antecedentes?.[fieldName]);
  });

  PACIENTE_ANTECEDENTES_ARRAY_FIELD_NAMES.forEach((fieldName) => {
    payload[fieldName] = normalizeAntecedentesTextArray(antecedentes?.[fieldName]);
  });

  if (payload.personal_antecedentes_tratamientos !== true) {
    payload.personal_antecedentes_tratamientos_obs = null;
  }

  if (payload.personal_antecedentes_familia_psiquiatricos !== true) {
    payload.personal_antecedentes_familia_psiquiatricos_obs = null;
  }

  if (payload.psicopatologico_medicacion !== true) {
    payload.psicopatologico_medicacion_obs = [];
  }

  return payload;
};

export async function getPacienteAntecedentesByPacienteId(pacienteId) {
  if (!pacienteId) return null;

  const { data, error } = await supabase
    .from(tablePacientesAntecedentes)
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function syncPacienteAntecedentes({ pacienteId, antecedentes }) {
  if (!pacienteId) {
    throw new Error("No se encontro el paciente para guardar antecedentes.");
  }

  const existing = await getPacienteAntecedentesByPacienteId(pacienteId);
  const payload = normalizePacienteAntecedentesPayload({
    pacienteId,
    antecedentes,
  });

  if (!existing && !hasPacienteAntecedentesContent(payload)) {
    return null;
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from(tablePacientesAntecedentes)
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  const { data, error } = await supabase
    .from(tablePacientesAntecedentes)
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

