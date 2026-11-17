import type { Currency, OperationType } from "./seller-types";

const LOCALE = "es-AR";

export function formatPrice(
  price: string | number,
  currency: Currency,
  operation?: OperationType
): string {
  const value = Number(price);
  const amount = new Intl.NumberFormat(LOCALE, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
  return `${currency} ${amount}${operation === "Alquiler" ? "/mes" : ""}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(
    value
  );
}

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const visitDayFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** "Viernes 20 de noviembre" */
export function formatVisitDay(iso: string): string {
  const text = visitDayFormat.format(new Date(iso)).replace(",", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "09:29 hs" */
export function formatVisitTime(iso: string): string {
  return `${timeFormat.format(new Date(iso))} hs`;
}

export function formatDate(iso: string): string {
  return longDateFormat.format(new Date(iso)).replace(/\./g, "");
}

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

/** "hace 10 min", "ayer", "hace 3 días"; pasada una semana, la fecha. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 45) return "hace un momento";
  if (abs < 3600)
    return relativeFormat.format(Math.round(seconds / 60), "minute");
  if (abs < 86400)
    return relativeFormat.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) {
    return relativeFormat.format(Math.round(seconds / 86400), "day");
  }
  return formatDate(iso);
}

const monthFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "short",
  timeZone: "UTC",
});
const monthLongFormat = new Intl.DateTimeFormat(LOCALE, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function monthDate(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** "2026-08" -> "ago" */
export function formatMonthShort(key: string): string {
  return monthFormat.format(monthDate(key)).replace(".", "");
}

/** "2026-08" -> "agosto de 2026" */
export function formatMonthLong(key: string): string {
  return monthLongFormat.format(monthDate(key));
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/** Iniciales para el monograma cuando la inmobiliaria no tiene logo. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (
    (words[0]?.[0] ?? "") + (words.length > 1 ? (words[1]?.[0] ?? "") : "")
  ).toUpperCase();
}
