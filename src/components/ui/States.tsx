import type { LucideIcon } from "lucide-react";
import { AlertTriangle, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

// The three situations every list or section can be in besides "showing data".
// Using these everywhere keeps loading / empty / error looking the same.

const frame =
  "flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center";

/** A spinner with a message, for a section that has no skeleton of its own. */
export function LoadingState({
  label = "Cargando…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-center gap-3 py-12 text-slate-500",
        className
      )}
    >
      <Spinner className="size-5" />
      <span>{label}</span>
    </div>
  );
}

/** Nothing to show (yet): says so and, when it can, what to do about it. */
export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(frame, className)}>
      <Icon aria-hidden className="size-10 text-slate-400" />
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="max-w-md text-sm text-slate-600">{description}</p>
      )}
      {action}
    </div>
  );
}

/** The request failed: shows why and offers to try again. */
export function ErrorState({
  title = "No pudimos cargar esto",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(frame, "border-red-200 bg-red-50", className)}
    >
      <AlertTriangle aria-hidden className="size-10 text-red-500" />
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="max-w-md text-sm text-slate-700">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
