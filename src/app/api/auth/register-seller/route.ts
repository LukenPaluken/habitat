import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { registerSellerSchema } from "@/lib/validations/auth";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = registerSellerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      fantasyName,
      phone,
      description,
      address,
      logoUrl,
    } = result.data;

    // Check if fantasyName is already registered (case insensitive)
    const existingAgency = await db.query.agencies.findFirst({
      where: sql`LOWER(${agencies.fantasyName}) = LOWER(${fantasyName.trim()})`,
    });

    if (existingAgency) {
      return NextResponse.json(
        {
          error: "El nombre de fantasía ya está en uso por otra inmobiliaria.",
        },
        { status: 409 }
      );
    }

    // Check if email is already registered
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email.toLowerCase().trim()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo electrónico ya está registrado." },
        { status: 409 }
      );
    }

    // Register user via Better Auth
    const authResponse = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      },
      headers: req.headers,
    });

    if (!authResponse?.user) {
      return NextResponse.json(
        { error: "No se pudo crear la cuenta de usuario." },
        { status: 500 }
      );
    }

    // Create linked agency profile
    const [newAgency] = await db
      .insert(agencies)
      .values({
        userId: authResponse.user.id,
        fantasyName: fantasyName.trim(),
        description:
          description?.trim() || `Inmobiliaria ${fantasyName.trim()}`,
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        address: address?.trim() || null,
        logoUrl: logoUrl || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        user: authResponse.user,
        agency: newAgency,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error registering seller and agency:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
