import type { ApiResponse, MonthlyReport, StatusSummary } from "@/types/api";

// The three dashboard indicators, each with its own endpoint: they load in
// parallel and one failing doesn't take the others down.

export type StatusSummaryResponse = ApiResponse<StatusSummary>;
export type MonthlyReportResponse = ApiResponse<MonthlyReport[]>;
/** `averageDays` is `null` until something has been sold or rented. */
export type AverageTimeResponse = ApiResponse<{ averageDays: number | null }>;

export const STATUS_SUMMARY_URL = "/api/agencies/me/reports/status-summary";
export const MONTHLY_REPORT_URL = "/api/agencies/me/reports/monthly";
export const AVERAGE_TIME_URL = "/api/agencies/me/reports/avg-time-on-market";
