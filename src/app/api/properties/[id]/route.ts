// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as propertyController from "@/controllers/property.controller";

export const GET = propertyController.getById;
export const PATCH = propertyController.update;
