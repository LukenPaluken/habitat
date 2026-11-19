import { requireAgency } from "@/lib/auth-helper";
import * as reportService from "@/services/report.service";
import { handler, ok } from "./http";

// CONTROLLER layer: HTTP for the dashboard. The three indicators have their own
// endpoint (so one failing doesn't hide the others) and also come together in
// `GET /api/agencies/me/reports`.

// GET /api/agencies/me/reports
export const dashboard = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await reportService.dashboard(agency.id));
});

// GET /api/agencies/me/reports/status-summary
export const statusSummary = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await reportService.statusSummary(agency.id));
});

// GET /api/agencies/me/reports/monthly
export const monthly = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await reportService.monthly(agency.id));
});

// GET /api/agencies/me/reports/avg-time-on-market
export const avgTimeOnMarket = handler(async () => {
  const { agency } = await requireAgency();
  return ok(await reportService.averageTimeOnMarket(agency.id));
});
