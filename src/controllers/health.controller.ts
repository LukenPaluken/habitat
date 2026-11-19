import { NextResponse } from "next/server";
import * as healthService from "@/services/health.service";

// CONTROLLER layer: GET /api/health. Public, for "is it up?" checks.
export async function check() {
  try {
    return NextResponse.json(await healthService.check());
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
