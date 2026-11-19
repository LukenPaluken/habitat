import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Fields";
import { useDebouncedFields } from "@/hooks/useDebouncedFields";
import { validateSearchText } from "@/lib/property-filters";

interface SearchBarProps {
  /** The search text currently applied (from the URL). */
  value: string;
  onSearch: (text: string) => void;
  activeFilters: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filtersId: string;
}

/** Free-text search plus, on phones only, the button that opens the filters. */
export function SearchBar({
  value,
  onSearch,
  activeFilters,
  filtersOpen,
  onToggleFilters,
  filtersId,
}: SearchBarProps) {
  const [draft, setField] = useDebouncedFields(
    { q: value },
    ({ q }) => onSearch(q.trim()),
    { isValid: ({ q }) => !validateSearchText(q) }
  );

  return (
    <div className="flex items-start gap-3">
      <TextField
        label="Buscar propiedades"
        hideLabel
        className="flex-1"
        type="search"
        name="q"
        placeholder="Buscar propiedades…"
        icon={<Search aria-hidden className="size-5" />}
        value={draft.q}
        onChange={(event) => setField("q", event.target.value)}
        error={validateSearchText(draft.q)}
        maxLength={100}
      />
      <Button
        variant="secondary"
        className="shrink-0 md:hidden"
        aria-expanded={filtersOpen}
        aria-controls={filtersId}
        onClick={onToggleFilters}
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        Filtros{activeFilters > 0 && ` (${activeFilters})`}
      </Button>
    </div>
  );
}
