import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { activityFilterSchema } from "@/lib/validations/activity";
import { eq, and, desc, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { agency } = await requireAgency();

    const { searchParams } = new URL(req.url);
    const queryResult = activityFilterSchema.safeParse({
      unreadOnly: searchParams.get("unreadOnly") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const { unreadOnly, limit, offset } = queryResult.success
      ? queryResult.data
      : { unreadOnly: false, limit: 50, offset: 0 };

    // 1. Calculate unread count for badge (e.g. "Actividad 🔔 3")
    const [unreadStats] = await db
      .select({ unreadCount: count(activities.id) })
      .from(activities)
      .where(
        and(eq(activities.agencyId, agency.id), eq(activities.isRead, false))
      );

    const unreadCount = Number(unreadStats?.unreadCount || 0);

    // 2. Build where conditions for activities list
    const conditions = [eq(activities.agencyId, agency.id)];
    if (unreadOnly) {
      conditions.push(eq(activities.isRead, false));
    }

    // 3. Query total count matching filter
    const [totalStats] = await db
      .select({ totalCount: count(activities.id) })
      .from(activities)
      .where(and(...conditions));

    const totalCount = Number(totalStats?.totalCount || 0);

    // 4. Query activities
    const agencyActivities = await db.query.activities.findMany({
      where: and(...conditions),
      orderBy: [desc(activities.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
      totalCount,
      activities: agencyActivities,
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
    console.error("Error fetching agency activities:", error);
    return NextResponse.json(
      { error: "Error interno al obtener el feed de actividad." },
      { status: 500 }
    );
  }
}
