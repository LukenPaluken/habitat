import { redirect } from "next/navigation";
import { PANEL_HOME } from "@/lib/auth-redirect";

// `/panel` has no screen of its own: it opens "Mis propiedades".
export default function PanelIndexPage() {
  redirect(PANEL_HOME);
}
