// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as healthController from "@/controllers/health.controller";

export const GET = healthController.check;
