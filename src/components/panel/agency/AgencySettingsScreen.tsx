"use client";

import { useState } from "react";
import { PageHeader } from "../PageHeader";
import { usePanel } from "../PanelContext";
import { AgencyForm } from "./AgencyForm";
import { DeleteAgencySection } from "./DeleteAgencySection";

/** Edit the agency's public data, or delete it. */
export function AgencySettingsScreen() {
  const { agency, reloadAgency } = usePanel();
  // Lives here, not in the form: saving restarts the form (see `key` below).
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Mi inmobiliaria"
        description="Estos datos se ven en tu sitio público."
      />
      {/* `key`: after saving, the form restarts from what the server now has. */}
      <AgencyForm
        key={agency.updatedAt}
        agency={agency}
        onSaved={() => {
          reloadAgency();
          setSaved(true);
        }}
      />
      {saved && (
        <p role="status" className="text-sm font-medium text-brand-700">
          Cambios guardados.
        </p>
      )}
      <DeleteAgencySection />
    </div>
  );
}
