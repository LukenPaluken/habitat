import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { visitRequests, properties, propertyImages } from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { agency } = await requireAgency();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const propertyIdParam = searchParams.get("propertyId");

    // 1. Fetch all properties belonging to this agency
    const agencyProperties = await db.query.properties.findMany({
      where: eq(properties.agencyId, agency.id),
      with: {
        images: {
          orderBy: [desc(propertyImages.isCover), propertyImages.order],
          limit: 1,
        },
      },
    });

    const propertyIds = agencyProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        visits: [],
        total: 0,
      });
    }

    // 2. Build where conditions
    const conditions = [inArray(visitRequests.propertyId, propertyIds)];

    if (propertyIdParam && propertyIds.includes(propertyIdParam)) {
      conditions.push(eq(visitRequests.propertyId, propertyIdParam));
    }

    if (
      statusParam &&
      [
        "Pendiente",
        "Confirmada",
        "Realizada",
        "Cancelada",
        "Rechazada",
      ].includes(statusParam)
    ) {
      conditions.push(
        eq(
          visitRequests.status,
          statusParam as
            "Pendiente" | "Confirmada" | "Realizada" | "Cancelada" | "Rechazada"
        )
      );
    }

    // 3. Query visit requests
    const agencyVisits = await db.query.visitRequests.findMany({
      where: and(...conditions),
      with: {
        property: {
          with: {
            images: {
              orderBy: [desc(propertyImages.isCover), propertyImages.order],
              limit: 1,
            },
          },
        },
      },
      orderBy: [asc(visitRequests.proposedDate)],
    });

    return NextResponse.json({
      success: true,
      visits: agencyVisits,
      total: agencyVisits.length,
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
    console.error("Error listing agency visits:", error);
    return NextResponse.json(
      { error: "Error interno al obtener las solicitudes de visita." },
      { status: 500 }
    );
  }
}
