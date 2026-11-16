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

export async function dashboard(agencyId: string, now: Date = new Date()) {
  const months = lastMonths(now, MONTHS_SHOWN);

  const [statusRows, monthlyRows, averageDays] = await Promise.all([
    reportRepository.countPropertiesByStatus(agencyId),
    reportRepository.monthlyPublicationsAndClosings(agencyId, months[0]),
    reportRepository.averageDaysOnMarket(agencyId),
  ]);

  const propertiesByStatus = Object.fromEntries(
    REPORTED_STATUSES.map((status) => [
      status,
      statusRows.find((row) => row.status === status)?.total ?? 0,
    ])
  ) as Record<PropertyStatus, number>;

  const monthly = months.map((date) => {
    const key = monthKey(date);
    const row = monthlyRows.find((r) => r.month === key);
    return {
      month: key,
      published: row?.published ?? 0,
      closed: row?.closed ?? 0,
    };
  });

  return {
    propertiesByStatus,
    monthly,
    averageDaysOnMarket:
      averageDays === null ? null : Math.round(averageDays * 10) / 10,
  };
}
