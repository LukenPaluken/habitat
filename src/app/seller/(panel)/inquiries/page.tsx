import type { Metadata } from "next";
import { CommentsView } from "@/components/seller/comments-view";

export const metadata: Metadata = { title: "Consultas" };

export default function CommentsPage() {
  return <CommentsView />;
}
