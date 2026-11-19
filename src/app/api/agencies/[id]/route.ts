// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as agencyController from "@/controllers/agency.controller";

export const GET = agencyController.getPublicPage;
export const PUT = agencyController.updateById;
export const PATCH = agencyController.updateById;
export const DELETE = agencyController.deleteById;
