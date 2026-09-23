import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH() {
  try {
    const { agency } = await requireAgency();

    // Mark all unread activities for this agency as read
    const updated = await db
      .update(activities)
      .set({
        isRead: true,
      })
      .where(
        and(eq(activities.agencyId, agency.id), eq(activities.isRead, false))
      )
      .returning();

    return NextResponse.json({
      success: true,
      updatedCount: updated.length,
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
    console.error("Error marking all activities as read:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar las actividades." },
      { status: 500 }
    );
  }
}
