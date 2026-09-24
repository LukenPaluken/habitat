import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, visitRequests } from "@/db/schema";
import { requireAgency } from "@/lib/auth-helper";
import { updatePropertySchema } from "@/lib/validations/property";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
      with: {
        agency: {
          columns: {
            fantasyName: true,
            logoUrl: true,
            phone: true,
            email: true,
            description: true,
            createdAt: true,
          }
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.order)],
        },
        comments: {
          orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        },
      }
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ data: property });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch property details", details: error.message },
      { status: 500 }
    );
  }
}

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

    // Check for "Confirmada" visits
    const confirmedVisits = await db.query.visitRequests.findFirst({
      where: and(
        eq(visitRequests.propertyId, id),
        eq(visitRequests.status, "Confirmada")
      )
    });

    if (confirmedVisits) {
      return NextResponse.json(
        { error: "Cannot edit property with pending confirmed visits" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updatePropertySchema.parse(body);

    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

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
      { error: "Failed to update property", details: error.message },
      { status: 500 }
    );
  }
}
