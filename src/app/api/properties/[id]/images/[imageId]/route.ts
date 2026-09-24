import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties, propertyImages } from "@/db/schema";
import { requireAgency } from "@/lib/auth-helper";
import { and, eq } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
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

    const image = await db.query.propertyImages.findFirst({
      where: and(
        eq(propertyImages.id, imageId),
        eq(propertyImages.propertyId, id)
      )
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await db.delete(propertyImages).where(eq(propertyImages.id, imageId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "AGENCY_NOT_FOUND") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete image", details: error.message },
      { status: 500 }
    );
  }
}
