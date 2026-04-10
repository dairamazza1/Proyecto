import { saveAs } from "file-saver";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { getArgentinaDateInputFromValue } from "./argentinaDateTime";
import {
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS,
  PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS,
  getEpicrisisArrayValue,
  getEpicrisisBooleanValue,
  getEpicrisisTextValue,
} from "./pacienteEpicrisis";

const CLINICA_NOMBRE = "CLINICA DE SALUD MENTAL DR GUTIERREZ WALKER";
const EPICRISIS_TITULO = "Epicrisis de alta sanatorial";
const BLANK_TEAM_FIELD = "____________________________";

const safeText = (value) => {
  if (value === null || value === undefined) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
};

const formatDateInputLabel = (value) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return safeText(value);
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const formatArgentinaDateLabel = (value) => {
  const dateInput = getArgentinaDateInputFromValue(value);
  return dateInput ? formatDateInputLabel(dateInput) : safeText(value);
};

const buildPacienteNombre = (paciente) =>
  safeText([paciente?.first_name, paciente?.last_name].filter(Boolean).join(" "));

const buildCoverageLabel = (cobertura) =>
  safeText(
    cobertura?.coverage ?? cobertura?.coverage_display_name ?? cobertura?.coverage_name,
  );

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
    getArgentinaDateInputFromValue(ingreso?.discharge_at ?? ingreso?.admission_at)
      ?.replace(/[^\d]/g, "") || "egreso";
  return `epicrisis_${apellido}_${fecha}.docx`;
};

const createLabelParagraph = (label, value, extra = {}) =>
  new Paragraph({
    spacing: { after: 110 },
    ...extra,
    children: [
      new TextRun({
        text: label,
        bold: true,
      }),
      new TextRun({
        text: safeText(value),
      }),
    ],
  });

const buildEpicrisisFieldParagraphs = (fields, formatter, epicrisis) =>
  fields.map((field) =>
    createLabelParagraph(
      `${field.label}: `,
      formatter(field.name, epicrisis?.[field.name]),
    ),
  );

export const downloadPacienteEpicrisisDocx = async ({
  paciente,
  ingreso,
  epicrisis,
  cobertura,
} = {}) => {
  if (!ingreso?.id) {
    throw new Error("Seleccione una internacion cerrada para descargar la epicrisis.");
  }

  if (!epicrisis) {
    throw new Error("No hay una epicrisis registrada para esta internacion.");
  }

  const fechaDocumento =
    ingreso?.discharge_at ?? epicrisis?.updated_at ?? epicrisis?.created_at ?? null;

  const children = [
    new Paragraph({
      text: CLINICA_NOMBRE,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 160 },
    }),
    new Paragraph({
      text: EPICRISIS_TITULO,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 220 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: `Buenos Aires, ${formatArgentinaDateLabel(fechaDocumento)}`,
        }),
      ],
    }),
    createLabelParagraph("Paciente: ", buildPacienteNombre(paciente)),
    createLabelParagraph("DNI: ", paciente?.document_number),
    createLabelParagraph("Cobertura social: ", buildCoverageLabel(cobertura)),
    new Paragraph({ text: "", spacing: { after: 80 } }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: "Equipo interdisciplinario:", bold: true })],
    }),
    createLabelParagraph("Medico psiquiatra: ", BLANK_TEAM_FIELD),
    createLabelParagraph("Psicologo: ", BLANK_TEAM_FIELD),
    new Paragraph({ text: "", spacing: { after: 80 } }),
    new Paragraph({
      text: "Informe interdisciplinario",
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 180 },
    }),
    ...buildEpicrisisFieldParagraphs(
      PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_BOOLEAN_FIELDS,
      (_fieldName, value) => getEpicrisisBooleanValue(value),
      epicrisis,
    ),
    ...buildEpicrisisFieldParagraphs(
      PACIENTE_EGRESO_EPICRISIS_INTERDISCIPLINARY_SELECT_FIELDS,
      getEpicrisisArrayValue,
      epicrisis,
    ),
    new Paragraph({ text: "", spacing: { after: 80 } }),
    new Paragraph({
      text: "Consideraciones profesionales",
      heading: HeadingLevel.HEADING_3,
      spacing: { after: 180 },
    }),
    ...buildEpicrisisFieldParagraphs(
      PACIENTE_EGRESO_EPICRISIS_PROFESSIONAL_BOOLEAN_FIELDS,
      (_fieldName, value) => getEpicrisisBooleanValue(value),
      epicrisis,
    ),
    ...buildEpicrisisFieldParagraphs(
      PACIENTE_EGRESO_EPICRISIS_TEXT_FIELDS,
      (_fieldName, value) => getEpicrisisTextValue(value),
      epicrisis,
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = buildFileName({ paciente, ingreso });
  saveAs(blob, fileName);
  return fileName;
};
