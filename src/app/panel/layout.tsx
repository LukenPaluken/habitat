import { PanelShell } from "@/components/panel/PanelShell";

// Everything under /panel: the seller's screens, behind a session.
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PanelShell>{children}</PanelShell>;
}
