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
import { buildPacientePrintHeader } from "./pacientePrintBanner";

const SAFE_EMPTY = "-";

const safeText = (value) => {
  if (value === null || value === undefined) return SAFE_EMPTY;
  const normalized = String(value).trim();
  return normalized || SAFE_EMPTY;
};

const createTitle = (text) =>
  new Paragraph({
    text: safeText(text),
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
  });

const createCompanyTitle = (text) =>
  new Paragraph({
    text: safeText(text),
    heading: HeadingLevel.HEADING_4,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });

const createSpacer = (after = 120) =>
  new Paragraph({
    text: "",
    spacing: { after },
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
    rows: rows.map(
      (row) =>
        new TableRow({
          children: [
            createCell(row.label, { width: 34, bold: true }),
            createCell(row.value, { width: 66 }),
          ],
        }),
    ),
  });

const createSignatureParagraph = (label) =>
  new Paragraph({
    spacing: { before: 140, after: 90 },
    children: [
      new TextRun({ text: safeText(label), bold: true }),
      new TextRun({ text: " ___________________________" }),
    ],
  });

const buildBaseChildren = ({ banner, empresaNombre, title }) => [
  ...buildPacientePrintHeader({
    banner,
    clinicName: "",
    title: "",
  }),
  createCompanyTitle(empresaNombre),
  createTitle(title),
];

const downloadLegajoDocx = async ({ children, fileName }) => {
  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
  return fileName;
};

export const downloadCambioTurnoDocx = async ({
  data,
  banner = null,
  fileName,
} = {}) => {
  const rows = [
    { label: "Empleado", value: data?.empleado },
    { label: "DNI", value: data?.dni },
    { label: "Puesto", value: data?.puesto },
    { label: "Fecha inicio", value: data?.start_date },
    { label: "Fecha fin", value: data?.end_date },
    { label: "Tipo de duracion", value: data?.duration_type },
    { label: "Horario/turno anterior", value: data?.horario_anterior },
    { label: "Horario/turno nuevo", value: data?.horario_nuevo },
    { label: "Tareas anteriores", value: data?.tareas_anteriores },
    { label: "Tareas nuevas", value: data?.tareas_nuevas },
    { label: "Motivo", value: data?.motivo },
    { label: "Estado", value: data?.estado },
    { label: "Fecha de creacion", value: data?.created_at },
    { label: "Direccion", value: data?.sucursal_direccion },
  ];

  return downloadLegajoDocx({
    fileName,
    children: [
      ...buildBaseChildren({
        banner,
        empresaNombre: data?.empresa_nombre,
        title: "Acuerdo de cambio de horario y/o modificacion de tareas",
      }),
      createKeyValueTable(rows),
      createSpacer(180),
      createSignatureParagraph("Solicitante:"),
      createSignatureParagraph("Aprobador:"),
    ],
  });
};

export const downloadSancionDocx = async ({
  data,
  banner = null,
  fileName,
} = {}) => {
  const rows = [
    { label: "Empleado", value: data?.empleado },
    { label: "DNI", value: data?.dni },
    { label: "Puesto", value: data?.puesto },
    { label: "Fecha de creacion", value: data?.created_at },
    { label: "Creado por", value: data?.created_by },
    { label: "Motivo / tipo", value: data?.motivo },
    { label: "Periodo", value: data?.horario_anterior },
    { label: "Descripcion", value: data?.tareas_anteriores },
    { label: "Politica incumplida", value: data?.policy_reference },
    { label: "Direccion", value: data?.sucursal_direccion },
  ];

  return downloadLegajoDocx({
    fileName,
    children: [
      ...buildBaseChildren({
        banner,
        empresaNombre: data?.empresa_nombre,
        title: "Registro de sancion",
      }),
      createKeyValueTable(rows),
      createSpacer(180),
      createSignatureParagraph("Empleado:"),
      createSignatureParagraph("Responsable:"),
    ],
  });
};
