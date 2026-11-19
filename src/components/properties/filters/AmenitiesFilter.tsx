import { Check } from "lucide-react";
import { AMENITIES, capitalize } from "@/lib/property-options";
import { cn } from "@/lib/utils";

interface AmenitiesFilterProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

/** Multi-select chips. The property must have ALL the selected amenities. */
export function AmenitiesFilter({ selected, onChange }: AmenitiesFilterProps) {
  const toggle = (tag: string) =>
    onChange(
      selected.includes(tag)
        ? selected.filter((current) => current !== tag)
        : [...selected, tag]
    );

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">
        Amenities
      </legend>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map((tag) => {
          const isOn = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={isOn}
              onClick={() => toggle(tag)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
                isOn
                  ? "border-brand-600 bg-brand-50 font-medium text-brand-800"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {isOn && <Check aria-hidden className="size-4" />}
              {capitalize(tag)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
