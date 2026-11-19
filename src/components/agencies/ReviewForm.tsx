import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Fields";
import { StarRatingInput } from "@/components/ui/StarRating";
import { useAction } from "@/hooks/useAction";
import { useForm } from "@/hooks/useForm";
import { postReview } from "@/lib/api/agencies";
import type { ReviewInput } from "@/types/api";

const INITIAL = { authorName: "", content: "", rating: "" };
type Values = typeof INITIAL;

function validate({ authorName, content, rating }: Values) {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!authorName.trim()) errors.authorName = "Ingresá tu nombre.";
  else if (authorName.trim().length > 100)
    errors.authorName = "Máximo 100 caracteres.";

  if (!content.trim()) errors.content = "Escribí tu opinión.";
  else if (content.trim().length > 2000)
    errors.content = "Máximo 2000 caracteres.";

  if (!rating) errors.rating = "Elegí una calificación de 1 a 5 estrellas.";
  return errors;
}

/** Anyone can review an agency: a name, an opinion and 1 to 5 stars. */
export function ReviewForm({
  agencyId,
  onPosted,
}: {
  agencyId: string;
  onPosted: () => void;
}) {
  const form = useForm(INITIAL, validate);
  const post = useAction((input: ReviewInput) => postReview(agencyId, input));

  const submit = form.handleSubmit(async ({ authorName, content, rating }) => {
    const review = await post.run({
      authorName: authorName.trim(),
      content: content.trim(),
      rating: Number(rating),
    });
    if (!review) return;
    onPosted();
    form.reset({ authorName }); // the name stays for a second review
  });

  const field = { onChange: form.handleChange, onBlur: form.handleBlur };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField
        label="Tu nombre"
        name="authorName"
        autoComplete="name"
        value={form.values.authorName}
        error={form.errorOf("authorName")}
        {...field}
      />
      <StarRatingInput
        label="Calificación"
        name="rating"
        value={form.values.rating}
        error={form.errorOf("rating")}
        {...field}
      />
      <TextAreaField
        label="Tu opinión"
        name="content"
        placeholder="Contá cómo fue tu experiencia con la inmobiliaria"
        value={form.values.content}
        error={form.errorOf("content")}
        {...field}
      />

      {post.error && (
        <p role="alert" className="text-sm text-red-600">
          {post.error.message}
        </p>
      )}
      {post.isSuccess && form.values.content === "" && (
        <p role="status" className="text-sm text-brand-700">
          ¡Gracias por tu reseña! Ya aparece en la lista.
        </p>
      )}

      <Button type="submit" isLoading={post.isPending}>
        <Send aria-hidden className="size-4" />
        Enviar reseña
      </Button>
    </form>
  );
}
