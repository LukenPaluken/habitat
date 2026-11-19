import { useEffect, useRef, useState } from "react";

function sameFields(a: Record<string, string>, b: Record<string, string>) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k])
  );
}

/**
 * Text inputs whose value lives somewhere else (here: the URL). The user types
 * into a local `draft` and the rest of the app only hears about it once they
 * stop typing for `delay` ms, so a search doesn't fire on every keystroke.
 *
 * The draft is also kept in line with `committed`, so Back / "Limpiar filtros"
 * update what the inputs show, without clobbering what the user is typing.
 */
export function useDebouncedFields<T extends Record<string, string>>(
  committed: T,
  onCommit: (draft: T) => void,
  {
    isValid = () => true,
    delay = 400,
  }: { isValid?: (draft: T) => boolean; delay?: number } = {}
) {
  const [draft, setDraft] = useState(committed);
  const [seen, setSeen] = useState(committed); // `committed` as of the last render
  const [sent, setSent] = useState(committed); // the last draft this hook committed

  // The countdown fires later: it must call the latest `onCommit` / `isValid`.
  const latest = useRef({ onCommit, isValid });
  useEffect(() => {
    latest.current = { onCommit, isValid };
  });

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []); // cleanup on unmount

  // The committed value changed. If it is the echo of our own commit, there is
  // nothing to do; otherwise somebody else changed it (Back, clear...): follow it.
  if (!sameFields(committed, seen)) {
    setSeen(committed);
    if (!sameFields(committed, sent)) {
      setDraft(committed);
      setSent(committed);
    }
  }

  // Every keystroke restarts the countdown; only the last one gets to commit.
  function setField(name: keyof T, value: string) {
    const next = { ...draft, [name]: value };
    setDraft(next);

    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!latest.current.isValid(next)) return;
      setSent(next);
      latest.current.onCommit(next);
    }, delay);
  }

  return [draft, setField] as const;
}
