import { requireAgency } from "@/lib/auth-helper";
import {
  createCommentSchema,
  myCommentsQuerySchema,
  replyCommentSchema,
} from "@/lib/validations/comment";
import * as commentService from "@/services/comment.service";
import {
  created,
  handler,
  ok,
  paginated,
  queryOf,
  readJson,
  uuidParam,
} from "./http";

// CONTROLLER layer: HTTP for comments (public questions and the seller reply).

// POST /api/properties/:id/comments  (public)
export const ask = handler<{ id: string }>(async (request, { params }) => {
  const propertyId = uuidParam((await params).id);
  const input = createCommentSchema.parse(await readJson(request));

  return created(await commentService.ask(propertyId, input));
});

// POST /api/comments/:id/reply
export const reply = handler<{ id: string }>(async (request, { params }) => {
  const commentId = uuidParam((await params).id);
  const { agency } = await requireAgency();
  const { sellerReply } = replyCommentSchema.parse(await readJson(request));

  return ok(await commentService.reply(agency.id, commentId, sellerReply));
});

// GET /api/agencies/me/comments?unanswered=true  ("Consultas" screen)
export const listReceived = handler(async (request) => {
  const { agency } = await requireAgency();
  const { unanswered, ...pagination } = myCommentsQuerySchema.parse(
    queryOf(request)
  );

  const { page, unanswered: pending } = await commentService.listReceived(
    agency.id,
    { unansweredOnly: unanswered },
    pagination
  );
  return paginated(page, { unanswered: pending });
});
