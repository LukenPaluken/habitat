// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as activityController from "@/controllers/activity.controller";

export const PATCH = activityController.markAllRead;
