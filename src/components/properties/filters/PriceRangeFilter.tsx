import { SelectField, TextField } from "@/components/ui/Fields";
import { useDebouncedFields } from "@/hooks/useDebouncedFields";
import { CURRENCIES } from "@/lib/property-options";
import {
  validatePriceRange,
  type PropertyFilters,
} from "@/lib/property-filters";
import type { Currency } from "@/types/api";

interface PriceRangeFilterProps {
  filters: Pick<PropertyFilters, "currency" | "minPrice" | "maxPrice">;
  onChange: (patch: Partial<PropertyFilters>) => void;
}

const rangeIsValid = (min: string, max: string) =>
  Object.keys(validatePriceRange(min, max)).length === 0;

/**
 * Currency, and a price range in that currency. The currency filters on its
 * own ("only properties priced in ARS"); the range needs one, so while there
 * is none the typed prices wait (with a message) instead of being searched.
 */
export function PriceRangeFilter({ filters, onChange }: PriceRangeFilterProps) {
  const hasCurrency = filters.currency !== "";

  const [draft, setField] = useDebouncedFields(
    { minPrice: filters.minPrice, maxPrice: filters.maxPrice },
    (next) =>
      onChange({
        minPrice: next.minPrice.trim(),
        maxPrice: next.maxPrice.trim(),
      }),
    {
      isValid: ({ minPrice, maxPrice }) =>
        rangeIsValid(minPrice, maxPrice) &&
        (hasCurrency || (!minPrice.trim() && !maxPrice.trim())),
    }
  );
  const errors = validatePriceRange(draft.minPrice, draft.maxPrice);
  const needsCurrency =
    !hasCurrency &&
    (draft.minPrice.trim() !== "" || draft.maxPrice.trim() !== "");

  function changeCurrency(currency: Currency | "") {
    if (currency === "") {
      // No currency, no range: a price means nothing without one.
      onChange({ currency, minPrice: "", maxPrice: "" });
    } else if (rangeIsValid(draft.minPrice, draft.maxPrice)) {
      // Applies the range that was waiting for a currency, if there was one.
      onChange({
        currency,
        minPrice: draft.minPrice.trim(),
        maxPrice: draft.maxPrice.trim(),
      });
    } else {
      onChange({ currency });
    }
  }

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Moneda y precio</legend>
      <div className="grid grid-cols-[6rem_1fr_1fr] items-start gap-3">
        <SelectField
          label="Moneda"
          value={filters.currency}
          onChange={(event) =>
            changeCurrency(event.target.value as Currency | "")
          }
        >
          <option value="">Todas</option>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Precio mínimo"
          name="minPrice"
          inputMode="decimal"
          placeholder="Mínimo"
          value={draft.minPrice}
          onChange={(event) => setField("minPrice", event.target.value)}
          error={errors.min}
        />
        <TextField
          label="Precio máximo"
          name="maxPrice"
          inputMode="decimal"
          placeholder="Máximo"
          value={draft.maxPrice}
          onChange={(event) => setField("maxPrice", event.target.value)}
          error={errors.max}
        />
      </div>
      {needsCurrency && (
        <p role="alert" className="mt-1.5 text-sm text-red-600">
          Elegí una moneda para filtrar por precio.
        </p>
      )}
    </fieldset>
  );
}
