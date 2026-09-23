import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agencies, reviews, activities } from "@/db/schema";
import { createReviewSchema } from "@/lib/validations/review";
import { eq, desc, avg, count, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de inmobiliaria inválido." },
        { status: 400 }
      );
    }

    // 1. Verify agency exists
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, id),
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Inmobiliaria no encontrada." },
        { status: 404 }
      );
    }

    // 2. Fetch reviews ordered chronologically
    const agencyReviews = await db.query.reviews.findMany({
      where: eq(reviews.agencyId, id),
      orderBy: [desc(reviews.createdAt)],
    });

    // 3. Compute aggregate statistics
    const [ratingStats] = await db
      .select({
        avgRating: avg(reviews.rating),
        totalReviews: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.agencyId, id));

    // 4. Compute rating breakdown by star rating (1 to 5)
    const breakdown = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)::int`,
      })
      .from(reviews)
      .where(eq(reviews.agencyId, id))
      .groupBy(reviews.rating);

    const ratingCounts: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    breakdown.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingCounts[item.rating] = Number(item.count);
      }
    });

    const averageRating = ratingStats?.avgRating
      ? parseFloat(Number(ratingStats.avgRating).toFixed(1))
      : 0;
    const totalReviews = Number(ratingStats?.totalReviews || 0);

    return NextResponse.json({
      success: true,
      agencyId: id,
      stats: {
        averageRating,
        totalReviews,
        ratingCounts,
      },
      reviews: agencyReviews,
    });
  } catch (error: unknown) {
    console.error("Error fetching agency reviews:", error);
    return NextResponse.json(
      { error: "Error interno al obtener las reseñas de la inmobiliaria." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de inmobiliaria inválido." },
        { status: 400 }
      );
    }

    // 1. Verify agency exists
    const agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, id),
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Inmobiliaria no encontrada." },
        { status: 404 }
      );
    }

    // 2. Validate payload
    const json = await req.json();
    const result = createReviewSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { authorName, content, rating } = result.data;

    // 3. Create review record
    const [newReview] = await db
      .insert(reviews)
      .values({
        agencyId: agency.id,
        authorName: authorName.trim(),
        content: content.trim(),
        rating,
      })
      .returning();

    // 4. Dispatch in-app notification to the agency
    await db.insert(activities).values({
      agencyId: agency.id,
      type: "new_review",
      content: `Nueva reseña de ${authorName.trim()} (${rating} estrellas): "${content.trim().slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
      isRead: false,
    });

    return NextResponse.json(
      {
        success: true,
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating agency review:", error);
    return NextResponse.json(
      { error: "Error interno al registrar la reseña." },
      { status: 500 }
    );
  }
}
