import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { PaginationParams } from "@/lib/pagination";
import type { CreateCommentInput } from "@/lib/validations/comment";
import * as activityRepository from "@/repositories/activity.repository";
import * as commentRepository from "@/repositories/comment.repository";
import { withTransaction } from "@/repositories/executor";
import * as propertyRepository from "@/repositories/property.repository";

// SERVICE layer: public questions on a property and the seller's single reply.

// Anyone can ask, on any property that is public. That includes VENDIDA,
// ALQUILADA and CANCELADA ones (they keep accepting comments); only drafts are
// invisible.
export async function ask(propertyId: string, input: CreateCommentInput) {
  const property = await propertyRepository.findById(propertyId);
  if (!property || property.status === "BORRADOR") {
    throw new NotFoundError("No encontramos la propiedad.");
  }

  return withTransaction(async (tx) => {
    const comment = await commentRepository.create(
      { propertyId, authorName: input.authorName, content: input.content },
      tx
    );

    await activityRepository.create(
      {
        agencyId: property.agencyId,
        type: "new_comment",
        propertyId,
        referenceId: comment.id,
        content: `${input.authorName} hizo una consulta en "${property.title}".`,
      },
      tx
    );

    return comment;
  });
}

// Public: the questions on a property (drafts don't exist for the public).
export async function listForProperty(
  propertyId: string,
  pagination: PaginationParams
) {
  const property = await propertyRepository.findById(propertyId);
  if (!property || property.status === "BORRADOR") {
    throw new NotFoundError("No encontramos la propiedad.");
  }
  return commentRepository.listByProperty(propertyId, pagination);
}

// One level only: a comment gets a single reply, from the agency that owns the
// property.
export async function reply(
  agencyId: string,
  commentId: string,
  sellerReply: string
) {
  const comment = await commentRepository.findByIdWithProperty(commentId);
  if (!comment) throw new NotFoundError("No encontramos la consulta.");
  if (comment.property.agencyId !== agencyId) {
    throw new ForbiddenError("Esta propiedad no es de tu inmobiliaria.");
  }

  const updated = await commentRepository.setReply(commentId, sellerReply);
  if (!updated) throw new ConflictError("Esta consulta ya fue respondida.");
  return updated;
}

// "Consultas" screen: everything received, plus the pending counter.
export async function listReceived(
  agencyId: string,
  filters: { unansweredOnly: boolean; propertyId?: string },
  pagination: PaginationParams
) {
  const [page, unanswered] = await Promise.all([
    commentRepository.listByAgency(agencyId, filters, pagination),
    commentRepository.countUnansweredByAgency(agencyId),
  ]);
  return { page, unanswered };
}
