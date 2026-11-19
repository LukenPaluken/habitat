import { z } from "zod";
import {
  combinedSearchQuerySchema,
  listQuerySchema,
  minCountParam,
  neighborhoodParam,
  operationParam,
  priceQuerySchema,
  searchTextQuerySchema,
  tagsQuerySchema,
  typeAndOperationParams,
  typeOperationAndNeighborhoodParams,
  typeParam,
} from "@/lib/validations/property-search";
import * as searchService from "@/services/property-search.service";
import { handler, paginated, queryOf, queryValuesOf, uuidParam } from "./http";

// CONTROLLER layer: the public property searches. ONE endpoint per filter, plus
// two combos for the searches that repeat the most. Every endpoint is public,
// only returns PUBLICADA properties and accepts `?page=&limit=&sort=`.
//
//   GET /api/properties                                   all, or any combination of filters
//   GET /api/properties/type/:type                       Casa | Departamento | Terreno | Local
//   GET /api/properties/operation/:operation              Venta | Alquiler
//   GET /api/properties/neighborhood/:neighborhood        contains, case-insensitive
//   GET /api/properties/price?currency=&min=&max=
//   GET /api/properties/rooms/:min                        N or more
//   GET /api/properties/bedrooms/:min                     N or more
//   GET /api/properties/bathrooms/:min                    N or more
//   GET /api/properties/tags?tag=a&tag=b                  has all the tags
//   GET /api/properties/search?q=                         title or description
//   GET /api/agencies/:id/properties                      one agency's listings
//   -- combos --
//   GET /api/properties/type/:type/operation/:operation
//   GET /api/properties/type/:type/operation/:operation/neighborhood/:neighborhood

const listing = (request: Request) => listQuerySchema.parse(queryOf(request));

// GET /api/properties: everything published, optionally narrowed by ANY
// combination of filters (the Home page). With no filter it is a plain listing.
export const listAll = handler(async (request) => {
  const { page, limit, sort, tag, ...query } = combinedSearchQuerySchema.parse({
    ...queryOf(request),
    tag: queryValuesOf(request, "tag"),
  });

  return paginated(
    await searchService.searchPublished(
      {
        propertyType: query.type,
        operationType: query.operation,
        text: query.q,
        neighborhood: query.neighborhood,
        currency: query.currency,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        minRooms: query.rooms,
        tags: tag,
      },
      { page, limit, sort }
    )
  );
});

export const byType = handler<{ type: string }>(async (request, { params }) => {
  const type = typeParam.parse((await params).type);
  return paginated(await searchService.byType(type, listing(request)));
});

export const byOperation = handler<{ operation: string }>(
  async (request, { params }) => {
    const operation = operationParam.parse((await params).operation);
    return paginated(
      await searchService.byOperation(operation, listing(request))
    );
  }
);

export const byNeighborhood = handler<{ neighborhood: string }>(
  async (request, { params }) => {
    const neighborhood = neighborhoodParam.parse((await params).neighborhood);
    return paginated(
      await searchService.byNeighborhood(neighborhood, listing(request))
    );
  }
);

export const byPrice = handler(async (request) => {
  const range = priceQuerySchema.parse(queryOf(request));
  return paginated(await searchService.byPriceRange(range, listing(request)));
});

export const byRooms = handler<{ min: string }>(async (request, { params }) => {
  const min = minCountParam.parse((await params).min);
  return paginated(await searchService.byMinRooms(min, listing(request)));
});

export const byBedrooms = handler<{ min: string }>(
  async (request, { params }) => {
    const min = minCountParam.parse((await params).min);
    return paginated(await searchService.byMinBedrooms(min, listing(request)));
  }
);

export const byBathrooms = handler<{ min: string }>(
  async (request, { params }) => {
    const min = minCountParam.parse((await params).min);
    return paginated(await searchService.byMinBathrooms(min, listing(request)));
  }
);

export const byTags = handler(async (request) => {
  const { tag } = tagsQuerySchema.parse({
    tag: queryValuesOf(request, "tag"),
  });
  return paginated(await searchService.byTags(tag, listing(request)));
});

export const byText = handler(async (request) => {
  const { q } = searchTextQuerySchema.parse(queryOf(request));
  return paginated(await searchService.byText(q, listing(request)));
});

export const byAgency = handler<{ id: string }>(async (request, { params }) => {
  const agencyId = uuidParam((await params).id);
  return paginated(await searchService.byAgency(agencyId, listing(request)));
});

// --- combos -----------------------------------------------------------------

export const byTypeAndOperation = handler<
  z.input<typeof typeAndOperationParams>
>(async (request, { params }) => {
  const { type, operation } = typeAndOperationParams.parse(await params);
  return paginated(
    await searchService.byTypeAndOperation(
      { propertyType: type, operationType: operation },
      listing(request)
    )
  );
});

export const byTypeOperationAndNeighborhood = handler<
  z.input<typeof typeOperationAndNeighborhoodParams>
>(async (request, { params }) => {
  const { type, operation, neighborhood } =
    typeOperationAndNeighborhoodParams.parse(await params);
  return paginated(
    await searchService.byTypeOperationAndNeighborhood(
      { propertyType: type, operationType: operation, neighborhood },
      listing(request)
    )
  );
});
