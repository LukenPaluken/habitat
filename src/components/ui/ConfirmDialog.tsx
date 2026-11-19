import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** "danger" for things that can't be undone. */
  tone?: "danger" | "primary";
  isLoading?: boolean;
  /** Why the last attempt failed, shown inside the dialog. */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks "are you sure?" before anything destructive. The caller owns the action
 * (and its loading / error state); this only presents the question.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = "danger",
  isLoading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <div className="space-y-5">
        <p className="text-slate-700">{message}</p>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              tone === "danger"
                ? "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
