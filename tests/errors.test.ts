import { describe, expect, it } from "bun:test";
import { ZodError, z } from "zod";
import { errorResponse } from "@/controllers/http";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";

describe("how errors become HTTP answers", () => {
  const status = (error: unknown) => errorResponse(error).status;

  it("uses the right status for each kind of error", () => {
    expect(status(new ValidationError("bad"))).toBe(400);
    expect(status(new UnauthorizedError())).toBe(401);
    expect(status(new ForbiddenError())).toBe(403);
    expect(status(new NotFoundError("missing"))).toBe(404);
    expect(status(new ConflictError("clash"))).toBe(409);
  });

  it("answers a body that fails validation with a 400 that names the field", async () => {
    const result = z
      .object({ price: z.number().positive() })
      .safeParse({ price: -1 });
    const response = errorResponse(result.error as ZodError);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details[0].path).toEqual(["price"]);
  });

  it("never leaks the stack or the message of an unexpected error", async () => {
    const original = console.error;
    console.error = () => {}; // the handler logs it on purpose
    const response = errorResponse(
      new Error("connection string: postgres://user:secret@host")
    );
    console.error = original;

    expect(response.status).toBe(500);
    const text = JSON.stringify(await response.json());
    expect(text).toBe('{"error":"Internal server error"}');
  });
});
