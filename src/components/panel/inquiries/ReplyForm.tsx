import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { onConflict } from "@/lib/api/client";
import { replyToComment } from "@/lib/api/inquiries";
import type { ReceivedComment } from "@/types/api";

const INITIAL = { reply: "" };

function validate({ reply }: typeof INITIAL) {
  if (!reply.trim()) return { reply: "Escribí tu respuesta." };
  if (reply.trim().length > 2000) return { reply: "Máximo 2000 caracteres." };
  return {};
}

/** Answers one question, once: a second reply is refused by the API (409). */
export function ReplyForm({
  commentId,
  authorName,
  onReplied,
  onStale,
}: {
  commentId: string;
  authorName: string;
  /** The saved comment, with its reply. */
  onReplied: (comment: ReceivedComment) => void;
  /** Someone else replied first (409): the list is stale. */
  onStale: () => void;
}) {
  const form = useForm(INITIAL, validate);
  const reply = useAction(
    (text: string) => replyToComment(commentId, text),
    (error) => error.status === 409 && onStale()
  );

  const submit = form.handleSubmit(async ({ reply: text }) => {
    const saved = await reply.run(text.trim());
    if (saved) onReplied(saved);
  });

  const alreadyAnswered = reply.error?.status === 409;

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <TextAreaField
        label={`Responder a ${authorName}`}
        name="reply"
        value={form.values.reply}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={form.errorOf("reply")}
        rows={2}
      />
      {reply.error && (
        <p role="alert" className="text-sm text-red-600">
          {onConflict(reply.error, "Esta consulta ya fue respondida.")}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          isLoading={reply.isPending}
          disabled={alreadyAnswered}
        >
          <Send aria-hidden className="size-4" />
          Responder
        </Button>
      </div>
    </form>
  );
}
