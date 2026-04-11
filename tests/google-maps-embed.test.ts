import { describe, expect, it } from "vitest";
import { resolveGoogleMapsEmbedUrl } from "@/lib/google-maps-embed";

describe("resolveGoogleMapsEmbedUrl", () => {
  it("returns a raw embed URL unchanged", () => {
    const url = "https://www.google.com/maps/embed?pb=test";
    expect(resolveGoogleMapsEmbedUrl(url)).toBe(url);
  });

  it("extracts the src from a pasted iframe snippet", () => {
    const iframe = '<iframe src="https://www.google.com/maps/embed?pb=abc123" width="600" height="450"></iframe>';
    expect(resolveGoogleMapsEmbedUrl(iframe)).toBe(
      "https://www.google.com/maps/embed?pb=abc123"
    );
  });

  it("rejects non-google embed sources", () => {
    const iframe = '<iframe src="https://example.com/embed"></iframe>';
    expect(resolveGoogleMapsEmbedUrl(iframe)).toBe("");
  });
});
