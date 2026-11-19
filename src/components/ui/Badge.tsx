import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  brand: "bg-brand-100 text-brand-800",
  neutral: "bg-slate-100 text-slate-700",
  warning: "bg-amber-100 text-amber-800",
  dark: "bg-slate-900/80 text-white",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
