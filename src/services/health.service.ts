import * as healthRepository from "@/repositories/health.repository";

// SERVICE layer: is the app able to do its job? That needs the database.
export async function check(): Promise<{ status: "ok" }> {
  await healthRepository.ping();
  return { status: "ok" };
}
