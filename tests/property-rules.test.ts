import { afterAll, describe, expect, it } from "bun:test";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  createPropertySchema,
  updatePropertySchema,
} from "@/lib/validations/property";
import * as propertyService from "@/services/property.service";
import * as visitService from "@/services/visit.service";
import { visitRequests } from "@/models";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  cleanUp,
  createProperty,
  createSeller,
  expectError,
  inDays,
  propertyInput,
} from "./helpers";

afterAll(cleanUp);

describe("what a property must satisfy (input shape)", () => {
  const valid = {
    title: "Casa linda",
    description: "Una casa muy linda para vivir",
    propertyType: "Casa",
    operationType: "Venta",
    price: 100,
    address: "Calle 123",
    neighborhood: "Centro",
    totalArea: 100,
  };

  it("accepts a well-formed property", () => {
    expect(createPropertySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a price of 0 or less", () => {
    expect(createPropertySchema.safeParse({ ...valid, price: 0 }).success).toBe(
      false
    );
    expect(
      createPropertySchema.safeParse({ ...valid, price: -5 }).success
    ).toBe(false);
  });

  it("rejects a surface of 0 or less", () => {
    expect(
      createPropertySchema.safeParse({ ...valid, totalArea: 0 }).success
    ).toBe(false);
    expect(
      createPropertySchema.safeParse({ ...valid, coveredArea: -1 }).success
    ).toBe(false);
  });

  it("refuses an edit that sends nothing, or a status", () => {
    expect(updatePropertySchema.safeParse({}).success).toBe(false);
    expect(
      updatePropertySchema.safeParse({ status: "PUBLICADA" }).success
    ).toBe(false);
  });
});

describe("rules between fields", () => {
  it("a Terreno has no rooms, bedrooms, bathrooms or covered area", async () => {
    const { agency } = await createSeller();

    await expectError(
      propertyService.create(
        agency.id,
        propertyInput({
          propertyType: "Terreno",
          rooms: 2,
          coveredArea: null,
          bedrooms: null,
          bathrooms: null,
        })
      ),
      ValidationError
    );

    const land = await propertyService.create(
      agency.id,
      propertyInput({
        propertyType: "Terreno",
        rooms: null,
        coveredArea: null,
        bedrooms: null,
        bathrooms: null,
      })
    );
    expect(land.rooms).toBeNull();
  });

  it("the covered area cannot be bigger than the total", async () => {
    const { agency } = await createSeller();
    await expectError(
      propertyService.create(
        agency.id,
        propertyInput({ totalArea: 50, coveredArea: 80 })
      ),
      ValidationError
    );
  });
});

describe("editing a property", () => {
  it("is only allowed to its owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id);

    await expectError(
      propertyService.update(stranger.agency.id, property.id, {
        title: "Hijacked",
      }),
      ForbiddenError
    );
  });

  it("is blocked once it is sold, rented or cancelled", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    await propertyService.changeStatus(agency.id, property.id, "CANCELADA");

    await expectError(
      propertyService.update(agency.id, property.id, { title: "Too late" }),
      ConflictError
    );
  });

  it("is blocked while a visit is confirmed", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    const visit = await visitService.request(property.id, {
      requesterName: "Ana",
      requesterPhone: "011-4444-4444",
      proposedDate: inDays(3),
    });
    await visitService.changeStatus(agency.id, visit.id, "Confirmada");

    await expectError(
      propertyService.update(agency.id, property.id, { title: "Nope" }),
      ConflictError
    );

    // once the visit is over the property can be edited again
    await db
      .update(visitRequests)
      .set({ status: "Realizada" })
      .where(eq(visitRequests.id, visit.id));
    expect(
      (
        await propertyService.update(agency.id, property.id, {
          title: "Now yes",
        })
      ).title
    ).toBe("Now yes");
  });

  it("changes only what was sent", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { price: "100000" });

    const updated = await propertyService.update(agency.id, property.id, {
      title: "New title",
    });

    expect(updated.title).toBe("New title");
    expect(Number(updated.price)).toBe(100000);
  });
});

describe("drafts", () => {
  it("are invisible to the public and visible to their owner", async () => {
    const { agency } = await createSeller();
    const stranger = await createSeller();
    const draft = await createProperty(agency.id);

    expect((await propertyService.getDetail(draft.id, agency.id)).id).toBe(
      draft.id
    );
    await expectError(propertyService.getDetail(draft.id), NotFoundError);
    await expectError(
      propertyService.getDetail(draft.id, stranger.agency.id),
      NotFoundError
    );
  });
});

describe("deleting a property", () => {
  it("is only possible for a draft, by its owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const draft = await createProperty(owner.agency.id);

    await expectError(
      propertyService.removeDraft(stranger.agency.id, draft.id),
      ForbiddenError
    );
    await propertyService.removeDraft(owner.agency.id, draft.id);

    await expectError(
      propertyService.getDetail(draft.id, owner.agency.id),
      NotFoundError
    );
  });

  it("is refused once the property was published (409): it is closed with CANCELADA instead", async () => {
    const { agency } = await createSeller();
    const published = await createProperty(agency.id, { status: "PUBLICADA" });

    await expectError(
      propertyService.removeDraft(agency.id, published.id),
      ConflictError
    );
    expect(
      (await propertyService.getDetail(published.id, agency.id)).status
    ).toBe("PUBLICADA");
  });
});
