import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { visitRequests, properties } from "@/db/schema";
import { updateVisitStatusSchema } from "@/lib/validations/visit";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid state transition matrix
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pendiente: ["Confirmada", "Rechazada", "Cancelada"],
  Confirmada: ["Realizada", "Cancelada", "Rechazada"],
  Realizada: [],
  Cancelada: [],
  Rechazada: [],
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { agency } = await requireAgency();
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de solicitud de visita inválido." },
        { status: 400 }
      );
    }

    // 1. Fetch visit request
    const visit = await db.query.visitRequests.findFirst({
      where: eq(visitRequests.id, id),
    });

    if (!visit) {
      return NextResponse.json(
        { error: "Solicitud de visita no encontrada." },
        { status: 404 }
      );
    }

    // 2. Fetch associated property to verify agency ownership
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, visit.propertyId),
    });

    if (!property || property.agencyId !== agency.id) {
      return NextResponse.json(
        { error: "No tiene permisos para modificar esta solicitud de visita." },
        { status: 403 }
      );
    }

    // 3. Validate requested status payload
    const json = await req.json();
    const result = updateVisitStatusSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus } = result.data;
    const currentStatus = visit.status;

    if (currentStatus === newStatus) {
      return NextResponse.json({
        success: true,
        visit,
      });
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Transición de estado inválida: no se puede cambiar de '${currentStatus}' a '${newStatus}'.`,
        },
        { status: 400 }
      );
    }

    // 4. Update status in database
    const [updatedVisit] = await db
      .update(visitRequests)
      .set({
        status: newStatus,
      })
      .where(eq(visitRequests.id, visit.id))
      .returning();

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
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
    console.error("Error updating visit status:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el estado de la visita." },
      { status: 500 }
    );
  }
}
