// After logging in the seller goes back to where they were headed (`?next=`).
// That value comes from the URL, so only paths inside the panel are accepted:
// anything else could send them to another site.

export const PANEL_HOME = "/panel/propiedades";

export function safeNext(next: string | null): string {
  if (next && next.startsWith("/panel") && !next.startsWith("//")) return next;
  return PANEL_HOME;
}

export function loginUrlFor(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}
