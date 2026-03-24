import { saveAs } from "file-saver";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import {
  getArgentinaDateInputFromValue,
  getArgentinaTodayDateInput,
  isoToArgentinaDateTimeInput,
} from "./argentinaDateTime";
import { resolvePerfilDisplayName } from "./perfilDisplay";

const TEMPLATE_URL = "/templates/evoluciones_template.docx";

let templatePromise = null;

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

  return age >= 0 ? `${age} anos` : "-";
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

export const loadEvolucionesTemplate = async () => {
  if (!templatePromise) {
    templatePromise = fetch(TEMPLATE_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar la plantilla Word.");
      }
      return response.arrayBuffer();
    });
  }

  return templatePromise;
};

export const buildPacienteEvolucionesTemplateData = ({
  empresa,
  paciente,
  ingreso,
  evoluciones = [],
  fromDate,
  toDate,
} = {}) => ({
  empresa_nombre: safeText(empresa?.name ?? empresa?.nombre ?? "Empresa"),
  paciente_nombre: buildPacienteNombre(paciente),
  paciente_documento: formatDocument(
    paciente?.document_type,
    paciente?.document_number,
  ),
  paciente_fecha_nacimiento: formatArgentinaDateLabel(paciente?.birthday),
  paciente_edad: computeAge(paciente?.birthday),
  internacion_sucursal: safeText(ingreso?.sucursal?.name),
  internacion_fecha_ingreso: formatArgentinaDateLabel(ingreso?.admission_at),
  internacion_fecha_egreso: ingreso?.discharge_at
    ? formatArgentinaDateLabel(ingreso?.discharge_at)
    : "-",
  internacion_motivo: safeText(ingreso?.admission_reason),
  internacion_diagnostico: safeText(ingreso?.admission_diagnosis),
  periodo_desde: formatDateInputLabel(fromDate),
  periodo_hasta: formatDateInputLabel(toDate),
  evoluciones: (evoluciones ?? []).map((evolucion) => ({
    fecha_hora: formatArgentinaDateTimeLabel(evolucion?.evolution_at),
    profesional: buildProfesionalLabel(evolucion),
    detalle: safeText(evolucion?.notes),
  })),
});

export const exportPacienteEvolucionesDocx = async ({
  empresa,
  paciente,
  ingreso,
  evoluciones = [],
  fromDate,
  toDate,
} = {}) => {
  if (!evoluciones?.length) {
    throw new Error("No hay evoluciones para el periodo seleccionado.");
  }

  const template = await loadEvolucionesTemplate();
  const zip = new PizZip(template);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render(
    buildPacienteEvolucionesTemplateData({
      empresa,
      paciente,
      ingreso,
      evoluciones,
      fromDate,
      toDate,
    }),
  );

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const fileName = buildFileName({ paciente, fromDate, toDate });
  saveAs(blob, fileName);
  return fileName;
};
