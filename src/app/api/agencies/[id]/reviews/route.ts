// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as reviewController from "@/controllers/review.controller";

export const GET = reviewController.list;
export const POST = reviewController.create;
