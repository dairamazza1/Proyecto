const normalizeOptionKey = (value) =>
  String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS = [
  {
    name: "orientado_tiempo_espacio",
    label: "Orientado en tiempo y espacio",
  },
  {
    name: "conciencia_enfermedad",
    label: "Conciencia de enfermedad",
  },
];

export const PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS = [
  {
    name: "conciencia",
    label: "Conciencia",
    options: ["Vigil", "Obnubilada", "Estuporosa"],
  },
  {
    name: "actitud",
    label: "Actitud",
    options: ["Colaborador activo", "Colaborador pasivo"],
  },
  {
    name: "atencion",
    label: "Atencion",
    options: ["Espontanea", "Aumentada", "Disminuida"],
  },
  {
    name: "memoria",
    label: "Memoria",
    options: ["Conservada", "Parcial", "Confusa"],
  },
  {
    name: "sensopercepcion",
    label: "Sensopercepcion",
    options: ["Conservada", "Alterada"],
  },
  {
    name: "ideacion",
    label: "Ideacion",
    options: ["Delirante", "Obsesiva", "Fijas", "No"],
  },
  {
    name: "juicio",
    label: "Juicio",
    options: ["Normal", "Desviado", "Insuficiente", "Suspendido"],
  },
  {
    name: "afectividad",
    label: "Afectividad",
    options: ["Normal", "Placentera", "Displacentera", "Atimia", "Labilidad"],
  },
  {
    name: "voluntad",
    label: "Voluntad",
    options: ["Normal", "Hipobulica", "Abulia", "Hiperbulia"],
  },
  {
    name: "lenguaje",
    label: "Lenguaje",
    options: ["Normal", "Lento", "Acelerado", "Ecolalia"],
  },
  {
    name: "suenio",
    label: "Sueno",
    options: ["Conservado", "Alterado", "Inducido"],
  },
  {
    name: "apetito",
    label: "Apetito",
    options: ["Conservado", "Alterado", "Inducido"],
  },
];

export const PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS = [
  {
    name: "riesgo_cierto_inminente",
    label: "Riesgo cierto e inminente",
  },
  {
    name: "necesidad_internacion",
    label: "Necesidad de internacion",
  },
  {
    name: "puede_cumplir_indicaciones_terapeuticas",
    label: "Puede cumplir indicaciones terapeuticas",
  },
  {
    name: "puede_vivir_solo",
    label: "Puede vivir solo",
  },
  {
    name: "requiere_supervision_vida_cotidiana",
    label: "Requiere supervision para el desarrollo de su vida cotidiana",
  },
  {
    name: "puede_realizar_actividad_laboral_remunerada",
    label: "Puede realizar actividad laboral remunerada",
  },
  {
    name: "conoce_valor_dinero",
    label: "Conoce el valor del dinero",
  },
];

export const PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS = [
  {
    name: "diagnostico",
    label: "Diagnostico",
    rows: 4,
  },
  {
    name: "pronostico",
    label: "Pronostico",
    rows: 4,
  },
  {
    name: "indicaciones_terapeuticas",
    label: "Indicaciones terapeuticas",
    rows: 5,
  },
];

export const PACIENTE_EGRESO_EPICRISIS_ARRAY_FIELD_NAMES =
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS.map(
    (field) => field.name,
  );

export const PACIENTE_EGRESO_EPICRISIS_BOOLEAN_FIELD_NAMES = [
  ...PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS,
  ...PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS,
].map((field) => field.name);

export const PACIENTE_EGRESO_EPICRISIS_TEXT_FIELD_NAMES =
  PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS.map((field) => field.name);

const SELECT_OPTIONS_BY_FIELD = new Map(
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS.map((field) => [
    field.name,
    new Map(field.options.map((option) => [normalizeOptionKey(option), option])),
  ]),
);

export const normalizeEpicrisisSelectValue = (fieldName, value) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const optionsByValue = SELECT_OPTIONS_BY_FIELD.get(fieldName);
  return optionsByValue?.get(normalizeOptionKey(normalized)) ?? normalized;
};

export const getEpicrisisArrayValue = (fieldName, value) => {
  if (!Array.isArray(value) || !value.length) return "-";
  const normalized = normalizeEpicrisisSelectValue(fieldName, value[0]);
  return normalized || "-";
};

export const getEpicrisisBooleanValue = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  return "-";
};

export const getEpicrisisTextValue = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};
