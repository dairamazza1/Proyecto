import { saveAs } from "file-saver";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { getArgentinaDateInputFromValue } from "./argentinaDateTime";
import {
  PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS,
  PACIENTE_ANTECEDENTES_PERSONAL_FIELDS,
  PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS,
  PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS,
  normalizeAntecedentesTextArray,
} from "./pacienteAntecedentes";

const CLINICA_NOMBRE = "CLINICA DE SALUD MENTAL DR GUTIERREZ WALKER";
const DOCUMENT_TITLE = "Ficha del paciente";

const SAFE_EMPTY = "-";

const safeText = (value) => {
  if (value === null || value === undefined) return SAFE_EMPTY;
  const normalized = String(value).trim();
  return normalized || SAFE_EMPTY;
};

const formatDateLabel = (value) => {
  const dateInput = getArgentinaDateInputFromValue(value);
  if (!dateInput) return safeText(value);
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return safeText(value);
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const formatYesNo = (value) => {
  if (value === true) return "Si";
  if (value === false) return "No";
  if (value === "true") return "Si";
  if (value === "false") return "No";
  return SAFE_EMPTY;
};

const formatArray = (value) => {
  const normalized = normalizeAntecedentesTextArray(value);
  return normalized.length ? normalized.join(", ") : SAFE_EMPTY;
};

const formatDocument = (type, number) => {
  const normalizedType = safeText(type);
  const normalizedNumber = safeText(number);
  if (normalizedType === SAFE_EMPTY && normalizedNumber === SAFE_EMPTY) {
    return SAFE_EMPTY;
  }
  if (normalizedType === SAFE_EMPTY) return normalizedNumber;
  if (normalizedNumber === SAFE_EMPTY) return normalizedType;
  return `${normalizedType} ${normalizedNumber}`;
};

const computeAge = (birthday) => {
  if (!birthday) return SAFE_EMPTY;
  const date = new Date(birthday);
  if (Number.isNaN(date.valueOf())) return SAFE_EMPTY;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? `${age} años` : SAFE_EMPTY;
};

const normalizeFileSegment = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "paciente";
};

const buildFileName = ({ paciente, ingreso }) => {
  const apellido = normalizeFileSegment(paciente?.last_name);
  const fecha =
    getArgentinaDateInputFromValue(
      ingreso?.admission_at ?? paciente?.created_at ?? new Date().toISOString(),
    )?.replace(/[^\d]/g, "") || "ficha";
  return `ficha_paciente_${apellido}_${fecha}.docx`;
};

const createSectionTitle = (text) =>
  new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 140 },
  });

const createBodyParagraph = (label, value) =>
  new Paragraph({
    spacing: { after: 110 },
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text: safeText(value) }),
    ],
  });

const createCell = (text, options = {}) =>
  new TableCell({
    width: {
      size: options.width ?? 50,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "D9E1EA" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "D9E1EA" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "D9E1EA" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "D9E1EA" },
    },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: safeText(text),
            bold: options.bold === true,
          }),
        ],
      }),
    ],
  });

const createKeyValueTable = (rows = []) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row) =>
      new TableRow({
        children: [
          createCell(row.label, { width: 34, bold: true }),
          createCell(row.value, { width: 66 }),
        ],
      }),
    ),
  });

const createContactsTable = (contacts = []) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createCell("Parentesco", { width: 18, bold: true }),
          createCell("Nombre", { width: 34, bold: true }),
          createCell("Telefono", { width: 22, bold: true }),
          createCell("Documento", { width: 26, bold: true }),
        ],
      }),
      ...(contacts.length
        ? contacts.map((contact) =>
            new TableRow({
              children: [
                createCell(contact?.vinculo, { width: 18 }),
                createCell(contact?.name, { width: 34 }),
                createCell(contact?.telephone, { width: 22 }),
                createCell(
                  formatDocument(contact?.doc_type, contact?.doc_number),
                  { width: 26 },
                ),
              ],
            }),
          )
        : [
            new TableRow({
              children: [
                createCell("Sin contactos cargados.", { width: 18 }),
                createCell("", { width: 34 }),
                createCell("", { width: 22 }),
                createCell("", { width: 26 }),
              ],
            }),
          ]),
    ],
  });

const buildPacienteNombre = (paciente) =>
  [paciente?.last_name, paciente?.first_name].filter(Boolean).join(", ") ||
  SAFE_EMPTY;

const buildAntecedentesParagraphs = (antecedentes) => {
  if (!antecedentes) {
    return [
      new Paragraph({
        text: "Sin antecedentes cargados.",
        spacing: { after: 120 },
      }),
    ];
  }

  const personalRows = [
    ...PACIENTE_ANTECEDENTES_PERSONAL_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, formatYesNo(antecedentes?.[field.name])),
    ),
    ...PACIENTE_ANTECEDENTES_PERSONAL_TEXT_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, antecedentes?.[field.name]),
    ),
  ];

  const clinicoRows = [
    ...PACIENTE_ANTECEDENTES_CLINICO_BOOLEAN_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, formatYesNo(antecedentes?.[field.name])),
    ),
    ...PACIENTE_ANTECEDENTES_CLINICO_TEXT_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, antecedentes?.[field.name]),
    ),
  ];

  const psicopatologicoRows = [
    ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_MULTI_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, formatArray(antecedentes?.[field.name])),
    ),
    ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_BOOLEAN_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, formatYesNo(antecedentes?.[field.name])),
    ),
    ...PACIENTE_ANTECEDENTES_PSICOPATOLOGICO_TEXT_ARRAY_FIELDS.map((field) =>
      createBodyParagraph(`${field.label}: `, formatArray(antecedentes?.[field.name])),
    ),
  ];

  return [
    createSectionTitle("Antecedentes personales"),
    ...personalRows,
    createSectionTitle("Antecedentes clínicos"),
    ...clinicoRows,
    createSectionTitle("Examen psicopatológico"),
    ...psicopatologicoRows,
  ];
};

export const downloadPacienteFichaDocx = async ({
  paciente,
  ingreso,
  cobertura,
  antecedentes,
  emergencyContacts = [],
} = {}) => {
  if (!paciente?.id) {
    throw new Error("No se encontró el paciente para generar la ficha.");
  }

  const patientInfoRows = [
    { label: "Apellido y nombres", value: buildPacienteNombre(paciente) },
    { label: "Documento", value: formatDocument(paciente?.document_type, paciente?.document_number) },
    { label: "Fecha de nacimiento", value: formatDateLabel(paciente?.birthday) },
    { label: "Edad", value: computeAge(paciente?.birthday) },
    { label: "Género", value: paciente?.genre },
    { label: "Teléfono", value: paciente?.telephone },
    { label: "Email", value: paciente?.email },
    { label: "Dirección", value: paciente?.address },
    { label: "Localidad", value: paciente?.localidad },
    { label: "Lugar de nacimiento", value: paciente?.lugar_nacimiento },
    { label: "Estado civil", value: paciente?.estado_civil },
    { label: "Convivencia", value: paciente?.convivencia },
    { label: "Educación", value: paciente?.educacion },
    { label: "Alfabetizado", value: formatYesNo(paciente?.alfabetizado) },
    { label: "Ocupación", value: paciente?.ocupacion },
    { label: "Religión", value: paciente?.religion },
    {
      label: "Cantidad de hijos",
      value:
        paciente?.hijos === null || paciente?.hijos === undefined
          ? SAFE_EMPTY
          : String(paciente.hijos),
    },
    { label: "Cobertura", value: cobertura?.coverage },
    { label: "Detalle de cobertura", value: cobertura?.coverage_notes },
    { label: "Fecha de ingreso", value: formatDateLabel(ingreso?.admission_at) },
    { label: "Tipo de internación", value: ingreso?.adminission_type },
    { label: "Motivo de internación", value: ingreso?.admission_reason },
    { label: "Diagnóstico principal", value: ingreso?.admission_diagnosis },
    {
      label: "Diagnóstico secundario",
      value: ingreso?.admission_diagnosis_alternative,
    },
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: CLINICA_NOMBRE,
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
          }),
          new Paragraph({
            text: DOCUMENT_TITLE,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `Fecha de emisión: ${formatDateLabel(new Date().toISOString())}`,
              }),
            ],
          }),
          createSectionTitle("Información del paciente"),
          createKeyValueTable(patientInfoRows),
          ...buildAntecedentesParagraphs(antecedentes),
          createSectionTitle("Contactos de emergencia"),
          createContactsTable(emergencyContacts),
          createSectionTitle("Firma profesional"),
          createBodyParagraph(
            "Sello y firma del médico psiquiatra: ",
            "____________________________",
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = buildFileName({ paciente, ingreso });
  saveAs(blob, fileName);
  return fileName;
};
