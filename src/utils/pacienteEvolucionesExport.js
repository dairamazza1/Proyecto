import { saveAs } from "file-saver";
import {
  AlignmentType,
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
import {
  getArgentinaDateInputFromValue,
  getArgentinaTodayDateInput,
  isoToArgentinaDateTimeInput,
} from "./argentinaDateTime";
import { resolvePerfilDisplayName } from "./perfilDisplay";
import { buildPacientePrintHeader } from "./pacientePrintBanner";

const CLINICA_NOMBRE = "CLINICA DE SALUD MENTAL DR GUTIERREZ WALKER";
const DOCUMENT_TITLE = "Evoluciones";

const safeText = (value) => {
  if (value === null || value === undefined) return "-";
  const normalized = String(value).trim();
  return normalized ? normalized : "-";
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

const formatArgentinaDateTimeLabel = (value) => {
  const normalized = isoToArgentinaDateTimeInput(value);
  if (!normalized) return safeText(value);
  const [dateInput, timeInput] = normalized.split("T");
  return `${formatDateInputLabel(dateInput)} ${timeInput ?? ""}`.trim();
};

const formatDocument = (type, number) => {
  const typeLabel = safeText(type);
  const numberLabel = safeText(number);

  if (typeLabel === "-" && numberLabel === "-") return "-";
  if (typeLabel === "-") return numberLabel;
  if (numberLabel === "-") return typeLabel;
  return `${typeLabel} ${numberLabel}`;
};

const computeAge = (birthDate) => {
  const raw = String(birthDate ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "-";

  const today = getArgentinaTodayDateInput();
  const todayMatch = today.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!todayMatch) return "-";

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  const currentYear = Number(todayMatch[1]);
  const currentMonth = Number(todayMatch[2]);
  const currentDay = Number(todayMatch[3]);

  let age = currentYear - birthYear;
  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)
  ) {
    age -= 1;
  }

  return age >= 0 ? `${age} años` : "-";
};

const buildPacienteNombre = (paciente) =>
  safeText([paciente?.first_name, paciente?.last_name].filter(Boolean).join(" "));

const buildProfesionalLabel = (evolucion) =>
  resolvePerfilDisplayName(evolucion?.creador, evolucion?.created_by);

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

const buildFileName = ({ paciente, fromDate, toDate }) => {
  const apellido = normalizeFileSegment(paciente?.last_name);
  const fromSegment = String(fromDate ?? "").replace(/[^\d]/g, "") || "desde";
  const toSegment = String(toDate ?? "").replace(/[^\d]/g, "") || "hasta";
  return `evoluciones_${apellido}_${fromSegment}_${toSegment}.docx`;
};

const createLabelParagraph = (label, value) =>
  new Paragraph({
    spacing: { after: 110 },
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text: safeText(value) }),
    ],
  });

const createTableCell = (text, width, bold = false) =>
  new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: safeText(text), bold })],
      }),
    ],
  });

export const exportPacienteEvolucionesDocx = async ({
  empresa,
  paciente,
  ingreso,
  evoluciones = [],
  fromDate,
  toDate,
  banner = null,
} = {}) => {
  if (!evoluciones?.length) {
    throw new Error("No hay evoluciones para el periodo seleccionado.");
  }

  const evolucionesRows = evoluciones.map(
    (evolucion) =>
      new TableRow({
        children: [
          createTableCell(formatArgentinaDateTimeLabel(evolucion?.evolution_at), 22),
          createTableCell(buildProfesionalLabel(evolucion), 24),
          createTableCell(evolucion?.notes, 54),
        ],
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: [
          ...buildPacientePrintHeader({
            banner,
            clinicName: safeText(empresa?.name ?? empresa?.nombre ?? CLINICA_NOMBRE),
            title: DOCUMENT_TITLE,
            subtitle: ingreso?.sucursal?.name
              ? `Sucursal: ${safeText(ingreso.sucursal.name)}`
              : "",
          }),
          createLabelParagraph("Paciente: ", buildPacienteNombre(paciente)),
          createLabelParagraph(
            "Documento: ",
            formatDocument(paciente?.document_type, paciente?.document_number),
          ),
          createLabelParagraph(
            "Fecha de nacimiento: ",
            formatArgentinaDateLabel(paciente?.birthday),
          ),
          createLabelParagraph("Edad: ", computeAge(paciente?.birthday)),
          createLabelParagraph(
            "Fecha de ingreso: ",
            formatArgentinaDateLabel(ingreso?.admission_at),
          ),
          createLabelParagraph(
            "Fecha de egreso: ",
            ingreso?.discharge_at
              ? formatArgentinaDateLabel(ingreso?.discharge_at)
              : "-",
          ),
          createLabelParagraph("Motivo de internación: ", ingreso?.admission_reason),
          createLabelParagraph(
            "Diagnóstico de ingreso: ",
            ingreso?.admission_diagnosis,
          ),
          createLabelParagraph(
            "Período: ",
            `${formatDateInputLabel(fromDate)} - ${formatDateInputLabel(toDate)}`,
          ),
          new Paragraph({
            text: "Detalle de evoluciones",
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 220, after: 140 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell("Fecha y hora", 22, true),
                  createTableCell("Profesional", 24, true),
                  createTableCell("Detalle", 54, true),
                ],
              }),
              ...evolucionesRows,
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = buildFileName({ paciente, fromDate, toDate });
  saveAs(blob, fileName);
  return fileName;
};
