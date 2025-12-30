const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDateToUTC(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map((val) => parseInt(val, 10));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function calcDaysTakenInclusive(startDate, endDate) {
  const start = parseDateToUTC(startDate);
  const end = parseDateToUTC(endDate);
  if (!start || !end) return 0;
  const diff = Math.floor((end - start) / MS_PER_DAY);
  return diff >= 0 ? diff + 1 : 0;
}

export function getTodayArgentina() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function calcAnnualVacationDays(hireDate, refDate) {
  if (!hireDate || !refDate) return 0;
  const hire = parseDateToUTC(hireDate);
  const ref = parseDateToUTC(refDate);
  if (!hire || !ref) return 0;

  const daysWorked = Math.max(0, Math.floor((ref - hire) / MS_PER_DAY));
  if (daysWorked < 180) {
    return Math.max(0, Math.floor(daysWorked / 20));
  }

  let years = ref.getUTCFullYear() - hire.getUTCFullYear();
  const hasNotHadAnniversary =
    ref.getUTCMonth() < hire.getUTCMonth() ||
    (ref.getUTCMonth() === hire.getUTCMonth() && ref.getUTCDate() < hire.getUTCDate());
  if (hasNotHadAnniversary) {
    years -= 1;
  }

  if (years <= 5) return 14;
  if (years <= 10) return 21;
  if (years <= 20) return 28;
  return 35;
}

export function calcVacationSummary(empleado, vacaciones) {
  const refDate = empleado?.is_active
    ? getTodayArgentina()
    : empleado?.termination_date || getTodayArgentina();

  const annualDays = calcAnnualVacationDays(empleado?.hire_date, refDate);

  const lastVacationYear = (vacaciones ?? [])
    .map((item) => item?.start_date)
    .filter(Boolean)
    .map((date) => parseInt(date.slice(0, 4), 10))
    .sort((a, b) => b - a)[0];

  const currentYear = parseInt(refDate.slice(0, 4), 10);
  const periodYear = lastVacationYear || currentYear;

  const vacationsInPeriod = (vacaciones ?? []).filter((item) =>
    item?.start_date?.startsWith(String(periodYear))
  );

  const taken = vacationsInPeriod.reduce((acc, item) => {
    const status = String(item?.status ?? "pending").toLowerCase();
    if (status === "approved") {
      return acc + (item?.days_taken || 0);
    }
    return acc;
  }, 0);

  const pending = vacationsInPeriod.reduce((acc, item) => {
    const status = String(item?.status ?? "pending").toLowerCase();
    if (status === "pending") {
      return acc + (item?.days_taken || 0);
    }
    return acc;
  }, 0);

  return {
    annualDays,
    taken,
    pending,
    periodYear,
    refDate,
  };
}
