import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { agencies, properties } from "@/db/schema";
import { updateAgencySchema } from "@/lib/validations/agency";
import { eq, sql, inArray, and, not } from "drizzle-orm";

export async function GET() {
  try {
    const { agency } = await requireAgency();

    // Query active properties counts
    const propertyCounts = await db
      .select({
        status: properties.status,
        count: sql<number>`count(*)::int`,
      })
      .from(properties)
      .where(eq(properties.agencyId, agency.id))
      .groupBy(properties.status);

    return NextResponse.json({
      success: true,
      agency,
      propertyCounts,
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
    return NextResponse.json(
      { error: "Error interno al obtener datos de la inmobiliaria." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { agency } = await requireAgency();
    const json = await req.json();

    const result = updateAgencySchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If updating fantasyName, verify it's not taken by another agency
    if (data.fantasyName && data.fantasyName.trim() !== agency.fantasyName) {
      const existingAgency = await db.query.agencies.findFirst({
        where: and(
          sql`LOWER(${agencies.fantasyName}) = LOWER(${data.fantasyName.trim()})`,
          not(eq(agencies.id, agency.id))
        ),
      });

      if (existingAgency) {
        return NextResponse.json(
          {
            error:
              "El nombre de fantasía ya está en uso por otra inmobiliaria.",
          },
          { status: 409 }
        );
      }
    }

    const updatePayload: Partial<typeof agencies.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.fantasyName !== undefined)
      updatePayload.fantasyName = data.fantasyName.trim();
    if (data.description !== undefined)
      updatePayload.description = data.description.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.email !== undefined)
      updatePayload.email = data.email.toLowerCase().trim();
    if (data.address !== undefined)
      updatePayload.address = data.address?.trim() || null;
    if (data.logoUrl !== undefined)
      updatePayload.logoUrl = data.logoUrl || null;

    const [updatedAgency] = await db
      .update(agencies)
      .set(updatePayload)
      .where(eq(agencies.id, agency.id))
      .returning();

    return NextResponse.json({
      success: true,
      agency: updatedAgency,
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
    return NextResponse.json(
      { error: "Error interno al actualizar la inmobiliaria." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { agency } = await requireAgency();

    // Business Rule Check:
    // "Una Inmobiliaria se puede eliminar cuando no tiene propiedades Publicada ni Reservada."
    const activeProperties = await db.query.properties.findMany({
      where: and(
        eq(properties.agencyId, agency.id),
        inArray(properties.status, ["PUBLICADA", "RESERVADA"])
      ),
      limit: 1,
    });

    if (activeProperties.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar la inmobiliaria mientras tenga propiedades en estado 'PUBLICADA' o 'RESERVADA'. Debe pausarlas, cancelarlas o darlas de baja primero.",
        },
        { status: 400 }
      );
    }

    // Delete agency (cascades to remaining inactive properties, reviews, etc.)
    await db.delete(agencies).where(eq(agencies.id, agency.id));

    return NextResponse.json({
      success: true,
      message: "La inmobiliaria ha sido eliminada exitosamente.",
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
    return NextResponse.json(
      { error: "Error interno al eliminar la inmobiliaria." },
      { status: 500 }
    );
  }
}
