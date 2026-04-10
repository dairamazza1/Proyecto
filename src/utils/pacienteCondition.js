export const PACIENTE_CONDITION_OPTIONS = [
  { id: "agudo", label: "Agudo" },
  { id: "cronico", label: "Cronico" },
  { id: "hospital_de_dia", label: "Hospital de dia" },
  { id: "residencia_asistida", label: "Residencia asistida" },
];

export const PACIENTE_CONDITION_TABS = PACIENTE_CONDITION_OPTIONS.map(
  ({ id, label }) => ({
    id,
    label,
  })
);

export const PACIENTE_DEFAULT_EPISODE_FILTER_BY_CONDITION = {
  agudo: "admitted",
  cronico: "admitted",
  hospital_de_dia: "admitted",
  residencia_asistida: "admitted",
};

export function normalizePacienteConditionType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return "";
  if (normalized === "agudo") return "agudo";
  if (normalized === "cronico") return "cronico";
  if (normalized === "hospital_de_dia") return "hospital_de_dia";
  if (normalized === "residencia_asistida") return "residencia_asistida";
  return normalized;
}

export function formatPacienteConditionType(value) {
  const normalized = normalizePacienteConditionType(value);
  const match = PACIENTE_CONDITION_OPTIONS.find(
    (option) => option.id === normalized
  );

  if (match) {
    return match.label;
  }

  const raw = String(value ?? "").trim();
  return raw || "-";
}
