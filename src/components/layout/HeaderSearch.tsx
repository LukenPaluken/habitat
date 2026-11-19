"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { buttonStyles } from "@/components/ui/Button";
import { validateSearchText } from "@/lib/property-filters";
import { cn } from "@/lib/utils";

/**
 * The search box of the public header: it takes the visitor to the listing
 * with that text. It searches on submit (Enter), never on every key. Hidden on
 * the listing itself, which has its own, and inside the seller's panel.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (pathname === "/" || pathname.startsWith("/panel")) return null;

  // Said once they try to search, not while they are still typing.
  const problem = submitted ? validateSearchText(text) : undefined;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = text.trim();
    setSubmitted(true);
    if (validateSearchText(q)) return;
    setSubmitted(false);
    router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <>
      {/* Phones: no room for a box, the listing has one. */}
      <Link
        href="/"
        aria-label="Buscar propiedades"
        className={cn(buttonStyles("ghost", "sm"), "sm:hidden")}
      >
        <Search aria-hidden className="size-5" />
      </Link>

      <form
        role="search"
        onSubmit={submit}
        className="relative hidden max-w-sm flex-1 sm:block"
      >
        <label htmlFor="header-search" className="sr-only">
          Buscar propiedades
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        />
        <input
          id="header-search"
          type="search"
          name="q"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Buscar propiedades…"
          maxLength={100}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? "header-search-error" : undefined}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 aria-[invalid]:border-red-400"
        />
        {problem && (
          <p
            id="header-search-error"
            role="alert"
            className="absolute left-0 top-full mt-1 rounded bg-white px-2 py-1 text-xs text-red-600 shadow"
          >
            {problem}
          </p>
        )}
      </form>
    </>
  );
}
