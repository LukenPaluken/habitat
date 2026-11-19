import { useEffect, useRef } from "react";

/**
 * Runs `callback` every `intervalMs` for as long as the component is on screen.
 * The interval is cleared on unmount, so leaving the panel (or logging out)
 * leaves nothing running. Always calls the latest `callback`.
 */
export function usePolling(callback: () => void, intervalMs: number) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });

  useEffect(() => {
    const id = setInterval(() => latest.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
