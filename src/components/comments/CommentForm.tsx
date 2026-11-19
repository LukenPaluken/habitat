import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { askQuestion } from "@/lib/api/properties";
import type { Comment, CommentInput } from "@/types/api";

const INITIAL = { authorName: "", content: "" };
type Values = typeof INITIAL;

function validate({ authorName, content }: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!authorName.trim()) errors.authorName = "Ingresá tu nombre.";
  else if (authorName.trim().length > 100)
    errors.authorName = "Máximo 100 caracteres.";

  if (!content.trim()) errors.content = "Escribí tu consulta.";
  else if (content.trim().length > 2000)
    errors.content = "Máximo 2000 caracteres.";
  return errors;
}

/** Ask the seller something. No account: just a name. */
export function CommentForm({
  propertyId,
  onPosted,
}: {
  propertyId: string;
  onPosted: (comment: Comment) => void;
}) {
  const form = useForm(INITIAL, validate);
  const ask = useAction((input: CommentInput) =>
    askQuestion(propertyId, input)
  );

  const submit = form.handleSubmit(async ({ authorName, content }) => {
    const comment = await ask.run({
      authorName: authorName.trim(),
      content: content.trim(),
    });
    if (!comment) return;
    onPosted(comment);
    form.reset({ authorName }); // the name stays for a second question
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        label="Tu nombre"
        name="authorName"
        autoComplete="name"
        value={form.values.authorName}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={form.errorOf("authorName")}
      />
      <TextAreaField
        label="Tu consulta"
        name="content"
        placeholder="Ej.: ¿Admite mascotas?"
        value={form.values.content}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={form.errorOf("content")}
      />

      {ask.error && (
        <p role="alert" className="text-sm text-red-600">
          {ask.error.message}
        </p>
      )}
      {ask.isSuccess && form.values.content === "" && (
        <p role="status" className="text-sm text-brand-700">
          ¡Gracias! Tu consulta ya aparece arriba; la inmobiliaria la va a
          responder acá mismo.
        </p>
      )}

      <Button type="submit" isLoading={ask.isPending}>
        <Send aria-hidden className="size-4" />
        Enviar consulta
      </Button>
    </form>
  );
}
