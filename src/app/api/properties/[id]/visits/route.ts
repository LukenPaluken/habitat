import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visitRequests, properties, activities } from "@/db/schema";
import { createVisitRequestSchema } from "@/lib/validations/visit";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de propiedad inválido." },
        { status: 400 }
      );
    }

    // 1. Verify property exists
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    // 2. Validate payload
    const json = await req.json();
    const result = createVisitRequestSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { requesterName, requesterPhone, proposedDate, message } =
      result.data;

    // 3. Create visit request record
    const [newVisit] = await db
      .insert(visitRequests)
      .values({
        propertyId: property.id,
        requesterName: requesterName.trim(),
        requesterPhone: requesterPhone.trim(),
        proposedDate,
        message: message?.trim() || null,
        status: "Pendiente",
      })
      .returning();

    // 4. Dispatch notification to the agency's in-app activity feed
    await db.insert(activities).values({
      agencyId: property.agencyId,
      type: "new_visit",
      content: `Nueva solicitud de visita de ${requesterName.trim()} para "${property.title}"`,
      isRead: false,
    });

    return NextResponse.json(
      {
        success: true,
        visit: newVisit,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating visit request:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la solicitud de visita." },
      { status: 500 }
    );
  }
}
