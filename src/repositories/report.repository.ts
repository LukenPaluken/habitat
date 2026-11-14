import { count, eq, sql } from "drizzle-orm";
import { properties, type PropertyStatus } from "@/models";
import { db, type DbExecutor } from "./executor";

// REPOSITORY layer: aggregate queries behind the agency dashboard. They only
// compute numbers from `properties` and `property_state_history`; what to show
// (zero-filled months, rounding, which statuses) is decided by the service.

export async function countPropertiesByStatus(
  agencyId: string,
  executor: DbExecutor = db
): Promise<{ status: PropertyStatus; total: number }[]> {
  return executor
    .select({ status: properties.status, total: count() })
    .from(properties)
    .where(eq(properties.agencyId, agencyId))
    .groupBy(properties.status);
}

export type MonthlyCounts = {
  /** `YYYY-MM` */
  month: string;
  published: number;
  closed: number;
};

// Per month since `since`:
//  - published: first-time publications (BORRADOR -> PUBLICADA, or created
//    directly as PUBLICADA). Re-publishing a paused property does not count.
//  - closed: properties that became VENDIDA or ALQUILADA.
export async function monthlyPublicationsAndClosings(
  agencyId: string,
  since: Date,
  executor: DbExecutor = db
): Promise<MonthlyCounts[]> {
  const rows = await executor.execute<MonthlyCounts>(sql`
    SELECT
      to_char(date_trunc('month', h.created_at), 'YYYY-MM') AS month,
      (count(*) FILTER (
        WHERE h.new_state = 'PUBLICADA'
          AND (h.previous_state IS NULL OR h.previous_state = 'BORRADOR')
      ))::int AS published,
      (count(*) FILTER (
        WHERE h.new_state IN ('VENDIDA', 'ALQUILADA')
      ))::int AS closed
    FROM property_state_history h
    JOIN properties p ON p.id = h.property_id
    WHERE p.agency_id = ${agencyId}
      AND h.created_at >= ${since.toISOString()}::timestamp
    GROUP BY 1
    ORDER BY 1
  `);
  return Array.from(rows);
}

// Average days between the first PUBLICADA and the VENDIDA/ALQUILADA of every
// property that went through both. Null when there is no such property yet.
export async function averageDaysOnMarket(
  agencyId: string,
  executor: DbExecutor = db
): Promise<number | null> {
  const rows = await executor.execute<{ days: number | null }>(sql`
    SELECT avg(extract(epoch FROM (closed_at - published_at)) / 86400)::float8 AS days
    FROM (
      SELECT
        min(h.created_at) FILTER (WHERE h.new_state = 'PUBLICADA') AS published_at,
        min(h.created_at) FILTER (WHERE h.new_state IN ('VENDIDA', 'ALQUILADA')) AS closed_at
      FROM property_state_history h
      JOIN properties p ON p.id = h.property_id
      WHERE p.agency_id = ${agencyId}
      GROUP BY h.property_id
    ) t
    WHERE published_at IS NOT NULL
      AND closed_at IS NOT NULL
      AND closed_at >= published_at
  `);
  return rows[0]?.days ?? null;
}
