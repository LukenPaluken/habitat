import { FilterX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Fields";
import { useDebouncedFields } from "@/hooks/useDebouncedFields";
import {
  validateSearchText,
  type PropertyFilters,
} from "@/lib/property-filters";
import {
  OPERATIONS,
  PROPERTY_TYPES,
  ROOM_OPTIONS,
} from "@/lib/property-options";
import { cn } from "@/lib/utils";
import type { OperationType, PropertyType } from "@/types/api";
import { AmenitiesFilter } from "./AmenitiesFilter";
import { PriceRangeFilter } from "./PriceRangeFilter";

interface FiltersPanelProps {
  id: string;
  filters: PropertyFilters;
  onChange: (patch: Partial<PropertyFilters>) => void;
  onClear: () => void;
  activeFilters: number;
  /** Phones only: the panel is collapsed until the user opens it. */
  open: boolean;
}

export function FiltersPanel({
  id,
  filters,
  onChange,
  onClear,
  activeFilters,
  open,
}: FiltersPanelProps) {
  const [zone, setZone] = useDebouncedFields(
    { neighborhood: filters.neighborhood },
    ({ neighborhood }) => onChange({ neighborhood: neighborhood.trim() }),
    { isValid: ({ neighborhood }) => !validateSearchText(neighborhood) }
  );

  return (
    <section
      id={id}
      aria-label="Filtros"
      className={cn(
        "space-y-4 rounded-xl border border-slate-200 bg-white p-4 md:block",
        open ? "block" : "hidden"
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Tipo"
          value={filters.type}
          onChange={(event) =>
            onChange({ type: event.target.value as PropertyType | "" })
          }
        >
          <option value="">Todos</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </SelectField>

        <SelectField
          label="Operación"
          value={filters.operation}
          onChange={(event) =>
            onChange({ operation: event.target.value as OperationType | "" })
          }
        >
          <option value="">Todas</option>
          {OPERATIONS.map((operation) => (
            <option key={operation}>{operation}</option>
          ))}
        </SelectField>

        <TextField
          label="Zona"
          name="neighborhood"
          placeholder="Barrio o localidad"
          value={zone.neighborhood}
          onChange={(event) => setZone("neighborhood", event.target.value)}
          error={validateSearchText(zone.neighborhood)}
          maxLength={100}
        />

        <SelectField
          label="Ambientes"
          value={filters.rooms}
          onChange={(event) => onChange({ rooms: event.target.value })}
        >
          <option value="">Cualquiera</option>
          {ROOM_OPTIONS.map((rooms) => (
            <option key={rooms} value={rooms}>
              {rooms}+
            </option>
          ))}
        </SelectField>

        <div className="sm:col-span-2">
          <PriceRangeFilter filters={filters} onChange={onChange} />
        </div>
        <div className="sm:col-span-2">
          <AmenitiesFilter
            selected={filters.tags}
            onChange={(tags) => onChange({ tags })}
          />
        </div>
      </div>

      {activeFilters > 0 && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <FilterX aria-hidden className="size-4" />
          Limpiar filtros
        </Button>
      )}
    </section>
  );
}
