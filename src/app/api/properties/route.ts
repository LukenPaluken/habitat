// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as searchController from "@/controllers/property-search.controller";
import * as propertyController from "@/controllers/property.controller";

export const GET = searchController.listAll;
export const POST = propertyController.create;
