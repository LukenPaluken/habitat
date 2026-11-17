"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { SUGGESTED_TAGS } from "@/lib/property-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

/** Multi-selección de amenities: sugeridos + los que sume el vendedor. */
export function TagPicker({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const options = Array.from(new Set([...SUGGESTED_TAGS, ...value]));

  function toggle(tag: string) {
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]
    );
  }

  function addDraft() {
    const tag = draft.trim().toLowerCase().slice(0, 40);
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Amenities" className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const selected = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(tag)}
              className={cn(
                "border px-3 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed",
                selected
                  ? "border-ink bg-ink text-sheet"
                  : "border-rule-strong bg-sheet text-graphite hover:border-ink hover:text-ink disabled:hover:border-rule-strong disabled:hover:text-graphite"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {!disabled && (
        <div className="flex max-w-sm gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addDraft();
              }
            }}
            placeholder="Otro amenity…"
            aria-label="Agregar otro amenity"
            maxLength={40}
          />
          <Button variant="outline" onClick={addDraft} disabled={!draft.trim()}>
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}
