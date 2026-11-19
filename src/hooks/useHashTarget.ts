import { useEffect, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const readHash = () => window.location.hash;
// The hash never reaches the server: there, nothing is targeted.
const readServerHash = () => "";

/**
 * The item named by the URL's `#hash` (e.g. `#consulta-<id>` from the activity
 * feed). Lists load after the page does, so the browser's own jump to the hash
 * finds nothing: once `ready`, this scrolls to the item. Returns its id so the
 * list can highlight it.
 */
export function useHashTarget(ready: boolean): string | null {
  const hash = useSyncExternalStore(subscribe, readHash, readServerHash);
  const targetId = decodeURIComponent(hash.slice(1)) || null;

  useEffect(() => {
    if (!ready || !targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ block: "center" });
  }, [ready, targetId]);

  return targetId;
}
