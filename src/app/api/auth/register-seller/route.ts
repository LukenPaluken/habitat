// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as authController from "@/controllers/auth.controller";

export const POST = authController.registerSeller;
