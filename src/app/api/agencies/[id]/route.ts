import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agencies, properties, reviews, propertyImages } from "@/db/schema";
import { eq, desc, avg, count } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Identificador de inmobiliaria inválido." },
        { status: 400 }
      );
    }

    // 1. Fetch agency basic information
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, id),
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Inmobiliaria no encontrada." },
        { status: 404 }
      );
    }

    // 2. Fetch public published properties with their cover image or first image
    const publishedProperties = await db.query.properties.findMany({
      where: eq(properties.status, "PUBLICADA"),
      with: {
        images: {
          orderBy: [desc(propertyImages.isCover), propertyImages.order],
        },
      },
      orderBy: [desc(properties.createdAt)],
    });

    // Filter to this agency only
    const agencyProperties = publishedProperties.filter(
      (p) => p.agencyId === agency.id
    );

    // 3. Fetch reviews
    const agencyReviews = await db.query.reviews.findMany({
      where: eq(reviews.agencyId, agency.id),
      orderBy: [desc(reviews.createdAt)],
    });

    // 4. Calculate average rating and total count
    const [ratingStats] = await db
      .select({
        avgRating: avg(reviews.rating),
        totalReviews: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.agencyId, agency.id));

    const averageRating = ratingStats?.avgRating
      ? parseFloat(Number(ratingStats.avgRating).toFixed(1))
      : 0;
    const totalReviews = Number(ratingStats?.totalReviews || 0);

    return NextResponse.json({
      success: true,
      agency: {
        id: agency.id,
        fantasyName: agency.fantasyName,
        description: agency.description,
        logoUrl: agency.logoUrl,
        phone: agency.phone,
        email: agency.email,
        address: agency.address,
        createdAt: agency.createdAt,
      },
      stats: {
        averageRating,
        totalReviews,
        activeListingsCount: agencyProperties.length,
      },
      properties: agencyProperties,
      reviews: agencyReviews,
    });
  } catch (error: unknown) {
    console.error("Error fetching agency profile:", error);
    return NextResponse.json(
      { error: "Error interno al obtener el perfil de la inmobiliaria." },
      { status: 500 }
    );
  }
}
