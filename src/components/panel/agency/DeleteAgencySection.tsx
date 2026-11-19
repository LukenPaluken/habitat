import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAction } from "@/hooks/useAction";
import { deleteOwnAgency } from "@/lib/api/agencies";
import { onConflict } from "@/lib/api/client";
import { usePanel } from "../PanelContext";

/** Deleting the agency is final, and the API refuses it while something is live. */
export function DeleteAgencySection() {
  const { agency, logout } = usePanel();
  const [open, setOpen] = useState(false);
  const remove = useAction(async () => {
    await deleteOwnAgency();
    return true;
  });

  async function confirm() {
    if (await remove.run(undefined)) logout();
  }

  // The API refuses while something is live; the reason is shown, not hidden.
  const reason =
    remove.error &&
    onConflict(
      remove.error,
      "No podés eliminar la inmobiliaria mientras tenga propiedades publicadas o reservadas. Pausalas o dalas de baja primero."
    );

  return (
    <section
      aria-labelledby="danger"
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-5"
    >
      <h2 id="danger" className="text-lg font-semibold text-red-800">
        Zona de peligro
      </h2>
      <p className="text-sm text-slate-700">
        Eliminar la inmobiliaria borra su sitio, sus propiedades, consultas y
        reseñas. No se puede deshacer.
      </p>
      <Button
        variant="secondary"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden className="size-4" />
        Eliminar inmobiliaria
      </Button>
      <ConfirmDialog
        open={open}
        title="Eliminar inmobiliaria"
        message={`¿Seguro que querés eliminar "${agency.fantasyName}"? Se borra todo lo que tiene y no se puede deshacer.`}
        confirmLabel="Eliminar definitivamente"
        isLoading={remove.isPending}
        error={reason}
        onConfirm={() => void confirm()}
        onCancel={() => {
          setOpen(false);
          remove.reset();
        }}
      />
    </section>
  );
}
