import { requireAgency } from "@/lib/auth-helper";
import * as reportService from "@/services/report.service";
import { handler, ok } from "./http";

// CONTROLLER layer: HTTP for the dashboard.

// GET /api/agencies/me/reports
export const dashboard = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await reportService.dashboard(agency.id));
});
