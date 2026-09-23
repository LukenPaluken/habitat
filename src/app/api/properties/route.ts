import { NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { requireAgency } from "@/lib/auth-helper";
import { createPropertySchema } from "@/lib/validations/property";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, arrayContains } from "drizzle-orm";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const type = searchParams.get("type");
    const operation = searchParams.get("operation");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const currency = searchParams.get("currency");
    const neighborhood = searchParams.get("neighborhood");
    const rooms = searchParams.get("rooms");
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const tags = searchParams.getAll("tags");
    const search = searchParams.get("search");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const sort = searchParams.get("sort") || "date_desc";

    const filters = [];

    filters.push(eq(properties.status, "PUBLICADA"));

    if (type) filters.push(eq(properties.propertyType, type as any));
    if (operation) filters.push(eq(properties.operationType, operation as any));
    if (minPrice) filters.push(gte(properties.price, minPrice));
    if (maxPrice) filters.push(lte(properties.price, maxPrice));
    if (currency) filters.push(eq(properties.currency, currency as any));
    if (neighborhood) filters.push(ilike(properties.neighborhood, `%${neighborhood}%`));
    if (rooms) filters.push(gte(properties.rooms, parseInt(rooms, 10)));
    if (bedrooms) filters.push(gte(properties.bedrooms, parseInt(bedrooms, 10)));
    if (bathrooms) filters.push(gte(properties.bathrooms, parseInt(bathrooms, 10)));
    
    if (tags && tags.length > 0) {
      filters.push(arrayContains(properties.tags, tags));
    }

    if (search) {
      filters.push(
        or(
          ilike(properties.title, `%${search}%`),
          ilike(properties.description, `%${search}%`)
        )
      );
    }

    let orderBy = [desc(properties.createdAt)];
    if (sort === "price_asc") orderBy = [asc(properties.price)];
    if (sort === "price_desc") orderBy = [desc(properties.price)];
    if (sort === "date_asc") orderBy = [asc(properties.createdAt)];
    if (sort === "area_desc") orderBy = [desc(properties.totalArea)];
    if (sort === "area_asc") orderBy = [asc(properties.totalArea)];

    const results = await db.query.properties.findMany({
      where: and(...filters),
      orderBy,
      limit,
      offset,
      with: {
        agency: {
          columns: {
            fantasyName: true,
            logoUrl: true,
          }
        },
        images: true,
      }
    });

    const totalCountResult = await db
      .select({ count: sql`count(*)` })
      .from(properties)
      .where(and(...filters));

    const totalCount = Number(totalCountResult[0]?.count) || 0;

    return NextResponse.json({
      data: results,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch properties", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { agency } = await requireAgency();
    const body = await request.json();

    const validatedData = createPropertySchema.parse(body);

    const [newProperty] = await db
      .insert(properties)
      .values({
        agencyId: agency.id,
        ...validatedData,
      })
      .returning();

    return NextResponse.json({ data: newProperty }, { status: 201 });
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
      { error: "Failed to create property", details: error.message },
      { status: 500 }
    );
  }
}
