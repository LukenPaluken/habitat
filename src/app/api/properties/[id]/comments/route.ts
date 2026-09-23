import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, properties, activities } from "@/db/schema";
import { createCommentSchema } from "@/lib/validations/comment";
import { eq, desc } from "drizzle-orm";

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
        { error: "Identificador de propiedad inválido." },
        { status: 400 }
      );
    }

    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    const propertyComments = await db.query.comments.findMany({
      where: eq(comments.propertyId, id),
      orderBy: [desc(comments.createdAt)],
    });

    return NextResponse.json({
      success: true,
      comments: propertyComments,
      total: propertyComments.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Error interno al obtener los comentarios." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de propiedad inválido." },
        { status: 400 }
      );
    }

    const property = await db.query.properties.findFirst({
      where: eq(properties.id, id),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    const json = await req.json();
    const result = createCommentSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { authorName, content } = result.data;

    // 1. Create comment
    const [newComment] = await db
      .insert(comments)
      .values({
        propertyId: property.id,
        authorName: authorName.trim(),
        content: content.trim(),
      })
      .returning();

    // 2. Dispatch in-app activity notification to the owning agency
    await db.insert(activities).values({
      agencyId: property.agencyId,
      type: "new_comment",
      content: `Nueva consulta de ${authorName.trim()} en "${property.title}"`,
      isRead: false,
    });

    return NextResponse.json(
      {
        success: true,
        comment: newComment,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Error interno al enviar la consulta." },
      { status: 500 }
    );
  }
}
