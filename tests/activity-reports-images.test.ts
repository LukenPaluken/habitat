import { afterAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { propertyStateHistory } from "@/models";
import * as activityService from "@/services/activity.service";
import * as commentService from "@/services/comment.service";
import * as imageService from "@/services/property-image.service";
import * as propertyService from "@/services/property.service";
import * as reportService from "@/services/report.service";
import * as reviewService from "@/services/review.service";
import * as visitService from "@/services/visit.service";
import {
  cleanUp,
  createProperty,
  createSeller,
  expectError,
  inDays,
} from "./helpers";

afterAll(cleanUp);

const feed = async (agencyId: string) =>
  await activityService.list(
    agencyId,
    { unreadOnly: false },
    { page: 1, limit: 50 }
  );

describe("the activity feed", () => {
  it("gets an entry for every comment, visit and review, pointing back to its origin", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });

    const comment = await commentService.ask(property.id, {
      authorName: "Ana",
      content: "¿Hola?",
    });
    const visit = await visitService.request(property.id, {
      requesterName: "Luis",
      requesterPhone: "011-4444-4444",
      proposedDate: inDays(2),
    });
    const review = await reviewService.create(agency.id, {
      authorName: "Eva",
      content: "Bien",
      rating: 4,
    });

    const { page, unreadCount } = await feed(agency.id);
    const byType = Object.fromEntries(page.items.map((a) => [a.type, a]));

    expect(unreadCount).toBe(3); // the comment, the visit and the review
    expect(byType.new_comment.referenceId).toBe(comment.id);
    expect(byType.new_comment.propertyId).toBe(property.id);
    expect(byType.new_visit.referenceId).toBe(visit.id);
    expect(byType.new_review.referenceId).toBe(review.id);
  });

  it("logs a status change with the property it happened on", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);
    await propertyService.changeStatus(agency.id, property.id, "PUBLICADA");

    const { page } = await feed(agency.id);

    expect(page.items[0].type).toBe("property_state_change");
    expect(page.items[0].propertyId).toBe(property.id);
  });

  it("lowers the unread counter when something is read, and only for its owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    await reviewService.create(owner.agency.id, {
      authorName: "Ana",
      content: "Bien",
      rating: 5,
    });
    const { page, unreadCount } = await feed(owner.agency.id);

    await expectError(
      activityService.markRead(stranger.agency.id, page.items[0].id),
      ForbiddenError
    );
    await activityService.markRead(owner.agency.id, page.items[0].id);

    expect(
      (await activityService.unreadCount(owner.agency.id)).unreadCount
    ).toBe(unreadCount - 1);
  });

  it("can be read all at once", async () => {
    const { agency } = await createSeller();
    await reviewService.create(agency.id, {
      authorName: "Ana",
      content: "Bien",
      rating: 5,
    });
    await reviewService.create(agency.id, {
      authorName: "Luis",
      content: "Mal",
      rating: 1,
    });

    expect((await activityService.markAllRead(agency.id)).updated).toBe(2);
    expect((await activityService.unreadCount(agency.id)).unreadCount).toBe(0);
  });
});

describe("the reports", () => {
  it("count properties by state, every state present even with 0", async () => {
    const { agency } = await createSeller();
    await createProperty(agency.id);
    const published = await createProperty(agency.id, { status: "PUBLICADA" });
    await propertyService.changeStatus(agency.id, published.id, "RESERVADA");

    const summary = await reportService.statusSummary(agency.id);

    expect(summary).toEqual({
      PUBLICADA: 0,
      RESERVADA: 1,
      VENDIDA: 0,
      ALQUILADA: 0,
      PAUSADA: 0,
      CANCELADA: 0,
    });
  });

  it("report a null average (not NaN, not 0) while nothing was sold", async () => {
    const { agency } = await createSeller();
    await createProperty(agency.id, { status: "PUBLICADA" });

    expect(
      (await reportService.averageTimeOnMarket(agency.id)).averageDays
    ).toBeNull();
  });

  it("measure the time on market from the history, not from the creation date", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id, { status: "PUBLICADA" });
    // History back-dated: published 20 days ago, sold today.
    await db.insert(propertyStateHistory).values([
      {
        propertyId: property.id,
        previousState: "BORRADOR",
        newState: "PUBLICADA",
        createdAt: inDays(-20),
      },
      {
        propertyId: property.id,
        previousState: "RESERVADA",
        newState: "VENDIDA",
        createdAt: new Date(),
      },
    ]);

    const { averageDays } = await reportService.averageTimeOnMarket(agency.id);

    expect(averageDays).toBe(20);
  });

  it("give a continuous 12-month axis with publications and closings", async () => {
    const { agency } = await createSeller();
    await createProperty(agency.id, { status: "PUBLICADA" });

    const months = await reportService.monthly(agency.id);

    expect(months).toHaveLength(12);
    expect(months[11].published).toBe(1);
    expect(months[11].closed).toBe(0);
  });

  it("only count the agency's own properties", async () => {
    const mine = await createSeller();
    const other = await createSeller();
    await createProperty(other.agency.id, { status: "PUBLICADA" });

    expect((await reportService.statusSummary(mine.agency.id)).PUBLICADA).toBe(
      0
    );
  });
});

describe("the gallery", () => {
  const photo = (n: number) => `https://picsum.photos/seed/test-${n}/800/600`;
  const urls = async (agencyId: string, propertyId: string) =>
    (await propertyService.getDetail(propertyId, agencyId)).images.map(
      (i) => i.imageUrl
    );

  it("makes the first photo the cover, and keeps one cover when it is deleted", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);
    const first = await imageService.add(agency.id, property.id, photo(1));
    const second = await imageService.add(agency.id, property.id, photo(2));
    expect(first.isCover).toBe(true);
    expect(second.isCover).toBe(false);

    await imageService.remove(agency.id, property.id, first.id);

    const detail = await propertyService.getDetail(property.id, agency.id);
    expect(detail.images).toHaveLength(1);
    expect(detail.images[0].isCover).toBe(true);
  });

  it("reorders the photos, but only with the whole set", async () => {
    const { agency } = await createSeller();
    const property = await createProperty(agency.id);
    const a = await imageService.add(agency.id, property.id, photo(1));
    const b = await imageService.add(agency.id, property.id, photo(2));
    const c = await imageService.add(agency.id, property.id, photo(3));

    await imageService.reorder(agency.id, property.id, [c.id, a.id, b.id]);
    expect(await urls(agency.id, property.id)).toEqual([
      photo(3),
      photo(1),
      photo(2),
    ]);

    await expectError(
      imageService.reorder(agency.id, property.id, [a.id, b.id]),
      ValidationError
    );
    await expectError(
      imageService.reorder(agency.id, property.id, [a.id, a.id, b.id]),
      ValidationError
    );
  });

  it("is only managed by the owner", async () => {
    const owner = await createSeller();
    const stranger = await createSeller();
    const property = await createProperty(owner.agency.id);

    await expectError(
      imageService.add(stranger.agency.id, property.id, photo(1)),
      ForbiddenError
    );
  });
});
