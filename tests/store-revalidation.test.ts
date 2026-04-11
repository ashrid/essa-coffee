import { describe, expect, it } from "vitest";
import {
  getCategoryStorefrontPaths,
  getProductStorefrontPaths,
} from "@/lib/store-revalidation";

describe("storefront revalidation paths", () => {
  it("revalidates both the old and new product slug paths", () => {
    expect(
      getProductStorefrontPaths({
        previousSlug: "iced-latte",
        nextSlug: "spanish-latte",
      })
    ).toEqual(["/", "/shop", "/shop/iced-latte", "/shop/spanish-latte"]);
  });

  it("revalidates storefront product pages affected by a category change", () => {
    expect(getCategoryStorefrontPaths(["latte", "flat-white"]))
      .toEqual(["/", "/shop", "/shop/flat-white", "/shop/latte"]);
  });
});
