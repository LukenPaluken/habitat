import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { capitalize } from "@/lib/property-options";
import { cn } from "@/lib/utils";
import { amenityOptions } from "./property-form-model";

/** Pick amenities from the usual ones, or add one of your own. */
export function TagsField({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (tag: string) =>
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
    );

  function addCustom() {
    const tag = custom.trim().toLowerCase();
    if (tag && tag.length <= 40 && !selected.includes(tag))
      onChange([...selected, tag]);
    setCustom("");
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-700">Amenities</legend>
      <div className="flex flex-wrap gap-2">
        {amenityOptions(selected).map((tag) => {
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
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="custom-amenity">
          Otro amenity
        </label>
        <input
          id="custom-amenity"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds the amenity instead of submitting the whole form.
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Otro amenity (ej.: gimnasio)"
          maxLength={40}
          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
        <Button
          variant="secondary"
          size="sm"
          className="h-10"
          onClick={addCustom}
        >
          <Plus aria-hidden className="size-4" />
          Agregar
        </Button>
      </div>
    </fieldset>
  );
}
