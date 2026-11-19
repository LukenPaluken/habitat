import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// Form controls with their label and their error message ALWAYS attached:
// `Field` wires label <-> control <-> message (ids, aria-invalid,
// aria-describedby) so every form in the site validates the same way.

interface FieldProps {
  label: string;
  /** Keeps the label for screen readers but not on screen. */
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

interface ControlProps {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

function Field({
  label,
  hideLabel,
  error,
  hint,
  className,
  children,
}: FieldProps & { children: (control: ControlProps) => ReactNode }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-medium text-slate-700",
          hideLabel && "sr-only"
        )}
      >
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? messageId : undefined,
      })}
      {message && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn("text-sm", error ? "text-red-600" : "text-slate-500")}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const controlStyles = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors",
    "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
    hasError ? "border-red-500" : "border-slate-300"
  );

export function TextField({
  label,
  hideLabel,
  error,
  hint,
  className,
  icon,
  trailing,
  ...props
}: FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
    icon?: ReactNode;
    /** Something clickable inside the right edge (e.g. "show password"). */
    trailing?: ReactNode;
  }) {
  return (
    <Field {...{ label, hideLabel, error, hint, className }}>
      {(control) => (
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
              {icon}
            </span>
          )}
          <input
            {...control}
            {...props}
            className={cn(
              controlStyles(!!error),
              "h-11",
              icon && "pl-10",
              trailing && "pr-12"
            )}
          />
          {trailing && (
            <span className="absolute inset-y-0 right-1 flex items-center">
              {trailing}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hideLabel,
  error,
  hint,
  className,
  ...props
}: FieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  return (
    <Field {...{ label, hideLabel, error, hint, className }}>
      {(control) => (
        <textarea
          {...control}
          {...props}
          className={cn(controlStyles(!!error), "min-h-24 resize-y py-2.5")}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  hideLabel,
  error,
  hint,
  className,
  children,
  ...props
}: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  return (
    <Field {...{ label, hideLabel, error, hint, className }}>
      {(control) => (
        <select
          {...control}
          {...props}
          className={cn(controlStyles(!!error), "h-11")}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
