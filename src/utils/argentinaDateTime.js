const ARGENTINA_UTC_OFFSET_HOURS = 3;

const pad = (value) => String(value).padStart(2, "0");

const parseDateInput = (value) => {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const [, year, month, day] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
};

const parseDateTimeInput = (value) => {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) return null;

  const [, year, month, day, hours, minutes] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hours: Number(hours),
    minutes: Number(minutes),
  };
};

const getArgentinaShiftedNow = () =>
  new Date(Date.now() - ARGENTINA_UTC_OFFSET_HOURS * 60 * 60 * 1000);

export const getArgentinaTodayDateInput = () => {
  const shifted = getArgentinaShiftedNow();
  return `${shifted.getUTCFullYear()}-${pad(
    shifted.getUTCMonth() + 1,
  )}-${pad(shifted.getUTCDate())}`;
};

export const getArgentinaCurrentTimeInput = () => {
  const shifted = getArgentinaShiftedNow();
  return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
};

export const getArgentinaCurrentDateTimeInput = () =>
  `${getArgentinaTodayDateInput()}T${getArgentinaCurrentTimeInput()}`;

export const getArgentinaDateInputFromValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateOnlyMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})$/);
    if (dateOnlyMatch?.[1]) return dateOnlyMatch[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";

  const shifted = new Date(
    parsed.getTime() - ARGENTINA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  return `${shifted.getUTCFullYear()}-${pad(
    shifted.getUTCMonth() + 1,
  )}-${pad(shifted.getUTCDate())}`;
};

export const isoToArgentinaDateTimeInput = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "";

  const shifted = new Date(
    parsed.getTime() - ARGENTINA_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );

  return `${shifted.getUTCFullYear()}-${pad(
    shifted.getUTCMonth() + 1,
  )}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(
    shifted.getUTCMinutes(),
  )}`;
};

export const getArgentinaDateTimeInputForDate = (dateInput) => {
  const parsedDate = parseDateInput(dateInput);
  if (!parsedDate) return getArgentinaCurrentDateTimeInput();
  return `${dateInput}T${getArgentinaCurrentTimeInput()}`;
};

export const shiftArgentinaDateInputByDays = (dateInput, days) => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) return dateInput;

  const baseDate = new Date(
    Date.UTC(parsed.year, parsed.month - 1, parsed.day),
  );
  baseDate.setUTCDate(baseDate.getUTCDate() + Number(days ?? 0));

  return `${baseDate.getUTCFullYear()}-${pad(
    baseDate.getUTCMonth() + 1,
  )}-${pad(baseDate.getUTCDate())}`;
};

export const getArgentinaDayUtcRange = (dateInput) => {
  const parsed = parseDateInput(dateInput);
  if (!parsed) {
    return { from: null, to: null };
  }

  const from = new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      ARGENTINA_UTC_OFFSET_HOURS,
      0,
      0,
      0,
    ),
  );
  const to = new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day + 1,
      ARGENTINA_UTC_OFFSET_HOURS,
      0,
      0,
      0,
    ),
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const getArgentinaDateRangeUtcBounds = (fromDateInput, toDateInput) => {
  const fromParsed = parseDateInput(fromDateInput);
  const toParsed = parseDateInput(toDateInput);

  if (!fromParsed || !toParsed) {
    return { from: null, to: null };
  }

  const from = new Date(
    Date.UTC(
      fromParsed.year,
      fromParsed.month - 1,
      fromParsed.day,
      ARGENTINA_UTC_OFFSET_HOURS,
      0,
      0,
      0,
    ),
  );
  const to = new Date(
    Date.UTC(
      toParsed.year,
      toParsed.month - 1,
      toParsed.day + 1,
      ARGENTINA_UTC_OFFSET_HOURS,
      0,
      0,
      0,
    ),
  );

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
};

export const getIngresoArgentinaDateBounds = (ingreso) => {
  const fromDate = getArgentinaDateInputFromValue(ingreso?.admission_at);
  const toDate = getArgentinaDateInputFromValue(
    ingreso?.discharge_at ?? getArgentinaTodayDateInput(),
  );

  return {
    fromDate: fromDate || null,
    toDate: toDate || null,
  };
};

export const clampDateRangeToIngreso = ({
  fromDate,
  toDate,
  ingreso,
} = {}) => {
  const bounds = getIngresoArgentinaDateBounds(ingreso);
  const nextFromDate =
    fromDate && bounds.fromDate && fromDate < bounds.fromDate
      ? bounds.fromDate
      : fromDate;
  const nextToDate =
    toDate && bounds.toDate && toDate > bounds.toDate
      ? bounds.toDate
      : toDate;

  return {
    fromDate: nextFromDate ?? null,
    toDate: nextToDate ?? null,
    bounds,
    wasClamped:
      nextFromDate !== (fromDate ?? null) || nextToDate !== (toDate ?? null),
  };
};

export const argentinaDateTimeInputToIso = (value) => {
  const parsed = parseDateTimeInput(value);
  if (!parsed) return null;

  const utcDate = new Date(
    Date.UTC(
      parsed.year,
      parsed.month - 1,
      parsed.day,
      parsed.hours + ARGENTINA_UTC_OFFSET_HOURS,
      parsed.minutes,
      0,
      0,
    ),
  );

  return utcDate.toISOString();
};
