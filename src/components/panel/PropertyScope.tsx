import { X } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

/** "Showing only <property>": a list narrowed from the activity feed, and the way out. */
export function PropertyScope({
  title,
  clearHref,
}: {
  /** The property's title, once the list has loaded. */
  title?: string;
  /** The same screen without the filter. */
  clearHref: string;
}) {
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
      <span className="min-w-0 break-words">
        Mostrando solo{" "}
        <span className="font-semibold">{title ?? "una propiedad"}</span>
      </span>
      <Link href={clearHref} replace className={buttonStyles("ghost", "sm")}>
        <X aria-hidden className="size-4" />
        Ver todas
      </Link>
    </p>
  );
}
