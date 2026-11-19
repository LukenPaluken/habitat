import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="No encontramos esta página"
      description="El link puede estar mal escrito o la página ya no existe."
      action={
        <Link href="/" className={buttonStyles()}>
          Volver al inicio
        </Link>
      }
    />
  );
}
