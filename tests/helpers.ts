import { inArray } from "drizzle-orm";
import { expect } from "bun:test";
import { db } from "@/db";
import type { CreatePropertyInput } from "@/lib/validations/property";
import { user } from "@/models";
import * as authService from "@/services/auth.service";
import * as propertyService from "@/services/property.service";

// Every test builds the data it needs with a name nobody else uses, so tests
// never depend on each other, on their order, or on what the seed left.

let counter = 0;
export const unique = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const createdUsers: string[] = [];

export async function createSeller(
  overrides: Partial<Parameters<typeof authService.registerSeller>[0]> = {}
) {
  const email = overrides.email ?? `${unique("seller")}@test.com`;
  const { user: account, agency } = await authService.registerSeller(
    {
      name: "Test Seller",
      email,
      password: "password123",
      fantasyName: unique("Agency"),
      phone: "011-5555-5555",
      description: "",
      ...overrides,
    },
    new Headers()
  );
  createdUsers.push(account.id);
  return { user: account, agency, email };
}

export function propertyInput(
  overrides: Partial<CreatePropertyInput> = {}
): CreatePropertyInput {
  return {
    title: unique("Property"),
    description: "A nice place to live in",
    propertyType: "Departamento",
    operationType: "Venta",
    status: "BORRADOR",
    price: "100000",
    currency: "USD",
    totalArea: 60,
    coveredArea: 50,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    age: 5,
    address: "Calle Falsa 123",
    neighborhood: "Centro",
    tags: [],
    ...overrides,
  };
}

export const createProperty = (
  agencyId: string,
  overrides: Partial<CreatePropertyInput> = {}
) => propertyService.create(agencyId, propertyInput(overrides));

/** Awaits `promise`, which must fail with an `ErrorType`; returns that error. */
export async function expectError<E extends Error>(
  promise: Promise<unknown>,
  ErrorType: new (...args: never[]) => E
): Promise<E> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorType);
    return error as E;
  }
  throw new Error(`Expected a ${ErrorType.name}, but nothing was thrown`);
}

export const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000);

/** Deleting a user cascades to its agency, properties and everything below. */
export async function cleanUp() {
  if (createdUsers.length > 0) {
    await db.delete(user).where(inArray(user.id, createdUsers));
  }
}
