const safeString = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const uniqueArray = (values = []) =>
  Array.from(new Set((values ?? []).map((value) => safeString(value)).filter(Boolean)));

export const PACIENTE_ANTECEDENTES_PERSONAL_FIELDS = [
  {
    name: "personal_trastornos_crecimiento",
    label: "Trastornos en las pautas de crecimiento",
  },
  {
    name: "personal_trastornos_aprendizaje",
    label: "Trastornos en el aprendizaje",
  },
  {
    name: "personal_antecedentes_tratamientos",
    label: "Antecedentes de tratamientos",
  },
  {
    name: "personal_antecedentes_familia_psiquiatricos",
    label: "Antecedentes psiquiátricos en la familia",
  },
];

export const PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS = [
  {
    name: "personal_antecedentes_tratamientos_obs",
    label: "Observaciones sobre tratamientos",
  },
  {
    name: "personal_antecedentes_familia_psiquiatricos_obs",
    label: "Observaciones sobre antecedentes psiquiátricos en la familia",
  },
];

export const PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS = [
  { name: "clinico_enf_cardiovascular", label: "Enfermedad cardiovascular" },
  { name: "clinico_enf_hta", label: "HTA" },
  { name: "clinico_enf_neurologica", label: "Enfermedad neurológica" },
  { name: "clinico_enf_endocrinas", label: "Enfermedades endocrinas" },
  { name: "clinico_enf_digestivas", label: "Enfermedades digestivas" },
  { name: "clinico_enf_diabetes", label: "Diabetes" },
  { name: "clinico_enf_respiratorias", label: "Enfermedades respiratorias" },
  { name: "clinico_enf_oftalmologicas", label: "Enfermedades oftalmológicas" },
  {
    name: "clinico_enf_ginecologicas_urologicas",
    label: "Enfermedades ginecológicas o urológicas",
  },
  { name: "clinico_enf_quirurgicas", label: "Intervenciones quirúrgicas" },
  { name: "clinico_enf_consumo_sustancias", label: "Consumo de sustancias" },
  { name: "clinico_enf_alergias", label: "Alergias" },
];

export const PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS = [
  {
    name: "clinico_obs",
    label: "Otras enfermedades u observaciones",
  },
];

export const PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS = [
  {
    name: "psicopatologico_presentacion",
    label: "Presentación",
    options: ["Aseado", "Desprolijo"],
  },
  {
    name: "psicopatologico_actitud_psi",
    label: "Actitud psíquica",
    options: ["Normobúlico", "Hipobúlico", "Hiperbulia", "Abulia"],
  },
  {
    name: "psicopatologico_conducta",
    label: "Conducta",
    options: ["Sereno", "Agitado", "Negativista", "Agresivo"],
  },
  {
    name: "psicopatologico_animo",
    label: "Ánimo",
    options: [
      "Angustia",
      "Ansiedad",
      "Exaltación",
      "Depresivo",
      "Apatía",
      "Labilidad emocional",
      "Estable",
    ],
  },
  {
    name: "psicopatologico_lenguaje",
    label: "Lenguaje",
    options: ["Empobrecido", "Concreto", "Verborrágico", "Acorde"],
  },
  {
    name: "psicopatologico_curso_pensamiento",
    label: "Curso del pensamiento",
    options: ["Normal", "Acelerado", "Lento", "Rígido", "Concreto", "Disgregado"],
  },
  {
    name: "psicopatologico_contenido_pensamiento",
    label: "Contenido del pensamiento",
    options: ["Lógico", "Incoherente", "Delirante", "Obsesivo"],
  },
  {
    name: "psicopatologico_ideacion",
    label: "Ideación",
    options: [
      "Megalómana",
      "Mística",
      "Melancólica",
      "Daño paranoide",
      "Suicida",
      "Fóbica",
      "Celos",
    ],
  },
  {
    name: "psicopatologico_funcion_intelectual",
    label: "Función intelectual",
    options: ["Conservadas", "Empobrecidas"],
  },
  {
    name: "psicopatologico_orientacion_te",
    label: "Orientación T-E",
    options: ["Desorientado", "Orientado"],
  },
  {
    name: "psicopatologico_memoria",
    label: "Memoria",
    options: ["Conservada", "Parcial", "Confuso"],
  },
  {
    name: "psicopatologico_conciencia",
    label: "Conciencia",
    options: ["Vigil", "Lúcido", "No lúcido"],
  },
  {
    name: "psicopatologico_juicio_realidad",
    label: "Juicio de realidad",
    options: ["Conservado", "Desviado", "Insuficiente", "Suspendido"],
  },
  {
    name: "psicopatologico_psicomotricidad",
    label: "Psicomotricidad",
    options: ["Conservada", "Deficiente"],
  },
  {
    name: "psicopatologico_consultas_previas",
    label: "Consultas previas",
    options: ["Psicología", "Psiquiatría", "Neurología"],
  },
];

export const PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS = [
  {
    name: "psicopatologico_alteracion_sensopercep",
    label: "Alteración sensoperceptiva",
  },
  {
    name: "psicopatologico_peligrosidad",
    label: "Peligrosidad inminente",
  },
  {
    name: "psicopatologico_consc_enf",
    label: "Conciencia de enfermedad",
  },
  {
    name: "psicopatologico_ant_psiquiatricos",
    label: "Antecedentes psiquiátricos",
  },
  {
    name: "psicopatologico_medicacion",
    label: "Medicación actual",
  },
];

export const PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS = [
  {
    name: "psicopatologico_medicacion_obs",
    label: "Indicar medicación actual",
  },
];

export const PACIENTE_ANTECEDENTES_BOOLEAN_FIELD_NAMES = [
  ...PACIENTE_ANTECEDENTES_PERSONAL_FIELDS.map((field) => field.name),
  ...PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS.map((field) => field.name),
  ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS.map(
    (field) => field.name
  ),
];

export const PACIENTE_ANTECEDENTES_TEXT_FIELD_NAMES = [
  ...PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS.map((field) => field.name),
  ...PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS.map((field) => field.name),
];

export const PACIENTE_ANTECEDENTES_ARRAY_FIELD_NAMES = [
  ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS.map((field) => field.name),
  ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS.map(
    (field) => field.name
  ),
];

export const PACIENTE_ANTECEDENTES_ALL_FIELD_NAMES = [
  ...PACIENTE_ANTECEDENTES_BOOLEAN_FIELD_NAMES,
  ...PACIENTE_ANTECEDENTES_TEXT_FIELD_NAMES,
  ...PACIENTE_ANTECEDENTES_ARRAY_FIELD_NAMES,
];

export const createDefaultPacienteAntecedentesFormValues = () => ({
  personal_trastornos_crecimiento: false,
  personal_trastornos_aprendizaje: false,
  personal_antecedentes_tratamientos: false,
  personal_antecedentes_tratamientos_obs: "",
  personal_antecedentes_familia_psiquiatricos: false,
  personal_antecedentes_familia_psiquiatricos_obs: "",
  clinico_enf_cardiovascular: false,
  clinico_enf_hta: false,
  clinico_enf_neurologica: false,
  clinico_enf_endocrinas: false,
  clinico_enf_digestivas: false,
  clinico_enf_diabetes: false,
  clinico_enf_respiratorias: false,
  clinico_enf_oftalmologicas: false,
  clinico_enf_ginecologicas_urologicas: false,
  clinico_enf_quirurgicas: false,
  clinico_enf_consumo_sustancias: false,
  clinico_enf_alergias: false,
  clinico_obs: "",
  psicopatologico_presentacion: [],
  psicopatologico_actitud_psi: [],
  psicopatologico_conducta: [],
  psicopatologico_animo: [],
  psicopatologico_lenguaje: [],
  psicopatologico_curso_pensamiento: [],
  psicopatologico_contenido_pensamiento: [],
  psicopatologico_ideacion: [],
  psicopatologico_funcion_intelectual: [],
  psicopatologico_orientacion_te: [],
  psicopatologico_memoria: [],
  psicopatologico_conciencia: [],
  psicopatologico_juicio_realidad: [],
  psicopatologico_psicomotricidad: [],
  psicopatologico_consultas_previas: [],
  psicopatologico_alteracion_sensopercep: false,
  psicopatologico_peligrosidad: false,
  psicopatologico_consc_enf: false,
  psicopatologico_ant_psiquiatricos: false,
  psicopatologico_medicacion: false,
  psicopatologico_medicacion_obs: [],
});

export const toAntecedentesFormBoolean = (value) => value === true;

export const toAntecedentesPayloadBoolean = (value) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return false;
};

export const normalizeAntecedentesTextArray = (value) => {
  if (Array.isArray(value)) return uniqueArray(value);

  const raw = safeString(value);
  if (!raw) return [];

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return uniqueArray(parsed);
    } catch {
      // fallback below
    }
  }

  if (raw.startsWith("{") && raw.endsWith("}")) {
    const normalized = raw
      .slice(1, -1)
      .split(",")
      .map((item) => item.replace(/^"(.*)"$/, "$1"));
    return uniqueArray(normalized);
  }

  if (raw.includes(",")) {
    return uniqueArray(raw.split(","));
  }

  return [raw];
};

export const mapPacienteAntecedentesToFormValues = (record) => {
  const defaults = createDefaultPacienteAntecedentesFormValues();
  if (!record) return defaults;

  PACIENTE_ANTECEDENTES_BOOLEAN_FIELD_NAMES.forEach((fieldName) => {
    defaults[fieldName] = toAntecedentesFormBoolean(record?.[fieldName]);
  });

  PACIENTE_ANTECEDENTES_TEXT_FIELD_NAMES.forEach((fieldName) => {
    defaults[fieldName] = safeString(record?.[fieldName]);
  });

  PACIENTE_ANTECEDENTES_ARRAY_FIELD_NAMES.forEach((fieldName) => {
    defaults[fieldName] = normalizeAntecedentesTextArray(record?.[fieldName]);
  });

  return defaults;
};

export const hasPacienteAntecedentesContent = (values) => {
  if (!values) return false;

  return PACIENTE_ANTECEDENTES_ALL_FIELD_NAMES.some((fieldName) => {
    const value = values?.[fieldName];
    if (Array.isArray(value)) return normalizeAntecedentesTextArray(value).length > 0;
    if (typeof value === "boolean") return value === true;
    if (value === "true" || value === "false") return value === "true";
    return safeString(value).length > 0;
  });
};
