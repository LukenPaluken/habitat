import { SelectField } from "@/components/ui/Fields";
import { SORT_OPTIONS } from "@/lib/property-options";
import type { PropertySort } from "@/types/api";

interface ResultsHeaderProps {
  /** `undefined` until the first answer arrives. */
  total: number | undefined;
  sort: PropertySort;
  onSortChange: (sort: PropertySort) => void;
}

export function ResultsHeader({
  total,
  sort,
  onSortChange,
}: ResultsHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 aria-live="polite" className="text-lg font-semibold text-slate-900">
        {total === undefined
          ? "Buscando propiedades…"
          : `${total} ${total === 1 ? "propiedad" : "propiedades"}`}
      </h2>
      <SelectField
        label="Ordenar por"
        className="w-full sm:w-52"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as PropertySort)}
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
