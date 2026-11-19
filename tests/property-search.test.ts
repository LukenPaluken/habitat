import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { PropertySort } from "@/models";
import { combinedSearchQuerySchema } from "@/lib/validations/property-search";
import * as propertyService from "@/services/property.service";
import * as searchService from "@/services/property-search.service";
import { cleanUp, createProperty, createSeller, unique } from "./helpers";

afterAll(cleanUp);

// Every property of this file lives in its own neighbourhood: filtering by it
// isolates them from whatever else is in the database.
const zone = unique("Zona");
const everything = { page: 1, limit: 50, sort: "price_asc" as PropertySort };
const titles = async (
  filters: Parameters<typeof searchService.searchPublished>[0],
  sort = everything
) =>
  (
    await searchService.searchPublished(
      { neighborhood: zone, ...filters },
      sort
    )
  ).items.map((p) => p.title);

beforeAll(async () => {
  const { agency } = await createSeller();
  const base = { neighborhood: zone, status: "PUBLICADA" as const };
  await createProperty(agency.id, {
    ...base,
    title: "casa-venta-usd",
    propertyType: "Casa",
    operationType: "Venta",
    price: "150000",
    currency: "USD",
    rooms: 4,
    tags: ["pileta", "cochera"],
    description: "Con pileta enorme",
  });
  await createProperty(agency.id, {
    ...base,
    title: "depto-alquiler-ars",
    propertyType: "Departamento",
    operationType: "Alquiler",
    price: "500000",
    currency: "ARS",
    rooms: 2,
    tags: ["balcón"],
    totalArea: 40,
    coveredArea: 35,
  });
  await createProperty(agency.id, {
    ...base,
    title: "depto-venta-usd",
    propertyType: "Departamento",
    operationType: "Venta",
    price: "90000",
    currency: "USD",
    rooms: 3,
    tags: ["pileta", "balcón"],
    totalArea: 80,
    coveredArea: 70,
  });
  const draft = await createProperty(agency.id, {
    neighborhood: zone,
    title: "borrador-oculto",
  });
  expect(draft.status).toBe("BORRADOR");
  const paused = await createProperty(agency.id, {
    ...base,
    title: "pausada-oculta",
  });
  await propertyService.changeStatus(agency.id, paused.id, "PAUSADA");
});

describe("combined search", () => {
  it("only lists published properties", async () => {
    expect(await titles({})).toEqual([
      "depto-venta-usd",
      "casa-venta-usd",
      "depto-alquiler-ars",
    ]);
  });

  it("filters by type and by operation, together", async () => {
    expect(await titles({ propertyType: "Departamento" })).toHaveLength(2);
    expect(
      await titles({ propertyType: "Departamento", operationType: "Venta" })
    ).toEqual(["depto-venta-usd"]);
  });

  it("filters by price range inside one currency", async () => {
    expect(await titles({ currency: "USD", minPrice: 100000 })).toEqual([
      "casa-venta-usd",
    ]);
    expect(
      await titles({ currency: "USD", minPrice: 50000, maxPrice: 100000 })
    ).toEqual(["depto-venta-usd"]);
    expect(await titles({ currency: "ARS" })).toEqual(["depto-alquiler-ars"]);
  });

  it("filters by rooms (N or more)", async () => {
    expect((await titles({ minRooms: 3 })).sort()).toEqual([
      "casa-venta-usd",
      "depto-venta-usd",
    ]);
  });

  it("requires ALL the amenities asked for", async () => {
    expect((await titles({ tags: ["pileta"] })).sort()).toEqual([
      "casa-venta-usd",
      "depto-venta-usd",
    ]);
    expect(await titles({ tags: ["pileta", "balcón"] })).toEqual([
      "depto-venta-usd",
    ]);
  });

  it("searches free text in title and description, ignoring case", async () => {
    expect(await titles({ text: "ENORME" })).toEqual(["casa-venta-usd"]);
    expect((await titles({ text: "depto" })).sort()).toEqual([
      "depto-alquiler-ars",
      "depto-venta-usd",
    ]);
  });

  it("combines everything at once", async () => {
    expect(
      await titles({
        propertyType: "Casa",
        operationType: "Venta",
        currency: "USD",
        minPrice: 100000,
        minRooms: 4,
        tags: ["pileta"],
        text: "pileta",
      })
    ).toEqual(["casa-venta-usd"]);
    expect(
      await titles({ propertyType: "Casa", operationType: "Alquiler" })
    ).toHaveLength(0);
  });

  it("sorts by price and by surface", async () => {
    expect(
      await titles({ currency: "USD" }, { ...everything, sort: "price_desc" })
    ).toEqual(["casa-venta-usd", "depto-venta-usd"]);
    expect(await titles({}, { ...everything, sort: "area_asc" })).toEqual([
      "depto-alquiler-ars", // 40 m²
      "casa-venta-usd", // 60 m²
      "depto-venta-usd", // 80 m²
    ]);
  });

  it("pages the results and reports the total", async () => {
    const first = await searchService.searchPublished(
      { neighborhood: zone },
      { page: 1, limit: 2, sort: "price_asc" }
    );
    const second = await searchService.searchPublished(
      { neighborhood: zone },
      { page: 2, limit: 2, sort: "price_asc" }
    );

    expect(first.total).toBe(3);
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(second.page).toBe(2);
  });
});

describe("the query string of GET /api/properties", () => {
  it("treats empty values as no filter", () => {
    const parsed = combinedSearchQuerySchema.parse({
      type: "",
      operation: "",
      q: "",
      rooms: "",
      minPrice: "",
      tag: [],
    });
    expect(parsed.type).toBeUndefined();
    expect(parsed.minPrice).toBeUndefined();
  });

  it("accepts the type in any case", () => {
    expect(combinedSearchQuerySchema.parse({ type: "casa" }).type).toBe("Casa");
  });

  it("needs a currency for a price range, and min <= max", () => {
    expect(
      combinedSearchQuerySchema.safeParse({ minPrice: "100" }).success
    ).toBe(false);
    expect(
      combinedSearchQuerySchema.safeParse({
        currency: "USD",
        minPrice: "500",
        maxPrice: "100",
      }).success
    ).toBe(false);
    expect(
      combinedSearchQuerySchema.safeParse({
        currency: "USD",
        minPrice: "100",
        maxPrice: "500",
      }).success
    ).toBe(true);
  });

  it("refuses a free-text search that is too short, or an unknown type", () => {
    expect(combinedSearchQuerySchema.safeParse({ q: "a" }).success).toBe(false);
    expect(
      combinedSearchQuerySchema.safeParse({ type: "Mansion" }).success
    ).toBe(false);
  });
});
