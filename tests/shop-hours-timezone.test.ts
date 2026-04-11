import { describe, expect, it } from "vitest";
import {
  buildPickupDateInShopTime,
  getShopDateTimeParts,
  isPickupTimeAtLeastMinutesAhead,
} from "@/lib/shop-hours";

describe("shop-hours timezone helpers", () => {
  it("reads shop-local date and time using the configured timezone instead of host time", () => {
    const parts = getShopDateTimeParts(
      new Date("2026-04-10T05:15:00.000Z"),
      "Asia/Dubai"
    );

    expect(parts.date).toBe("2026-04-10");
    expect(parts.time).toBe("09:15");
    expect(parts.day).toBe(5);
  });

  it("converts a shop-local pickup slot into the correct UTC instant", () => {
    const pickupDate = buildPickupDateInShopTime(
      new Date("2026-04-10T05:15:00.000Z"),
      "10:30",
      "Asia/Dubai"
    );

    expect(pickupDate.toISOString()).toBe("2026-04-10T06:30:00.000Z");
  });

  it("enforces the minimum pickup buffer in shop time", () => {
    const referenceDate = new Date("2026-04-10T05:15:00.000Z");

    expect(
      isPickupTimeAtLeastMinutesAhead(referenceDate, "09:20", 10, "Asia/Dubai")
    ).toBe(false);
    expect(
      isPickupTimeAtLeastMinutesAhead(referenceDate, "09:25", 10, "Asia/Dubai")
    ).toBe(true);
  });
});
