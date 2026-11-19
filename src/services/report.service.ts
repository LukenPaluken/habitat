import type { PropertyStatus } from "@/models";
import * as reportRepository from "@/repositories/report.repository";

// SERVICE layer: turns the raw aggregates of the report repository into the
// dashboard the seller sees (every status present even with 0, a continuous
// month axis, rounded numbers).

const REPORTED_STATUSES: PropertyStatus[] = [
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
];

const MONTHS_SHOWN = 12;

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// The last `count` calendar months (oldest first), ending at the month of `now`.
function lastMonths(now: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)
    );
  });
}

// Properties per current status, every status present even with 0.
export async function statusSummary(agencyId: string) {
  const rows = await reportRepository.countPropertiesByStatus(agencyId);

  return Object.fromEntries(
    REPORTED_STATUSES.map((status) => [
      status,
      rows.find((row) => row.status === status)?.total ?? 0,
    ])
  ) as Record<PropertyStatus, number>;
}

// New publications and closed sales/rentals per month, over a continuous axis
// of the last 12 months.
export async function monthly(agencyId: string, now: Date = new Date()) {
  const months = lastMonths(now, MONTHS_SHOWN);
  const rows = await reportRepository.monthlyPublicationsAndClosings(
    agencyId,
    months[0]
  );

  return months.map((date) => {
    const key = monthKey(date);
    const row = rows.find((r) => r.month === key);
    return {
      month: key,
      published: row?.published ?? 0,
      closed: row?.closed ?? 0,
    };
  });
}

// Days between the first PUBLICADA and the VENDIDA/ALQUILADA; `null` (not NaN,
// not 0) while nothing has been sold or rented yet.
export async function averageTimeOnMarket(agencyId: string) {
  const days = await reportRepository.averageDaysOnMarket(agencyId);
  return { averageDays: days === null ? null : Math.round(days * 10) / 10 };
}

// The three indicators together (the screen can also ask for each one alone).
export async function dashboard(agencyId: string, now: Date = new Date()) {
  const [propertiesByStatus, monthlyCounts, onMarket] = await Promise.all([
    statusSummary(agencyId),
    monthly(agencyId, now),
    averageTimeOnMarket(agencyId),
  ]);

  return {
    propertiesByStatus,
    monthly: monthlyCounts,
    averageDaysOnMarket: onMarket.averageDays,
  };
}
