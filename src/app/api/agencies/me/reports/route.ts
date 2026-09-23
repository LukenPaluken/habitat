import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import {
  properties,
  propertyStateHistory,
  visitRequests,
  comments,
} from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

const ALL_STATUSES = [
  "BORRADOR",
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
] as const;

export async function GET() {
  try {
    const { agency } = await requireAgency();

    // 1. Fetch all properties belonging to this agency
    const agencyProperties = await db.query.properties.findMany({
      where: eq(properties.agencyId, agency.id),
    });

    const propertyIds = agencyProperties.map((p) => p.id);

    // 2. Compute properties by status
    const statusCounts: Record<string, number> = {};
    ALL_STATUSES.forEach((s) => {
      statusCounts[s] = 0;
    });

    agencyProperties.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        reports: {
          propertiesByStatus: statusCounts,
          monthlyEvolution: [],
          averageDaysOnMarket: 0,
          closedDealsCount: 0,
          summary: {
            totalProperties: 0,
            totalVisits: 0,
            totalComments: 0,
          },
        },
      });
    }

    // 3. Fetch full state history for these properties
    const stateHistories = await db.query.propertyStateHistory.findMany({
      where: inArray(propertyStateHistory.propertyId, propertyIds),
      orderBy: [propertyStateHistory.createdAt],
    });

    // 4. Calculate Average Time on Market (days between PUBLICADA and VENDIDA / ALQUILADA)
    const closedProperties = agencyProperties.filter(
      (p) => p.status === "VENDIDA" || p.status === "ALQUILADA"
    );

    const daysOnMarketList: number[] = [];

    closedProperties.forEach((prop) => {
      // Find history records for this property
      const propHistories = stateHistories.filter(
        (h) => h.propertyId === prop.id
      );

      // Find first publication date (either when state became PUBLICADA or prop createdAt)
      const publishedRecord = propHistories.find(
        (h) => h.newState === "PUBLICADA"
      );
      const publishedDate = publishedRecord
        ? new Date(publishedRecord.createdAt).getTime()
        : new Date(prop.createdAt).getTime();

      // Find closing date (when it became VENDIDA or ALQUILADA)
      const closedRecord = propHistories
        .filter((h) => h.newState === "VENDIDA" || h.newState === "ALQUILADA")
        .pop();

      const closedDate = closedRecord
        ? new Date(closedRecord.createdAt).getTime()
        : new Date(prop.updatedAt).getTime();

      const diffInDays = Math.max(
        0,
        Math.round((closedDate - publishedDate) / (1000 * 60 * 60 * 24))
      );
      daysOnMarketList.push(diffInDays);
    });

    const averageDaysOnMarket =
      daysOnMarketList.length > 0
        ? Math.round(
            daysOnMarketList.reduce((acc, curr) => acc + curr, 0) /
              daysOnMarketList.length
          )
        : 0;

    // 5. Compute Monthly Evolution (Publications vs Closed Deals by Month for past 6 months)
    const monthlyMap: Record<
      string,
      {
        month: string;
        label: string;
        newPublications: number;
        closedOperations: number;
      }
    > = {};

    // Generate last 6 months buckets
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-AR", {
        month: "short",
        year: "numeric",
      });
      monthlyMap[key] = {
        month: key,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        newPublications: 0,
        closedOperations: 0,
      };
    }

    // Count publications per month
    agencyProperties.forEach((p) => {
      const createdDate = new Date(p.createdAt);
      const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].newPublications += 1;
      }
    });

    // Count closed operations per month from state history
    stateHistories.forEach((h) => {
      if (h.newState === "VENDIDA" || h.newState === "ALQUILADA") {
        const closedDate = new Date(h.createdAt);
        const key = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap[key]) {
          monthlyMap[key].closedOperations += 1;
        }
      }
    });

    const monthlyEvolution = Object.values(monthlyMap);

    // 6. Summary metrics
    const [visitStats] = await db
      .select({ totalVisits: sql<number>`count(*)::int` })
      .from(visitRequests)
      .where(inArray(visitRequests.propertyId, propertyIds));

    const [commentStats] = await db
      .select({ totalComments: sql<number>`count(*)::int` })
      .from(comments)
      .where(inArray(comments.propertyId, propertyIds));

    return NextResponse.json({
      success: true,
      reports: {
        propertiesByStatus: statusCounts,
        monthlyEvolution,
        averageDaysOnMarket,
        closedDealsCount: daysOnMarketList.length,
        summary: {
          totalProperties: agencyProperties.length,
          totalVisits: Number(visitStats?.totalVisits || 0),
          totalComments: Number(commentStats?.totalComments || 0),
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { error: "No autenticado. Por favor inicie sesión." },
          { status: 401 }
        );
      }
      if (error.message === "AGENCY_NOT_FOUND") {
        return NextResponse.json(
          { error: "No se encontró una inmobiliaria asociada a este usuario." },
          { status: 404 }
        );
      }
    }
    console.error("Error generating agency reports:", error);
    return NextResponse.json(
      { error: "Error interno al generar el reporte." },
      { status: 500 }
    );
  }
}
