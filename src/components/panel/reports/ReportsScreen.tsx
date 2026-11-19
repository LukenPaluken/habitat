"use client";

import { PageHeader } from "../PageHeader";
import { AverageTimeCard } from "./AverageTimeCard";
import { MonthlyChart } from "./MonthlyChart";
import { StatusSummaryCards } from "./StatusSummaryCards";

/**
 * The three indicators of the dashboard. Each one loads its own endpoint, all
 * at the same time, and keeps its own loading and error state: if one fails the
 * others are still there.
 */
export function ReportsScreen() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reportes"
        description="Cómo viene tu inmobiliaria, de un vistazo."
      />
      <StatusSummaryCards />
      <MonthlyChart />
      <AverageTimeCard />
    </div>
  );
}
