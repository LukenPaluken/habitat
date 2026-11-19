import { afterAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { errorResponse } from "@/controllers/http";
import { auth } from "@/lib/auth";
import { ConflictError } from "@/lib/errors";
import { registerSellerSchema } from "@/lib/validations/auth";
import { account } from "@/models";
import * as agencyService from "@/services/agency.service";
import * as authService from "@/services/auth.service";
import { cleanUp, createSeller, expectError, unique } from "./helpers";

afterAll(cleanUp);

describe("seller registration", () => {
  it("creates the account and its agency in one step", async () => {
    const { user, agency, email } = await createSeller();

    expect(user.email).toBe(email);
    expect(agency.userId).toBe(user.id);
    expect(agency.email).toBe(email);
  });

  it("never stores the password in plain text, nor returns it", async () => {
    const { user, agency } = await createSeller({
      password: "s3cret-password",
    });

    const [credential] = await db
      .select()
      .from(account)
      .where(eq(account.userId, user.id));
    expect(credential.password).toBeTruthy();
    expect(credential.password).not.toBe("s3cret-password");
    expect(JSON.stringify({ user, agency })).not.toContain("s3cret-password");
  });

  it("rejects a repeated email with a 409 that names the field", async () => {
    const { email } = await createSeller();

    const error = await expectError(
      authService.registerSeller(
        {
          name: "Other",
          email: email.toUpperCase(),
          password: "password123",
          fantasyName: unique("Other"),
          description: "",
        },
        new Headers()
      ),
      ConflictError
    );

    const response = errorResponse(error);
    expect(response.status).toBe(409);
    expect((await response.json()).details).toEqual({ field: "email" });
  });

  it("rejects a repeated fantasy name with a 409 that names the field", async () => {
    const { agency } = await createSeller();

    const error = await expectError(
      authService.registerSeller(
        {
          name: "Other",
          email: `${unique("other")}@test.com`,
          password: "password123",
          fantasyName: agency.fantasyName,
          description: "",
        },
        new Headers()
      ),
      ConflictError
    );

    expect(errorResponse(error).status).toBe(409);
    expect(error.details).toEqual({ field: "fantasyName" });
  });

  it("does not need a phone number (it is optional)", async () => {
    const { agency } = await createSeller({ phone: undefined });
    expect(agency.phone).toBe("");
  });

  it("validates the shape of the input before anything is created", () => {
    const valid = {
      name: "Ana",
      email: "ana@test.com",
      password: "password123",
      fantasyName: "Ana Inmuebles",
    };

    expect(registerSellerSchema.safeParse(valid).success).toBe(true);
    expect(
      registerSellerSchema.safeParse({ ...valid, password: "short" }).success
    ).toBe(false);
    expect(
      registerSellerSchema.safeParse({ ...valid, email: "not-an-email" })
        .success
    ).toBe(false);
    expect(
      registerSellerSchema.safeParse({ ...valid, phone: "12" }).success
    ).toBe(false);
  });
});

describe("login", () => {
  it("accepts the right password and refuses the wrong one", async () => {
    const { email } = await createSeller({ password: "right-password" });

    const ok = await auth.api.signInEmail({
      body: { email, password: "right-password" },
      headers: new Headers(),
    });
    expect(ok.user.email).toBe(email);

    await expectError(
      auth.api.signInEmail({
        body: { email, password: "wrong-password" },
        headers: new Headers(),
      }),
      Error
    );
  });
});

describe("the public agency profile", () => {
  it("never carries the owner's account id", async () => {
    const { agency } = await createSeller();

    const page = await agencyService.getPublicPage(agency.id);

    expect(Object.keys(page.agency)).not.toContain("userId");
    expect(page.agency.fantasyName).toBe(agency.fantasyName);
  });
});
