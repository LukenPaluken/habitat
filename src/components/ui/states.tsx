import { cn } from "@/lib/cn";
import { Button } from "./button";

/** Placeholder de carga: filas con el mismo ritmo que las reales. */
export function RowsSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn("divide-y divide-rule border-y border-rule", className)}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 py-5">
          <div className="h-16 w-24 shrink-0 animate-pulse bg-rule/70" />
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="h-4 w-2/5 animate-pulse bg-rule/70" />
            <div className="h-3 w-3/5 animate-pulse bg-rule/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-y border-rule px-2 py-14 text-center">
      <p className="font-serif text-xl text-ink">{title}</p>
      {children && (
        <p className="mx-auto mt-2 max-w-md text-sm text-stone">{children}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 border border-brick/40 bg-brick-wash px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-brick-deep">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

/** Aviso dentro de un formulario o panel. */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "warning" ? "alert" : "status"}
      className={cn(
        "border-l-4 px-4 py-3 text-sm",
        tone === "warning"
          ? "border-ochre bg-ochre-wash text-ochre"
          : "border-slate bg-slate-wash text-slate"
      )}
    >
      {children}
    </div>
  );
}
