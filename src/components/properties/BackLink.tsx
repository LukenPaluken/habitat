import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * "← Volver". Goes back in the history when there is one, so the listing
 * comes back with its filters and page; otherwise (a shared link opened in a
 * new tab) it goes to the listing.
 */
export function BackLink() {
  const router = useRouter();

  return (
    <Link
      href="/"
      onClick={(event) => {
        if (window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Volver
    </Link>
  );
}
