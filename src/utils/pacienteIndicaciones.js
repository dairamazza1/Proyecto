import { saveAs } from "file-saver";
import {
  resolvePerfilDisplayName,
  resolvePerfilRoleDisplay,
} from "./perfilDisplay";

const INDICACION_PAYLOAD_VERSION = 2;

export const INDICACION_SCHEDULE_OPTIONS = [
  { key: "08:00", label: "8 hs" },
  { key: "12:00", label: "12 hs" },
  { key: "16:00", label: "16 hs" },
  { key: "20:00", label: "20 hs" },
];

export const INDICACION_DOSE_OPTIONS = [
  "1/4",
  "1/2",
  "3/4",
  "1",
  "1 1/4",
  "1 1/2",
  "1 3/4",
  "2",
  "2 1/4",
  "2 1/2",
  "2 3/4",
  "3",
];

const SCHEDULE_LABEL_BY_KEY = new Map(
  INDICACION_SCHEDULE_OPTIONS.map((option) => [option.key, option.label]),
);

const SCHEDULE_ALIASES = new Map([
  ["8", "08:00"],
  ["08", "08:00"],
  ["8 hs", "08:00"],
  ["08 hs", "08:00"],
  ["8hs", "08:00"],
  ["08hs", "08:00"],
  ["08:00", "08:00"],
  ["12", "12:00"],
  ["12 hs", "12:00"],
  ["12hs", "12:00"],
  ["12:00", "12:00"],
  ["16", "16:00"],
  ["16 hs", "16:00"],
  ["16hs", "16:00"],
  ["16:00", "16:00"],
  ["20", "20:00"],
  ["20 hs", "20:00"],
  ["20hs", "20:00"],
  ["20:00", "20:00"],
]);

let indicacionRowSequence = 0;

const safeString = (value) =>
  value === null || value === undefined ? "" : String(value);

const normalizeText = (value) => safeString(value).trim();

const nextIndicacionRowId = () => {
  indicacionRowSequence += 1;
  return `indicacion-row-${indicacionRowSequence}`;
};

export const normalizePacienteIndicacionScheduleKey = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  return SCHEDULE_ALIASES.get(normalized) ?? "";
};

export const formatPacienteIndicacionScheduleLabel = (value) => {
  const key = normalizePacienteIndicacionScheduleKey(value);
  return SCHEDULE_LABEL_BY_KEY.get(key) ?? (normalizeText(value) || "-");
};

const normalizePacienteIndicacionSchedules = (value) => {
  if (!Array.isArray(value)) return [];

  const unique = new Set();
  value.forEach((item) => {
    const normalizedKey = normalizePacienteIndicacionScheduleKey(item);
    if (normalizedKey) unique.add(normalizedKey);
  });

  return INDICACION_SCHEDULE_OPTIONS
    .map((option) => option.key)
    .filter((key) => unique.has(key));
};

export const normalizePacienteIndicacionDoseValue = (value) => {
  const normalized = normalizeText(value);
  return INDICACION_DOSE_OPTIONS.includes(normalized) ? normalized : "";
};

export const normalizePacienteIndicacionScheduleDoses = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return INDICACION_SCHEDULE_OPTIONS.reduce((acc, option) => {
    const normalizedDose = normalizePacienteIndicacionDoseValue(value?.[option.key]);
    if (normalizedDose) {
      acc[option.key] = normalizedDose;
    }
    return acc;
  }, {});
};

export const hasPacienteIndicacionLegacySchedule = (row = {}, scheduleKey) =>
  normalizePacienteIndicacionSchedules(row?.schedules).includes(scheduleKey);

export const getPacienteIndicacionScheduleDisplay = (row = {}, scheduleKey) => {
  const normalizedKey = normalizePacienteIndicacionScheduleKey(scheduleKey);
  if (!normalizedKey) return "-";

  const normalizedDoses = normalizePacienteIndicacionScheduleDoses(
    row?.schedule_doses,
  );

  if (normalizedDoses[normalizedKey]) return normalizedDoses[normalizedKey];
  if (hasPacienteIndicacionLegacySchedule(row, normalizedKey)) return "X";
  return "-";
};

export const getPacienteIndicacionScheduleEntries = (row = {}) =>
  INDICACION_SCHEDULE_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    value: getPacienteIndicacionScheduleDisplay(row, option.key),
  })).filter((entry) => entry.value !== "-");

export const createPacienteIndicacionFormRow = (overrides = {}) => ({
  local_id: normalizeText(overrides?.local_id ?? overrides?.localId) || nextIndicacionRowId(),
  persisted_id:
    overrides?.persisted_id === null || overrides?.persisted_id === undefined
      ? null
      : overrides.persisted_id,
  description: normalizeText(overrides?.description),
  schedule_doses: normalizePacienteIndicacionScheduleDoses(
    overrides?.schedule_doses ?? overrides?.scheduleDoses,
  ),
  schedules: normalizePacienteIndicacionSchedules(
    overrides?.schedules ?? overrides?.times,
  ),
});

export const normalizePacienteIndicacionRows = (rows = []) =>
  (rows ?? []).map((row) => createPacienteIndicacionFormRow(row));

export const buildPacienteIndicacionDescription = (rows = []) => {
  const normalizedRows = normalizePacienteIndicacionRows(rows)
    .filter(
      (row) =>
        row.description ||
        Object.keys(row.schedule_doses ?? {}).length ||
        row.schedules.length,
    )
    .map((row) => ({
      description: row.description,
      schedule_doses: row.schedule_doses,
      schedules: row.schedules,
    }));

  return JSON.stringify({
    version: INDICACION_PAYLOAD_VERSION,
    kind: "horario_grid",
    rows: normalizedRows,
  });
};

const parseStructuredIndicacionRows = (description) => {
  const normalized = normalizeText(description);
  if (!normalized) return [];

  try {
    const parsed = JSON.parse(normalized);
    if (!Array.isArray(parsed?.rows)) return null;
    return parsed.rows.map((row) =>
      createPacienteIndicacionFormRow({
        description: row?.description,
        schedule_doses: row?.schedule_doses,
        schedules: row?.schedules,
      }),
    );
  } catch {
    return null;
  }
};

const isLikelyIndicacionDateValue = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) ||
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(normalized)
  );
};

const buildLegacyIndicacionRows = ({ description, indicationAt } = {}) => {
  const descriptionText = normalizeText(description);
  if (!descriptionText) return [];

  const scheduleKey = normalizePacienteIndicacionScheduleKey(indicationAt);
  return [
    createPacienteIndicacionFormRow({
      description: descriptionText,
      schedules: scheduleKey ? [scheduleKey] : [],
    }),
  ];
};

const escapeHtml = (value) =>
  safeString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatIndicacionPrintDateLabel = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return safeString(value) || "-";
  const pad = (input) => String(input).padStart(2, "0");
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

const getProfessionalLabel = (row) => {
  const displayName = resolvePerfilDisplayName(row?.creador, row?.created_by);
  const role = resolvePerfilRoleDisplay(row?.creador);

  if (displayName === "-" && role === "-") return "-";
  if (role === "-") return displayName;
  if (displayName === "-") return role;
  return `${displayName} - ${role}`;
};

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_MARGIN_X = 40;
const PDF_MARGIN_TOP = 42;
const PDF_MARGIN_BOTTOM = 40;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN_X * 2;
const PDF_ROW_GAP = 12;
const PDF_META_BOX_GAP = 12;
const PDF_META_BOX_PADDING_X = 10;
const PDF_META_BOX_PADDING_Y = 10;
const PDF_TABLE_HEADER_HEIGHT = 30;
const PDF_TABLE_CELL_PADDING_X = 10;
const PDF_TABLE_CELL_PADDING_Y = 8;
const PDF_TEXT_COLOR = "0.07 0.09 0.13";
const PDF_MUTED_COLOR = "0.42 0.45 0.5";
const PDF_BORDER_COLOR = "0.82 0.85 0.89";
const PDF_HEADER_FILL_COLOR = "0.95 0.96 0.98";
const PDF_FONT_REGULAR = "F1";
const PDF_FONT_BOLD = "F2";
const PDF_DATE_FALLBACK_SEGMENT = "fecha";

const PDF_CP1252_MAP = new Map([
  ["\u20ac", 0x80],
  ["\u201a", 0x82],
  ["\u0192", 0x83],
  ["\u201e", 0x84],
  ["\u2026", 0x85],
  ["\u2020", 0x86],
  ["\u2021", 0x87],
  ["\u02c6", 0x88],
  ["\u2030", 0x89],
  ["\u0160", 0x8a],
  ["\u2039", 0x8b],
  ["\u0152", 0x8c],
  ["\u017d", 0x8e],
  ["\u2018", 0x91],
  ["\u2019", 0x92],
  ["\u201c", 0x93],
  ["\u201d", 0x94],
  ["\u2022", 0x95],
  ["\u2013", 0x96],
  ["\u2014", 0x97],
  ["\u02dc", 0x98],
  ["\u2122", 0x99],
  ["\u0161", 0x9a],
  ["\u203a", 0x9b],
  ["\u0153", 0x9c],
  ["\u017e", 0x9e],
  ["\u0178", 0x9f],
]);

const pdfNumber = (value) => {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) return "0";
  return normalized.toFixed(2).replace(/\.?0+$/, "");
};

const normalizeFileSegment = (value) => {
  const normalized = safeString(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "paciente";
};

const getIndicacionDateSegment = (value) => {
  const normalized = safeString(value).trim();
  const dateMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return PDF_DATE_FALLBACK_SEGMENT;

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("");
};

const buildPacienteIndicacionPdfFileName = ({
  paciente,
  indicacion,
} = {}) => {
  const apellido = normalizeFileSegment(paciente?.last_name);
  const dateSegment = getIndicacionDateSegment(
    indicacion?.indication_date ?? indicacion?.indication_at ?? indicacion?.created_at
  );

  return `indicaciones_${apellido}_${dateSegment}.pdf`;
};

const toPdfHexString = (value) =>
  Array.from(safeString(value)).map((character) => {
    const code = character.charCodeAt(0);
    let byte = 0x3f;

    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) {
      byte = code;
    } else if (PDF_CP1252_MAP.has(character)) {
      byte = PDF_CP1252_MAP.get(character);
    }

    return byte.toString(16).padStart(2, "0").toUpperCase();
  }).join("");

const getPdfCharFactor = (character) => {
  if ("ilI1|.,:;![]()'` ".includes(character)) return 0.26;
  if ("frtJ".includes(character)) return 0.34;
  if ("mwMW@#%&QGO".includes(character)) return 0.82;
  if ("ABCDEFGHKNOPRSTUVXYZ".includes(character)) return 0.62;
  if ("abcdefghknopqrsuvxyz".includes(character)) return 0.54;
  if ("0123456789".includes(character)) return 0.56;
  return 0.5;
};

const measurePdfTextWidth = (value, fontSize) =>
  Array.from(safeString(value)).reduce(
    (sum, character) => sum + getPdfCharFactor(character) * fontSize,
    0
  );

const splitPdfWordByWidth = (word, maxWidth, fontSize) => {
  const chunks = [];
  let current = "";

  Array.from(word).forEach((character) => {
    const next = `${current}${character}`;
    if (current && measurePdfTextWidth(next, fontSize) > maxWidth) {
      chunks.push(current);
      current = character;
      return;
    }
    current = next;
  });

  if (current) chunks.push(current);
  return chunks.length ? chunks : [word];
};

const wrapPdfText = (value, maxWidth, fontSize) => {
  const normalized = safeString(value).replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      lines.push("");
      return;
    }

    const words = trimmedParagraph.split(/\s+/);
    let currentLine = "";

    words.forEach((word) => {
      const chunks =
        measurePdfTextWidth(word, fontSize) > maxWidth
          ? splitPdfWordByWidth(word, maxWidth, fontSize)
          : [word];

      chunks.forEach((chunk) => {
        const candidate = currentLine ? `${currentLine} ${chunk}` : chunk;
        if (
          currentLine &&
          measurePdfTextWidth(candidate, fontSize) > maxWidth
        ) {
          lines.push(currentLine);
          currentLine = chunk;
          return;
        }

        currentLine = candidate;
      });
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    if (paragraphIndex < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return lines.length ? lines : [""];
};

const createPdfRectCommand = ({
  x,
  y,
  width,
  height,
  strokeColor = PDF_BORDER_COLOR,
  fillColor = null,
  lineWidth = 1,
}) => {
  const commands = ["q"];
  commands.push(`${strokeColor} RG`);
  commands.push(`${pdfNumber(lineWidth)} w`);
  if (fillColor) {
    commands.push(`${fillColor} rg`);
    commands.push(
      `${pdfNumber(x)} ${pdfNumber(
        PDF_PAGE_HEIGHT - y - height
      )} ${pdfNumber(width)} ${pdfNumber(height)} re B`
    );
  } else {
    commands.push(
      `${pdfNumber(x)} ${pdfNumber(
        PDF_PAGE_HEIGHT - y - height
      )} ${pdfNumber(width)} ${pdfNumber(height)} re S`
    );
  }
  commands.push("Q");
  return commands.join("\n");
};

const createPdfLineCommand = ({
  x1,
  y1,
  x2,
  y2,
  strokeColor = PDF_BORDER_COLOR,
  lineWidth = 1,
}) =>
  [
    "q",
    `${strokeColor} RG`,
    `${pdfNumber(lineWidth)} w`,
    `${pdfNumber(x1)} ${pdfNumber(PDF_PAGE_HEIGHT - y1)} m`,
    `${pdfNumber(x2)} ${pdfNumber(PDF_PAGE_HEIGHT - y2)} l`,
    "S",
    "Q",
  ].join("\n");

const createPdfTextCommand = ({
  x,
  y,
  text,
  font = PDF_FONT_REGULAR,
  fontSize = 11,
  color = PDF_TEXT_COLOR,
}) =>
  [
    "BT",
    `/${font} ${pdfNumber(fontSize)} Tf`,
    `${color} rg`,
    `${pdfNumber(x)} ${pdfNumber(PDF_PAGE_HEIGHT - y - fontSize)} Td`,
    `<${toPdfHexString(text)}> Tj`,
    "ET",
  ].join("\n");

const buildPacienteIndicacionPdfBytes = ({
  paciente,
  ingreso,
  indicacion,
} = {}) => {
  const hydrated =
    indicacion?.indication_rows ? indicacion : hydratePacienteIndicacionRecord(indicacion);
  const rows = hydrated?.indication_rows ?? [];
  const patientName =
    [paciente?.last_name, paciente?.first_name].filter(Boolean).join(", ") || "-";
  const patientDocument =
    [paciente?.document_type, paciente?.document_number].filter(Boolean).join(" ") || "-";
  const ingresoDate = formatIndicacionPrintDateLabel(ingreso?.admission_at);
  const indicationDate = formatIndicacionPrintDateLabel(hydrated?.indication_date);
  const professional = getProfessionalLabel(hydrated);
  const metaBoxWidth = (PDF_CONTENT_WIDTH - PDF_META_BOX_GAP) / 2;
  const scheduleColumnWidth = 52;
  const descriptionColumnWidth =
    PDF_CONTENT_WIDTH - scheduleColumnWidth * INDICACION_SCHEDULE_OPTIONS.length;
  const pageContentLimit = PDF_PAGE_HEIGHT - PDF_MARGIN_BOTTOM;
  const pages = [[]];
  let pageIndex = 0;
  let cursorY = PDF_MARGIN_TOP;

  const getPage = () => pages[pageIndex];
  const pushCommand = (command) => {
    if (command) getPage().push(command);
  };
  const newPage = () => {
    pages.push([]);
    pageIndex += 1;
    cursorY = PDF_MARGIN_TOP;
  };
  const ensureSpace = (height) => {
    if (cursorY + height <= pageContentLimit) return;
    newPage();
  };
  const drawWrappedText = ({
    x,
    y,
    text,
    maxWidth,
    font,
    fontSize,
    lineHeight,
    color = PDF_TEXT_COLOR,
  }) => {
    const lines = wrapPdfText(text, maxWidth, fontSize);
    lines.forEach((line, index) => {
      pushCommand(
        createPdfTextCommand({
          x,
          y: y + lineHeight * index,
          text: line,
          font,
          fontSize,
          color,
        })
      );
    });
    return lines.length;
  };

  pushCommand(
    createPdfTextCommand({
      x: PDF_MARGIN_X,
      y: cursorY,
      text: "Hoja de indicaciones",
      font: PDF_FONT_BOLD,
      fontSize: 22,
    })
  );
  cursorY += 34;

  const metaItems = [
    { label: "PACIENTE", value: `${patientName}\n${patientDocument}` },
    { label: "INTERNACION", value: ingresoDate },
    { label: "INDICA DR/A", value: professional },
    { label: "FECHA", value: indicationDate },
  ];

  for (let index = 0; index < metaItems.length; index += 2) {
    const pair = metaItems.slice(index, index + 2);
    const configs = pair.map((item) => {
      const valueLines = wrapPdfText(
        item.value,
        metaBoxWidth - PDF_META_BOX_PADDING_X * 2,
        10
      );
      const valueLineHeight = 13;
      const height = Math.max(
        54,
        PDF_META_BOX_PADDING_Y * 2 + 11 + 6 + valueLines.length * valueLineHeight
      );
      return { ...item, valueLines, valueLineHeight, height };
    });
    const rowHeight = Math.max(...configs.map((item) => item.height));

    ensureSpace(rowHeight);

    configs.forEach((item, pairIndex) => {
      const x = PDF_MARGIN_X + pairIndex * (metaBoxWidth + PDF_META_BOX_GAP);
      pushCommand(
        createPdfRectCommand({
          x,
          y: cursorY,
          width: metaBoxWidth,
          height: rowHeight,
        })
      );
      pushCommand(
        createPdfTextCommand({
          x: x + PDF_META_BOX_PADDING_X,
          y: cursorY + PDF_META_BOX_PADDING_Y,
          text: item.label,
          font: PDF_FONT_REGULAR,
          fontSize: 9,
          color: PDF_MUTED_COLOR,
        })
      );
      item.valueLines.forEach((line, lineIndex) => {
        pushCommand(
          createPdfTextCommand({
            x: x + PDF_META_BOX_PADDING_X,
            y:
              cursorY +
              PDF_META_BOX_PADDING_Y +
              16 +
              lineIndex * item.valueLineHeight,
            text: line,
            font: PDF_FONT_BOLD,
            fontSize: 10,
          })
        );
      });
    });

    cursorY += rowHeight + PDF_META_BOX_GAP;
  }

  const drawTableHeader = () => {
    pushCommand(
      createPdfRectCommand({
        x: PDF_MARGIN_X,
        y: cursorY,
        width: PDF_CONTENT_WIDTH,
        height: PDF_TABLE_HEADER_HEIGHT,
        fillColor: PDF_HEADER_FILL_COLOR,
      })
    );

    let columnX = PDF_MARGIN_X + descriptionColumnWidth;
    INDICACION_SCHEDULE_OPTIONS.forEach(() => {
      pushCommand(
        createPdfLineCommand({
          x1: columnX,
          y1: cursorY,
          x2: columnX,
          y2: cursorY + PDF_TABLE_HEADER_HEIGHT,
        })
      );
      columnX += scheduleColumnWidth;
    });

    pushCommand(
      createPdfTextCommand({
        x: PDF_MARGIN_X + PDF_TABLE_CELL_PADDING_X,
        y: cursorY + 8,
        text: "INDICACIONES",
        font: PDF_FONT_BOLD,
        fontSize: 10,
      })
    );

    INDICACION_SCHEDULE_OPTIONS.forEach((option, optionIndex) => {
      const cellX =
        PDF_MARGIN_X +
        descriptionColumnWidth +
        optionIndex * scheduleColumnWidth;
      const textWidth = measurePdfTextWidth(option.label.toUpperCase(), 9);
      pushCommand(
        createPdfTextCommand({
          x: cellX + (scheduleColumnWidth - textWidth) / 2,
          y: cursorY + 9,
          text: option.label.toUpperCase(),
          font: PDF_FONT_BOLD,
          fontSize: 9,
        })
      );
    });

    cursorY += PDF_TABLE_HEADER_HEIGHT;
  };

  ensureSpace(PDF_TABLE_HEADER_HEIGHT + 36);
  drawTableHeader();

  if (!rows.length) {
    const emptyHeight = 34;
    pushCommand(
      createPdfRectCommand({
        x: PDF_MARGIN_X,
        y: cursorY,
        width: PDF_CONTENT_WIDTH,
        height: emptyHeight,
      })
    );
    pushCommand(
      createPdfTextCommand({
        x: PDF_MARGIN_X + PDF_TABLE_CELL_PADDING_X,
        y: cursorY + 10,
        text: "Sin indicaciones cargadas en la grilla.",
        font: PDF_FONT_REGULAR,
        fontSize: 10,
      })
    );
    cursorY += emptyHeight + PDF_ROW_GAP;
  } else {
    rows.forEach((row) => {
      const descriptionLines = wrapPdfText(
        row.description || "-",
        descriptionColumnWidth - PDF_TABLE_CELL_PADDING_X * 2,
        10
      );
      const descriptionLineHeight = 13;
      const rowHeight = Math.max(
        30,
        PDF_TABLE_CELL_PADDING_Y * 2 +
          descriptionLines.length * descriptionLineHeight
      );

      if (cursorY + rowHeight > pageContentLimit) {
        newPage();
        drawTableHeader();
      }

      pushCommand(
        createPdfRectCommand({
          x: PDF_MARGIN_X,
          y: cursorY,
          width: PDF_CONTENT_WIDTH,
          height: rowHeight,
        })
      );

      let columnX = PDF_MARGIN_X + descriptionColumnWidth;
      INDICACION_SCHEDULE_OPTIONS.forEach(() => {
        pushCommand(
          createPdfLineCommand({
            x1: columnX,
            y1: cursorY,
            x2: columnX,
            y2: cursorY + rowHeight,
          })
        );
        columnX += scheduleColumnWidth;
      });

      descriptionLines.forEach((line, lineIndex) => {
        pushCommand(
          createPdfTextCommand({
            x: PDF_MARGIN_X + PDF_TABLE_CELL_PADDING_X,
            y:
              cursorY +
              PDF_TABLE_CELL_PADDING_Y +
              lineIndex * descriptionLineHeight,
            text: line,
            font: PDF_FONT_REGULAR,
            fontSize: 10,
          })
        );
      });

      INDICACION_SCHEDULE_OPTIONS.forEach((option, optionIndex) => {
        const displayValue = getPacienteIndicacionScheduleDisplay(row, option.key);
        if (displayValue === "-") return;

        const fontSize = displayValue === "X" ? 11 : 9;
        const textWidth = measurePdfTextWidth(displayValue, fontSize);
        const cellX =
          PDF_MARGIN_X +
          descriptionColumnWidth +
          optionIndex * scheduleColumnWidth;

        pushCommand(
          createPdfTextCommand({
            x: cellX + (scheduleColumnWidth - textWidth) / 2,
            y: cursorY + Math.max(8, (rowHeight - fontSize) / 2),
            text: displayValue,
            font:
              displayValue === "X" ? PDF_FONT_BOLD : PDF_FONT_REGULAR,
            fontSize,
          })
        );
      });

      cursorY += rowHeight;
    });

    cursorY += PDF_ROW_GAP;
  }

  const drawTextSection = (title, text) => {
    const bodyLines = wrapPdfText(
      text || "-",
      PDF_CONTENT_WIDTH - PDF_TABLE_CELL_PADDING_X * 2,
      10
    );
    const bodyHeight = Math.max(
      72,
      PDF_TABLE_CELL_PADDING_Y * 2 + bodyLines.length * 13
    );
    const sectionHeight = 18 + 8 + bodyHeight;

    ensureSpace(sectionHeight);

    pushCommand(
      createPdfTextCommand({
        x: PDF_MARGIN_X,
        y: cursorY,
        text: title,
        font: PDF_FONT_BOLD,
        fontSize: 12,
      })
    );
    cursorY += 18;

    pushCommand(
      createPdfRectCommand({
        x: PDF_MARGIN_X,
        y: cursorY,
        width: PDF_CONTENT_WIDTH,
        height: bodyHeight,
      })
    );

    bodyLines.forEach((line, index) => {
      pushCommand(
        createPdfTextCommand({
          x: PDF_MARGIN_X + PDF_TABLE_CELL_PADDING_X,
          y: cursorY + PDF_TABLE_CELL_PADDING_Y + index * 13,
          text: line,
          font: PDF_FONT_REGULAR,
          fontSize: 10,
        })
      );
    });

    cursorY += bodyHeight + PDF_ROW_GAP;
  };

  drawTextSection("OTRAS INDICACIONES", hydrated?.indication_obs || "-");
  drawTextSection("REFUERZOS", hydrated?.indication_ref || "-");

  const objects = [];
  const addObject = (value) => {
    objects.push(value);
    return objects.length;
  };

  const regularFontId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );
  const boldFontId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
  );
  const pagesId = addObject("");
  const pageIds = [];

  pages.forEach((pageCommands) => {
    const content = pageCommands.join("\n");
    const contentId = addObject(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
    );
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pdfNumber(
        PDF_PAGE_WIDTH
      )} ${pdfNumber(
        PDF_PAGE_HEIGHT
      )}] /Resources << /Font << /${PDF_FONT_REGULAR} ${regularFontId} 0 R /${PDF_FONT_BOLD} ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Count ${
    pageIds.length
  } /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`;
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf);
};

export const hydratePacienteIndicacionRecord = (row = {}) => {
  const structuredRows = parseStructuredIndicacionRows(row?.description);
  const indicationRows =
    structuredRows ?? buildLegacyIndicacionRows(row);

  return {
    ...row,
    indication_rows: indicationRows,
    indication_date: isLikelyIndicacionDateValue(row?.indication_at)
      ? row.indication_at
      : row?.created_at ?? null,
    indication_obs: normalizeText(row?.indication_obs),
    indication_ref: normalizeText(row?.indication_ref),
    is_structured_payload: structuredRows !== null,
  };
};

export const buildPacienteIndicacionPrintHtml = ({
  paciente,
  ingreso,
  indicacion,
} = {}) => {
  const hydrated =
    indicacion?.indication_rows ? indicacion : hydratePacienteIndicacionRecord(indicacion);
  const rows = hydrated?.indication_rows ?? [];
  const patientName =
    [paciente?.last_name, paciente?.first_name].filter(Boolean).join(", ") || "-";
  const patientDocument =
    [paciente?.document_type, paciente?.document_number].filter(Boolean).join(" ") || "-";
  const ingresoDate = formatIndicacionPrintDateLabel(ingreso?.admission_at);
  const indicationDate = formatIndicacionPrintDateLabel(hydrated?.indication_date);
  const professional = getProfessionalLabel(hydrated);

  const gridRowsHtml = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.description)}</td>
              ${INDICACION_SCHEDULE_OPTIONS.map(
                (option) => {
                  const displayValue = getPacienteIndicacionScheduleDisplay(
                    row,
                    option.key,
                  );
                  return `<td>${escapeHtml(
                    displayValue === "-" ? "" : displayValue,
                  )}</td>`;
                },
              ).join("")}
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td colspan="${INDICACION_SCHEDULE_OPTIONS.length + 1}">
          Sin indicaciones cargadas en la grilla.
        </td>
      </tr>
    `;

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Indicaciones</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 24px;
          color: #111827;
        }
        .sheet {
          display: grid;
          gap: 18px;
        }
        .header {
          display: grid;
          gap: 12px;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .metaItem {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px 12px;
        }
        .metaLabel {
          display: block;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 10px 12px;
          text-align: center;
          vertical-align: middle;
        }
        th:first-child,
        td:first-child {
          text-align: left;
        }
        th {
          background: #f3f4f6;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .section {
          display: grid;
          gap: 8px;
        }
        .sectionTitle {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .sectionBody {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 12px;
          min-height: 72px;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <section class="header">
          <div class="title">Indicaciones</div>
          <div class="meta">
            <div class="metaItem">
              <span class="metaLabel">Paciente</span>
              <strong>${escapeHtml(patientName)}</strong><br />
              <span>${escapeHtml(patientDocument)}</span>
            </div>
            <div class="metaItem">
              <span class="metaLabel">Internacion</span>
              <strong>${escapeHtml(ingresoDate)}</strong>
            </div>
            <div class="metaItem">
              <span class="metaLabel">Indica Dr/a</span>
              <strong>${escapeHtml(professional)}</strong>
            </div>
            <div class="metaItem">
              <span class="metaLabel">Fecha</span>
              <strong>${escapeHtml(indicationDate)}</strong>
            </div>
          </div>
        </section>

        <section>
          <table>
            <thead>
              <tr>
                <th>Indicaciones</th>
                ${INDICACION_SCHEDULE_OPTIONS.map(
                  (option) => `<th>${escapeHtml(option.label)}</th>`,
                ).join("")}
              </tr>
            </thead>
            <tbody>${gridRowsHtml}</tbody>
          </table>
        </section>

        <section class="section">
          <div class="sectionTitle">Otras indicaciones</div>
          <div class="sectionBody">${escapeHtml(hydrated?.indication_obs || "-")}</div>
        </section>

        <section class="section">
          <div class="sectionTitle">Refuerzos</div>
          <div class="sectionBody">${escapeHtml(hydrated?.indication_ref || "-")}</div>
        </section>
      </main>
    </body>
  </html>`;
};

export const downloadPacienteIndicacionPdf = (params = {}) => {
  const bytes = buildPacienteIndicacionPdfBytes(params);
  const hydratedIndicacion =
    params?.indicacion?.indication_rows
      ? params.indicacion
      : hydratePacienteIndicacionRecord(params?.indicacion);
  const fileName = buildPacienteIndicacionPdfFileName({
    paciente: params?.paciente,
    indicacion: hydratedIndicacion,
  });
  const blob = new Blob([bytes], { type: "application/pdf" });

  saveAs(blob, fileName);
  return fileName;
};

export const printPacienteIndicacionRecord = (params = {}) =>
  downloadPacienteIndicacionPdf(params);

export const hasPacienteIndicacionMeaningfulContent = ({
  rows = [],
  indicationObs = "",
  indicationRef = "",
} = {}) => {
  const normalizedRows = normalizePacienteIndicacionRows(rows).filter(
    (row) =>
      row.description ||
      Object.keys(row.schedule_doses ?? {}).length ||
      row.schedules.length,
  );

  return Boolean(
    normalizedRows.length ||
      normalizeText(indicationObs) ||
      normalizeText(indicationRef),
  );
};
