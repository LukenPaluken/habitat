// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as agencyController from "@/controllers/agency.controller";

export const GET = agencyController.getOwn;
export const PATCH = agencyController.updateOwn;
export const DELETE = agencyController.deleteOwn;
