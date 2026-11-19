"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "./button";
import { Input } from "./field";

// Confirmation for destructive actions: `await confirm({...})` returns true
// or false. Uses the native <dialog> (focus, Escape and inert page for free).

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirmation in the alert color. */
  tone?: "default" | "danger";
  /** If set, this text must be typed to enable the button. */
  requireText?: string;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm necesita <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<Confirm>((next) => {
    setTyped("");
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (options && !element.open) element.showModal();
    if (!options && element.open) element.close();
  }, [options]);

  function settle(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }

  const blocked =
    options?.requireText !== undefined &&
    typed.trim().toLowerCase() !== options.requireText.trim().toLowerCase();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="confirm-title"
        onCancel={(event) => {
          event.preventDefault();
          settle(false);
        }}
        onClick={(event) => {
          if (event.target === dialog.current) settle(false);
        }}
        className="m-auto w-[min(92vw,26rem)] border border-ink bg-sheet p-0 text-ink backdrop:bg-ink/45"
      >
        {options && (
          <form
            method="dialog"
            onSubmit={(event) => {
              event.preventDefault();
              if (!blocked) settle(true);
            }}
            className="flex flex-col gap-4 p-6"
          >
            <h2 id="confirm-title" className="text-xl">
              {options.title}
            </h2>
            {options.description && (
              <div className="text-sm leading-relaxed text-graphite">
                {options.description}
              </div>
            )}
            {options.requireText !== undefined && (
              <label className="flex flex-col gap-1.5 text-[13px] text-graphite">
                <span>
                  Escribí{" "}
                  <strong className="font-semibold text-ink">
                    {options.requireText}
                  </strong>{" "}
                  para confirmar
                </span>
                <Input
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </label>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => settle(false)}>
                {options.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                type="submit"
                variant={options.tone === "danger" ? "primary" : "ink"}
                disabled={blocked}
              >
                {options.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
