// ROUTING only: maps this URL to a controller action. No logic lives here.
import * as searchController from "@/controllers/property-search.controller";

export const GET = searchController.byText;
