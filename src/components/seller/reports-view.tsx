"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatMonthLong, formatMonthShort, formatNumber } from "@/lib/format";
import { reportApi } from "@/lib/seller-api";
import { PROPERTY_STATUS_LABEL, type ApiReports } from "@/lib/seller-types";
import { useQuery } from "@/lib/use-query";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, RowsSkeleton } from "@/components/ui/states";

type Monthly = ApiReports["monthly"];

const STATUS_ROWS = [
  "PUBLICADA",
  "RESERVADA",
  "VENDIDA",
  "ALQUILADA",
  "PAUSADA",
  "CANCELADA",
] as const;

export function ReportsView() {
  const query = useQuery("reports", async () => (await reportApi.get()).data);

  return (
    <>
      <PageHeader kicker="Panel del vendedor" title="Reportes">
        Cómo viene tu inmobiliaria: en qué estado está cada propiedad, cuánto se
        publica y se cierra por mes, y cuánto tardan en venderse o alquilarse.
      </PageHeader>

      {query.loading ? (
        <RowsSkeleton rows={3} />
      ) : query.error && !query.data ? (
        <ErrorState message={query.error} onRetry={query.reload} />
      ) : query.data ? (
        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[17rem_1fr]">
          <MarketTime days={query.data.averageDaysOnMarket} />
          <StatusBars counts={query.data.propertiesByStatus} />
          <div className="border-t border-rule pt-10 lg:col-span-2">
            <MonthlyChart data={query.data.monthly} />
          </div>
        </div>
      ) : null}
    </>
  );
}

// --- average time on market ----------------------------------------------------

function MarketTime({ days }: { days: number | null }) {
  return (
    <section aria-labelledby="market-time">
      <h2
        id="market-time"
        className="kicker !font-sans !text-[13px] !normal-case !tracking-normal !text-graphite"
      >
        Tiempo promedio en mercado
      </h2>
      {days === null ? (
        <>
          <p className="mt-3 text-[3.5rem] font-medium leading-none">—</p>
          <p className="mt-3 text-sm text-stone">
            Todavía no hay propiedades vendidas o alquiladas para calcularlo.
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 flex items-baseline gap-2 font-medium leading-none">
            <span className="text-[3.5rem]">{formatNumber(days)}</span>
            <span className="text-lg text-graphite">
              {days === 1 ? "día" : "días"}
            </span>
          </p>
          <p className="mt-3 text-sm text-stone">
            Entre que una propiedad se publica y se vende o se alquila.
          </p>
        </>
      )}
    </section>
  );
}

// --- properties by status ------------------------------------------------------

function StatusBars({ counts }: { counts: ApiReports["propertiesByStatus"] }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...STATUS_ROWS.map((status) => counts[status]));
  const total = STATUS_ROWS.reduce((sum, status) => sum + counts[status], 0);

  return (
    <section aria-labelledby="by-status">
      <ChartHeader
        id="by-status"
        title="Propiedades por estado"
        note="No incluye borradores."
        asTable={asTable}
        onToggle={() => setAsTable((current) => !current)}
      />

      {asTable ? (
        <DataTable
          caption="Propiedades por estado"
          head={["Estado", "Propiedades"]}
          rows={STATUS_ROWS.map((status) => [
            PROPERTY_STATUS_LABEL[status],
            String(counts[status]),
          ])}
        />
      ) : total === 0 ? (
        <p className="py-6 text-sm text-stone">
          Todavía no hay propiedades fuera de borrador.
        </p>
      ) : (
        <ul className="mt-4">
          {STATUS_ROWS.map((status) => {
            const value = counts[status];
            return (
              <li
                key={status}
                className="grid grid-cols-[6.5rem_1fr_2.25rem] items-center gap-3 border-b border-rule py-3 last:border-b-0"
              >
                <span className="text-sm text-graphite">
                  {PROPERTY_STATUS_LABEL[status]}
                </span>
                <div className="h-3">
                  {value > 0 && (
                    <div
                      className="h-full rounded-r-[4px] bg-ink"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-right font-mono text-sm tabular-nums",
                    value === 0 && "text-stone"
                  )}
                >
                  {value}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// --- publications and closings per month ---------------------------------------

function useElementWidth(
  ref: React.RefObject<HTMLElement | null>,
  fallback = 640
) {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

/** "Nice" integer scale: 0, 1, 2, 3… or 0, 5, 10… depending on the maximum. */
function niceScale(max: number) {
  const steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const step = steps.find((candidate) => max / candidate <= 4) ?? 1000;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  return { top, ticks };
}

/** Column with a rounded free end (4px) and a square base. */
function columnPath(
  x: number,
  baseline: number,
  width: number,
  height: number
) {
  const r = Math.min(4, width / 2, height);
  const top = baseline - height;
  return `M${x} ${baseline}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + width - r}Q${x + width} ${top} ${x + width} ${top + r}V${baseline}Z`;
}

const SERIES = [
  {
    key: "published",
    label: "Publicaciones nuevas",
    fill: "fill-chart-published",
    swatch: "bg-chart-published",
  },
  {
    key: "closed",
    label: "Ventas y alquileres",
    fill: "fill-chart-closed",
    swatch: "bg-chart-closed",
  },
] as const;

const MARGIN = { top: 22, right: 6, bottom: 44, left: 30 };
const PLOT_HEIGHT = 190;

function MonthlyChart({ data }: { data: Monthly }) {
  const [asTable, setAsTable] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const holder = useRef<HTMLDivElement>(null);
  const width = useElementWidth(holder);

  const height = MARGIN.top + PLOT_HEIGHT + MARGIN.bottom;
  const innerWidth = Math.max(120, width - MARGIN.left - MARGIN.right);
  const baseline = MARGIN.top + PLOT_HEIGHT;

  const maxValue = Math.max(1, ...data.flatMap((d) => [d.published, d.closed]));
  const { top: yMax, ticks } = niceScale(maxValue);
  const yOf = (value: number) => baseline - (value / yMax) * PLOT_HEIGHT;

  const slot = innerWidth / data.length;
  const barWidth = Math.min(20, Math.max(5, (slot * 0.7 - 2) / 2));
  const groupWidth = barWidth * 2 + 2;
  const labelEvery = slot < 40 ? 2 : 1;

  // Only the peak of each series is labelled: the axis and tooltip give the rest.
  const peak = (key: "published" | "closed") => {
    const best = Math.max(...data.map((d) => d[key]));
    return best > 0 ? data.findIndex((d) => d[key] === best) : -1;
  };
  const peaks = { published: peak("published"), closed: peak("closed") };

  const activeRow = active === null ? null : data[active];
  // The tooltip sits beside the month's column (on the right in the first
  // half of the axis, on the left in the second) so it does not cover the bars.
  const tipOnRight = active !== null && active < data.length / 2;
  const tipLeft =
    active === null
      ? 0
      : tipOnRight
        ? MARGIN.left + slot * (active + 1) + 8
        : MARGIN.left + slot * active - 8;

  return (
    <section aria-labelledby="monthly">
      <ChartHeader
        id="monthly"
        title="Publicaciones y cierres por mes"
        note="Últimos 12 meses. Un cierre es una propiedad vendida o alquilada."
        asTable={asTable}
        onToggle={() => setAsTable((current) => !current)}
      />

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-graphite">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-2.5", series.swatch)} />
            {series.label}
          </li>
        ))}
      </ul>

      {asTable ? (
        <DataTable
          caption="Publicaciones y cierres por mes"
          head={["Mes", SERIES[0].label, SERIES[1].label]}
          rows={data.map((d) => [
            formatMonthLong(d.month),
            String(d.published),
            String(d.closed),
          ])}
        />
      ) : (
        <div ref={holder} className="relative mt-2">
          <svg
            width={width}
            height={height}
            role="group"
            aria-label="Gráfico de columnas: publicaciones nuevas y cierres por mes"
            className="block overflow-visible"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={width - MARGIN.right}
                  y1={yOf(tick)}
                  y2={yOf(tick)}
                  className="stroke-rule"
                  strokeWidth={1}
                />
                <text
                  x={MARGIN.left - 8}
                  y={yOf(tick) + 4}
                  textAnchor="end"
                  className="fill-stone font-mono text-[11px]"
                >
                  {tick}
                </text>
              </g>
            ))}

            {data.map((d, index) => {
              const center = MARGIN.left + slot * (index + 0.5);
              const start = center - groupWidth / 2;
              const showLabel = (data.length - 1 - index) % labelEvery === 0;
              const isFirstOfYear = index === 0 || d.month.endsWith("-01");

              return (
                <g
                  key={d.month}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatMonthLong(d.month)}: ${d.published} publicaciones nuevas y ${d.closed} ventas o alquileres`}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                >
                  {/* hit area: the full height of the month's column */}
                  <rect
                    x={MARGIN.left + slot * index}
                    y={MARGIN.top - 14}
                    width={slot}
                    height={PLOT_HEIGHT + 14}
                    className={cn(
                      active === index ? "fill-ink/[0.06]" : "fill-transparent"
                    )}
                  />

                  {SERIES.map((series, seriesIndex) => {
                    const value = d[series.key];
                    if (value === 0) return null;
                    const x = start + seriesIndex * (barWidth + 2);
                    const barHeight = baseline - yOf(value);
                    const isPeak = peaks[series.key] === index;
                    return (
                      <g key={series.key}>
                        <path
                          d={columnPath(x, baseline, barWidth, barHeight)}
                          className={series.fill}
                        />
                        {isPeak && (
                          <text
                            x={x + barWidth / 2}
                            y={baseline - barHeight - 6}
                            textAnchor="middle"
                            className="fill-ink font-mono text-[11px] font-medium"
                          >
                            {value}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {showLabel && (
                    <text
                      x={center}
                      y={baseline + 17}
                      textAnchor="middle"
                      className="fill-stone font-mono text-[11px]"
                    >
                      {formatMonthShort(d.month)}
                      {isFirstOfYear && (
                        <tspan x={center} dy="13" className="fill-graphite">
                          {d.month.slice(0, 4)}
                        </tspan>
                      )}
                    </text>
                  )}
                </g>
              );
            })}

            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={baseline}
              y2={baseline}
              className="stroke-rule-strong"
              strokeWidth={1}
            />
          </svg>

          {activeRow && (
            <div
              role="status"
              style={{ left: tipLeft, top: 0 }}
              className={cn(
                "pointer-events-none absolute z-10 w-52 border border-ink bg-sheet px-3 py-2 text-[13px]",
                !tipOnRight && "-translate-x-full"
              )}
            >
              <p className="font-medium first-letter:uppercase">
                {formatMonthLong(activeRow.month)}
              </p>
              {SERIES.map((series) => (
                <p
                  key={series.key}
                  className="mt-1 flex items-center justify-between gap-3 text-graphite"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={cn("size-2", series.swatch)} />
                    {series.label}
                  </span>
                  <span className="font-mono text-ink">
                    {activeRow[series.key]}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --- shared pieces -------------------------------------------------------------

function ChartHeader({
  id,
  title,
  note,
  asTable,
  onToggle,
}: {
  id: string;
  title: string;
  note?: string;
  asTable: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 id={id} className="text-xl">
          {title}
        </h2>
        {note && <p className="mt-1 text-[13px] text-stone">{note}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={asTable}
        className="shrink-0 text-[13px] text-graphite underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink"
      >
        {asTable ? "Ver gráfico" : "Ver como tabla"}
      </button>
    </div>
  );
}

function DataTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink text-left">
            {head.map((cell, index) => (
              <th
                key={cell}
                scope="col"
                className={cn(
                  "py-2 pr-4 font-medium",
                  index > 0 && "text-right"
                )}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-rule">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={cn(
                    "py-2 pr-4",
                    index > 0
                      ? "text-right font-mono tabular-nums"
                      : "first-letter:uppercase"
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
