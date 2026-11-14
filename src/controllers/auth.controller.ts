import { NextResponse } from "next/server";
import { registerSellerSchema } from "@/lib/validations/auth";
import * as authService from "@/services/auth.service";
import { handler, readJson } from "./http";

// CONTROLLER layer: POST /api/auth/register-seller (the rest of /api/auth/* is
// served by Better Auth itself).

export const registerSeller = handler(async (request) => {
  const input = registerSellerSchema.parse(await readJson(request));

  const { user, agency } = await authService.registerSeller(
    input,
    request.headers
  );

  // Keeps the response shape this endpoint already had.
  return NextResponse.json({ success: true, user, agency }, { status: 201 });
});
