import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, propertyStateHistory, activities } from "@/db/schema";
import { requireAgency } from "@/lib/auth-helper";
import { updatePropertyStatusSchema } from "@/lib/validations/property";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { agency } = await requireAgency();
    
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.agencyId !== agency.id) {
      return NextResponse.json({ error: "Forbidden: Not your property" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updatePropertyStatusSchema.parse(body);

    const newStatus = validatedData.status;

    if (property.status === newStatus) {
      return NextResponse.json({ error: "Property is already in this status" }, { status: 400 });
    }

    const updatedProperty = await db.transaction(async (tx) => {
      await tx.insert(propertyStateHistory).values({
        propertyId: property.id,
        previousState: property.status,
        newState: newStatus,
      });

      await tx.insert(activities).values({
        agencyId: agency.id,
        type: "property_state_change",
        content: `La propiedad "${property.title}" cambió su estado a ${newStatus}.`,
      });

      const [updated] = await tx
        .update(properties)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, id))
        .returning();

      return updated;
    });

    return NextResponse.json({ data: updatedProperty });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    if (error.message === "UNAUTHORIZED" || error.message === "AGENCY_NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update property status", details: error.message },
      { status: 500 }
    );
  }
}
