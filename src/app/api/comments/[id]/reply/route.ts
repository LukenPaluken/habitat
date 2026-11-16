// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as commentController from "@/controllers/comment.controller";

export const POST = commentController.reply;
