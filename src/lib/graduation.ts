export const GRAD_MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sept" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
] as const;

export const GRAD_YEAR_MIN = 1990;
export const GRAD_YEAR_MAX = 2027;

export const GRAD_YEARS = Array.from(
  { length: GRAD_YEAR_MAX - GRAD_YEAR_MIN + 1 },
  (_, index) => String(GRAD_YEAR_MIN + index),
);

const MONTH_VALUES = new Set(GRAD_MONTHS.map((month) => month.value));

export type Graduation = {
  month: string;
  year: string;
};

export function parseGraduation(
  raw: string | null | undefined,
): Graduation {
  const value = (raw || "").trim();
  const iso = value.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const year = iso[1];
    const month = iso[2].padStart(2, "0");
    if (isGradYear(year) && MONTH_VALUES.has(month)) {
      return { month, year };
    }
  }
  const yearOnly = value.match(/^(\d{4})$/);
  if (yearOnly && isGradYear(yearOnly[1])) {
    return { month: "", year: yearOnly[1] };
  }
  return { month: "", year: "" };
}

export function formatGraduation(month: string, year: string) {
  const nextYear = year.trim();
  const nextMonth = month.trim().padStart(month.trim() ? 2 : 0, "0");
  if (nextYear && nextMonth && MONTH_VALUES.has(nextMonth) && isGradYear(nextYear)) {
    return `${nextYear}-${nextMonth}`;
  }
  if (nextYear && isGradYear(nextYear)) return nextYear;
  return null;
}

/** Store month+year in the existing `profiles.year` text column as YYYY-MM. */
export function persistGraduation(raw: string | null | undefined) {
  const parsed = parseGraduation(raw);
  return formatGraduation(parsed.month, parsed.year);
}

/** True after the selected graduation month has ended. Year-only dates use June. */
export function hasGraduated(
  raw: string | null | undefined,
  now = new Date(),
) {
  const parsed = parseGraduation(raw);
  if (!parsed.year) return false;
  const monthNumber = parsed.month ? Number(parsed.month) : 6;
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  return (
    nowYear > Number(parsed.year) ||
    (nowYear === Number(parsed.year) && nowMonth > monthNumber)
  );
}

function isGradYear(value: string) {
  const year = Number(value);
  return year >= GRAD_YEAR_MIN && year <= GRAD_YEAR_MAX;
}

export function graduationYearLabel(raw: string | null | undefined) {
  const parsed = parseGraduation(raw);
  if (parsed.year) return parsed.year.slice(-2);
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length >= 2 ? digits.slice(-2) : null;
}
