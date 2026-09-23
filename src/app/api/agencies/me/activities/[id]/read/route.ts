import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { agency } = await requireAgency();
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de actividad inválido." },
        { status: 400 }
      );
    }

    // 1. Fetch activity
    const activity = await db.query.activities.findFirst({
      where: eq(activities.id, id),
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Actividad no encontrada." },
        { status: 404 }
      );
    }

    // 2. Verify ownership
    if (activity.agencyId !== agency.id) {
      return NextResponse.json(
        { error: "No tiene permisos para modificar esta actividad." },
        { status: 403 }
      );
    }

    // 3. Mark as read
    const [updatedActivity] = await db
      .update(activities)
      .set({
        isRead: true,
      })
      .where(eq(activities.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
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
    console.error("Error marking activity as read:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar la actividad." },
      { status: 500 }
    );
  }
}
