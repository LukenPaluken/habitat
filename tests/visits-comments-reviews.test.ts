import { afterAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  createCommentSchema,
  replyCommentSchema,
} from "@/lib/validations/comment";
import { createReviewSchema } from "@/lib/validations/review";
import { requestVisitSchema } from "@/lib/validations/visit";
import { visitRequests } from "@/models";
import * as commentService from "@/services/comment.service";
import * as propertyService from "@/services/property.service";
import * as reviewService from "@/services/review.service";
import * as visitService from "@/services/visit.service";
import { eq } from "drizzle-orm";
import {
  cleanUp,
  createProperty,
  createSeller,
  expectError,
  inDays,
} from "./helpers";

afterAll(cleanUp);

const visitData = {
  requesterName: "Ana",
  requesterPhone: "011-4444-4444",
  proposedDate: inDays(3),
};

describe("visit requests", () => {
  it("are created for a published property", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });

    const visit = await visitService.request(property.id, visitData);

    expect(visit.status).toBe("Pendiente");
  });

  it("refuse a date in the past, and the rule lives on the server", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });

    await expectError(
      visitService.request(property.id, {
        ...visitData,
        proposedDate: inDays(-1),
      }),
      ValidationError
    );
  });

  it("are refused on a property that is not published", async () => {
    const { agency } = await createSeller();
    const paused = await createProperty(agency.id, { status: "PUBLICADA" });
    await propertyService.changeStatus(agency.id, paused.id, "PAUSADA");
    const draft = await createProperty(agency.id);

    await expectError(
      visitService.request(paused.id, visitData),
      ConflictError
    );
    await expectError(visitService.request(draft.id, visitData), NotFoundError);
  });

  it("follow Pendiente -> Confirmada -> Realizada, or Rechazada / Cancelada at any time", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });

    const done = await visitService.request(property.id, visitData);
    await visitService.changeStatus(agency.id, done.id, "Confirmada");
    expect(
      (await visitService.changeStatus(agency.id, done.id, "Realizada")).status
    ).toBe("Realizada");
    await expectError(
      visitService.changeStatus(agency.id, done.id, "Cancelada"),
      ConflictError
    );

    const rejected = await visitService.request(property.id, visitData);
    expect(
      (await visitService.changeStatus(agency.id, rejected.id, "Rechazada"))
        .status
    ).toBe("Rechazada");
  });

  it("cannot jump over a step (Pendiente -> Realizada)", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    const visit = await visitService.request(property.id, visitData);

    await expectError(
      visitService.changeStatus(agency.id, visit.id, "Realizada"),
      ConflictError
    );
  });

  it("can only be answered by the owner (403)", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id, {
      status: "PUBLICADA",
    });
    const visit = await visitService.request(property.id, visitData);

    await expectError(
      visitService.changeStatus(stranger.agency.id, visit.id, "Confirmada"),
      ForbiddenError
    );
  });

  it("let only the first of two simultaneous answers win (409 for the other)", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    const visit = await visitService.request(property.id, visitData);

    const results = await Promise.allSettled([
      visitService.changeStatus(agency.id, visit.id, "Confirmada"),
      visitService.changeStatus(agency.id, visit.id, "Rechazada"),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [row] = await db
      .select()
      .from(visitRequests)
      .where(eq(visitRequests.id, visit.id));
    expect(["Confirmada", "Rechazada"]).toContain(row.status);
  });

  it("need a name, a phone and a date (input shape)", () => {
    const valid = {
      requesterName: "Ana",
      requesterPhone: "011-4444-4444",
      proposedDate: inDays(1).toISOString(),
    };
    expect(requestVisitSchema.safeParse(valid).success).toBe(true);
    expect(
      requestVisitSchema.safeParse({ ...valid, requesterName: "  " }).success
    ).toBe(false);
    expect(
      requestVisitSchema.safeParse({ ...valid, requesterPhone: "123" }).success
    ).toBe(false);
    expect(
      requestVisitSchema.safeParse({ ...valid, proposedDate: "not a date" })
        .success
    ).toBe(false);
  });
});

describe("comments", () => {
  it("need content (input shape)", () => {
    expect(
      createCommentSchema.safeParse({ authorName: "Ana", content: "   " })
        .success
    ).toBe(false);
    expect(
      createCommentSchema.safeParse({ authorName: "", content: "Hola" }).success
    ).toBe(false);
    expect(
      createCommentSchema.safeParse({ authorName: "Ana", content: "Hola" })
        .success
    ).toBe(true);
    expect(replyCommentSchema.safeParse({ sellerReply: "" }).success).toBe(
      false
    );
  });

  it("can be left on any property that is not a draft, also a closed one", async () => {
    const { agency } = await createSeller();
    const closed = await createProperty(agency.id, { status: "PUBLICADA" });
    await propertyService.changeStatus(agency.id, closed.id, "CANCELADA");
    const draft = await createProperty(agency.id);

    expect(
      (
        await commentService.ask(closed.id, {
          authorName: "Ana",
          content: "¿Sigue?",
        })
      ).sellerReply
    ).toBeNull();
    await expectError(
      commentService.ask(draft.id, { authorName: "Ana", content: "¿Hola?" }),
      NotFoundError
    );
  });

  it("get ONE reply, from the owner only, in the same comment", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id, {
      status: "PUBLICADA",
    });
    const comment = await commentService.ask(property.id, {
      authorName: "Ana",
      content: "¿Mascotas?",
    });

    await expectError(
      commentService.reply(stranger.agency.id, comment.id, "Hijack"),
      ForbiddenError
    );
    const replied = await commentService.reply(
      owner.agency.id,
      comment.id,
      "Sí, admite."
    );
    expect(replied.id).toBe(comment.id);
    expect(replied.sellerReply).toBe("Sí, admite.");
    await expectError(
      commentService.reply(owner.agency.id, comment.id, "Otra vez"),
      ConflictError
    );
  });

  it("are listed with their reply, newest first", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    const first = await commentService.ask(property.id, {
      authorName: "Ana",
      content: "Primera",
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await commentService.ask(property.id, {
      authorName: "Luis",
      content: "Segunda",
    });
    await commentService.reply(agency.id, first.id, "Respuesta");

    const page = await commentService.listForProperty(property.id, {
      page: 1,
      limit: 10,
    });

    expect(page.items.map((c) => c.content)).toEqual(["Segunda", "Primera"]);
    expect(page.items[1].sellerReply).toBe("Respuesta");
    expect(page.total).toBe(2);
  });
});

describe("reviews", () => {
  it("need a rating from 1 to 5 and some content (input shape)", () => {
    const valid = { authorName: "Ana", content: "Muy bien", rating: 5 };
    expect(createReviewSchema.safeParse(valid).success).toBe(true);
    for (const rating of [0, 6, 3.5, -1])
      expect(createReviewSchema.safeParse({ ...valid, rating }).success).toBe(
        false
      );
    expect(
      createReviewSchema.safeParse({ ...valid, content: " " }).success
    ).toBe(false);
  });

  it("show up at once in the list, with the average", async () => {
    const { agency } = await createSeller();
    await reviewService.create(agency.id, {
      authorName: "Ana",
      content: "Excelente",
      rating: 5,
    });
    await reviewService.create(agency.id, {
      authorName: "Luis",
      content: "Regular",
      rating: 2,
    });

    const { page, averageRating } = await reviewService.list(agency.id, {
      page: 1,
      limit: 10,
    });

    expect(page.total).toBe(2);
    expect(averageRating).toBe(3.5);
  });

  it("cannot be left on an agency that does not exist", async () => {
    await expectError(
      reviewService.create("00000000-0000-4000-8000-000000000000", {
        authorName: "Ana",
        content: "x",
        rating: 4,
      }),
      NotFoundError
    );
  });
});
