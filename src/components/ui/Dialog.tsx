import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * A modal on top of the native `<dialog>`: the browser already traps focus,
 * closes on Escape and makes the rest of the page inert. We only sync it with
 * the `open` prop and close it when the backdrop is clicked.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // `close` fires for Escape and for `dialog.close()`: keep the parent in sync.
      onClose={onClose}
      // The panel fills the dialog, so a click that lands on the dialog itself
      // is a click on the backdrop.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
