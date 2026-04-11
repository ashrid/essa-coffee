import { describe, expect, it } from "vitest";
import { sanitizeRichText, stripHtmlToPlainText } from "@/lib/sanitize-rich-text";

describe("rich text sanitization", () => {
  it("removes scripts and inline event handlers", () => {
    const sanitized = sanitizeRichText(
      '<p>Hello</p><img src="x" onerror="alert(1)" /><script>alert(1)</script>'
    );

    expect(sanitized).toBe("<p>Hello</p><img src=\"x\" />");
  });

  it("preserves the formatting produced by the editor", () => {
    const sanitized = sanitizeRichText(
      "<p><strong>Bold</strong> and <em>italic</em></p><ul><li>One</li><li>Two</li></ul>"
    );

    expect(sanitized).toContain("<strong>Bold</strong>");
    expect(sanitized).toContain("<em>italic</em>");
    expect(sanitized).toContain("<ul>");
    expect(sanitized).toContain("<li>One</li>");
  });

  it("turns HTML into plain metadata text", () => {
    const plainText = stripHtmlToPlainText(
      "<p>Fresh <strong>coffee</strong> for <em>pickup</em>.</p>"
    );

    expect(plainText).toBe("Fresh coffee for pickup.");
  });
});
