import { NextRequest, NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helper";
import { db } from "@/db";
import { comments, properties } from "@/db/schema";
import { replyCommentSchema } from "@/lib/validations/comment";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { agency } = await requireAgency();
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "Identificador de consulta inválido." },
        { status: 400 }
      );
    }

    // 1. Fetch comment
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, id),
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Consulta no encontrada." },
        { status: 404 }
      );
    }

    // 2. Fetch associated property to verify ownership
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, comment.propertyId),
    });

    if (!property || property.agencyId !== agency.id) {
      return NextResponse.json(
        {
          error:
            "No tiene permisos para responder consultas de esta propiedad.",
        },
        { status: 403 }
      );
    }

    // 3. Validate reply payload
    const json = await req.json();
    const result = replyCommentSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validación fallida",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { sellerReply } = result.data;

    // 4. Update comment with seller reply
    const [updatedComment] = await db
      .update(comments)
      .set({
        sellerReply: sellerReply.trim(),
        updatedAt: new Date(),
      })
      .where(eq(comments.id, comment.id))
      .returning();

    return NextResponse.json({
      success: true,
      comment: updatedComment,
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
    console.error("Error replying to comment:", error);
    return NextResponse.json(
      { error: "Error interno al responder la consulta." },
      { status: 500 }
    );
  }
}
