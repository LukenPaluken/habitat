import { Star } from "lucide-react";
import { useId, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

const STARS = [1, 2, 3, 4, 5];

/** Read-only stars: `value` rounded to the nearest whole star. */
export function StarRating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const filled = Math.round(value);

  return (
    <span
      role="img"
      aria-label={`${value} de 5 estrellas`}
      className={cn("inline-flex gap-0.5", className)}
    >
      {STARS.map((star) => (
        <Star
          key={star}
          aria-hidden
          className={cn(
            "size-4",
            star <= filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
    </span>
  );
}

interface StarRatingInputProps {
  label: string;
  name: string;
  /** "" while nothing is chosen, otherwise "1" to "5". */
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

/**
 * Pick 1 to 5 stars. They are real radio buttons (hidden, but focusable), so
 * the arrow keys and screen readers work without any extra code.
 */
export function StarRatingInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
}: StarRatingInputProps) {
  const errorId = useId();
  const selected = Number(value) || 0;

  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">
        {label}
      </legend>
      <div className="flex gap-1">
        {STARS.map((star) => (
          <label
            key={star}
            className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600"
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={selected === star}
              onChange={onChange}
              onBlur={onBlur}
              className="sr-only"
            />
            <span className="sr-only">
              {star} {star === 1 ? "estrella" : "estrellas"}
            </span>
            <Star
              aria-hidden
              className={cn(
                "size-8 transition-colors",
                star <= selected
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300 hover:text-amber-300"
              )}
            />
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
