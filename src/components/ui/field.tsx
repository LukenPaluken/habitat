"use client";

import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// Campos de formulario. `Field` junta etiqueta, ayuda y error y le pasa a su
// hijo los ids correctos para que el lector de pantalla los lea juntos.

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
  children: (control: {
    id: string;
    "aria-invalid": boolean | undefined;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}

export function Field({
  label,
  error,
  hint,
  optional,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const describedBy = error || hint ? messageId : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-stone">(opcional)</span>
        )}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <p id={messageId} role="alert" className="text-[13px] text-brick">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-[13px] text-stone">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const control =
  "w-full border bg-sheet px-3 text-ink placeholder:text-stone/70 transition-colors hover:border-ink/60 disabled:cursor-not-allowed disabled:bg-paper disabled:text-stone aria-[invalid=true]:border-brick";
const controlBorder = "border-rule-strong";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(control, controlBorder, "h-10", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        control,
        controlBorder,
        "min-h-24 resize-y py-2.5",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          control,
          controlBorder,
          "h-10 cursor-pointer appearance-none pr-9",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone"
      />
    </div>
  );
}

/** Opciones excluyentes en una sola fila (Venta / Alquiler, ARS / USD). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex">
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed",
              index > 0 && "-ml-px",
              active
                ? "relative z-10 border-ink bg-ink text-sheet"
                : "border-rule-strong bg-sheet text-graphite hover:border-ink/60 hover:text-ink disabled:hover:border-rule-strong"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
