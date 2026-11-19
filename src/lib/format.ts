import type { Currency, OperationType } from "@/types/api";

const amountFormat = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const relativeFormat = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

/** "USD 120.000", "$ 450.000", and "/mes" when it is a rental. */
export function formatPrice(
  price: string,
  currency: Currency,
  operation?: OperationType
): string {
  const amount = amountFormat.format(Number(price));
  const label = currency === "USD" ? `USD ${amount}` : `$ ${amount}`;
  return operation === "Alquiler" ? `${label}/mes` : label;
}

export function formatArea(squareMeters: number): string {
  return `${amountFormat.format(squareMeters)} m²`;
}

/** 3.7 -> "3,7". */
export function formatRating(rating: number): string {
  return rating.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "hace 5 minutos", "ayer", "hace 3 días"; older than a week: the date. */
export function formatRelativeDate(iso: string, now = Date.now()): string {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < MINUTE) return "recién";
  if (elapsed < HOUR) {
    return relativeFormat.format(-Math.floor(elapsed / MINUTE), "minute");
  }
  if (elapsed < DAY) {
    return relativeFormat.format(-Math.floor(elapsed / HOUR), "hour");
  }
  if (elapsed < 7 * DAY) {
    return relativeFormat.format(-Math.floor(elapsed / DAY), "day");
  }
  return formatDateTime(iso);
}

/** Value for `<input type="datetime-local" min=...>`: local time, no seconds. */
export function toDateTimeLocalValue(date: Date): string {
  const offset = date.getTimezoneOffset() * MINUTE;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
