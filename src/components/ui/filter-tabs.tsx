import { cn } from "@/lib/cn";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  /** Número chico al lado de la etiqueta (ej. pendientes). */
  count?: number;
}

/** Filtro de una sola opción, como pestañas subrayadas. */
export function FilterTabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    // La línea de base va afuera: así el contenedor que scrollea en horizontal
    // no genera una barra vertical por el solapamiento del subrayado.
    <div className="-mx-4 border-b border-rule sm:mx-0">
      <div
        role="group"
        aria-label={label}
        className="no-scrollbar flex gap-5 overflow-x-auto px-4 sm:px-0"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-sm transition-colors",
                active
                  ? "border-ink font-medium text-ink"
                  : "border-transparent text-stone hover:text-ink"
              )}
            >
              {option.label}
              {option.count !== undefined && option.count > 0 && (
                <span className="bg-brick px-1.5 py-px font-mono text-[11px] leading-4 text-sheet">
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
