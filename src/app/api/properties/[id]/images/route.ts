import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, propertyImages } from "@/db/schema";
import { requireAgency } from "@/lib/auth-helper";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

const addImageSchema = z.object({
  imageUrl: z.string().url(),
});

export async function POST(
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
    const { imageUrl } = addImageSchema.parse(body);

    const existingImages = await db.query.propertyImages.findMany({
      where: eq(propertyImages.propertyId, id),
    });

    const isFirstImage = existingImages.length === 0;
    const newOrder = existingImages.length;

    const [newImage] = await db
      .insert(propertyImages)
      .values({
        propertyId: id,
        imageUrl,
        order: newOrder,
        isCover: isFirstImage, 
      })
      .returning();

    return NextResponse.json({ data: newImage }, { status: 201 });
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
      { error: "Failed to add image", details: error.message },
      { status: 500 }
    );
  }
}
