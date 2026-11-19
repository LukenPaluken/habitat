import { afterAll, describe, expect, it } from "bun:test";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { errorResponse } from "@/controllers/http";
import { allowedTransitions } from "@/lib/property-lifecycle";
import * as propertyService from "@/services/property.service";
import { cleanUp, createProperty, createSeller, expectError } from "./helpers";

afterAll(cleanUp);

describe("which moves the lifecycle allows", () => {
  it("only offers VENDIDA for a Venta and ALQUILADA for an Alquiler", () => {
    expect(
      allowedTransitions({ status: "RESERVADA", operationType: "Venta" })
    ).toEqual(["VENDIDA", "CANCELADA"]);
    expect(
      allowedTransitions({ status: "RESERVADA", operationType: "Alquiler" })
    ).toEqual(["ALQUILADA", "CANCELADA"]);
  });

  it("offers nothing from a closed state", () => {
    for (const status of ["VENDIDA", "ALQUILADA", "CANCELADA"] as const) {
      expect(
        allowedTransitions({ status, operationType: "Venta" })
      ).toHaveLength(0);
    }
  });
});

describe("changing the status of a property", () => {
  it("follows BORRADOR -> PUBLICADA -> RESERVADA -> VENDIDA", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);

    for (const next of ["PUBLICADA", "RESERVADA", "VENDIDA"] as const) {
      const changed = await propertyService.changeStatus(
        agency.id,
        property.id,
        next
      );
      expect(changed.status).toBe(next);
    }
  });

  it("refuses an invalid move (BORRADOR -> VENDIDA) and leaves the property as it was", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);

    await expectError(
      propertyService.changeStatus(agency.id, property.id, "VENDIDA"),
      ValidationError
    );

    const after = await propertyService.getDetail(property.id, agency.id);
    expect(after.status).toBe("BORRADOR");
  });

  it("answers an invalid move with a 400", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);

    const error = await expectError(
      propertyService.changeStatus(agency.id, property.id, "VENDIDA"),
      ValidationError
    );

    expect(errorResponse(error).status).toBe(400);
  });

  it("refuses VENDIDA on an Alquiler and ALQUILADA on a Venta", async () => {
    const { agency } = await createSeller();
    const rental = await createProperty(agency.id, {
      operationType: "Alquiler",
      status: "PUBLICADA",
    });
    await propertyService.changeStatus(agency.id, rental.id, "RESERVADA");

    await expectError(
      propertyService.changeStatus(agency.id, rental.id, "VENDIDA"),
      ValidationError
    );
    expect(
      (await propertyService.changeStatus(agency.id, rental.id, "ALQUILADA"))
        .status
    ).toBe("ALQUILADA");
  });

  it("lets a published property pause and come back, and be cancelled from any live state", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });

    await propertyService.changeStatus(agency.id, property.id, "PAUSADA");
    await propertyService.changeStatus(agency.id, property.id, "PUBLICADA");
    const cancelled = await propertyService.changeStatus(
      agency.id,
      property.id,
      "CANCELADA"
    );

    expect(cancelled.status).toBe("CANCELADA");
    await expectError(
      propertyService.changeStatus(agency.id, property.id, "PUBLICADA"),
      ValidationError
    );
  });

  it("is only allowed to the owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id);

    await expectError(
      propertyService.changeStatus(
        stranger.agency.id,
        property.id,
        "PUBLICADA"
      ),
      ForbiddenError
    );
  });
});

describe("the history of a property", () => {
  it("adds a row for every change, never replaces one, oldest first", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);

    await propertyService.changeStatus(agency.id, property.id, "PUBLICADA");
    await propertyService.changeStatus(agency.id, property.id, "PAUSADA");
    await propertyService.changeStatus(agency.id, property.id, "PUBLICADA");

    const history = await propertyService.getStatusHistory(
      agency.id,
      property.id
    );

    expect(history.map((row) => [row.previousState, row.newState])).toEqual([
      [null, "BORRADOR"],
      ["BORRADOR", "PUBLICADA"],
      ["PUBLICADA", "PAUSADA"],
      ["PAUSADA", "PUBLICADA"],
    ]);
    const times = history.map((row) => row.createdAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("can only be read by the owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id);

    await expectError(
      propertyService.getStatusHistory(stranger.agency.id, property.id),
      ForbiddenError
    );
  });
});
