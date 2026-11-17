import { cn } from "@/lib/cn";

type Variant = "primary" | "ink" | "outline" | "ghost" | "danger" | "link";
type Size = "sm" | "md";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-brick text-sheet hover:bg-brick-deep",
  ink: "bg-ink text-sheet hover:bg-graphite",
  outline:
    "border border-rule-strong bg-sheet text-ink hover:border-ink hover:bg-paper",
  ghost: "text-graphite hover:bg-rule/60",
  danger:
    "border border-brick/50 bg-sheet text-brick hover:border-brick hover:bg-brick-wash",
  link: "h-auto px-0 text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function buttonClasses({
  variant = "outline",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    base,
    variants[variant],
    variant !== "link" && sizes[size],
    className
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      )}
    />
  );
}

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "outline",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
