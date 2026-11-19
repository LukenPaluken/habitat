import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { PropertyDetail } from "@/types/api";
import { VisitForm } from "./VisitForm";

/** "Pedir visita": opens the request form in a dialog. */
export function VisitRequestButton({ property }: { property: PropertyDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <CalendarPlus aria-hidden className="size-5" />
        Pedir una visita
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Pedir una visita"
      >
        <VisitForm
          propertyId={property.id}
          agencyName={property.agency.fantasyName}
          agencyPhone={property.agency.phone}
          onDone={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
