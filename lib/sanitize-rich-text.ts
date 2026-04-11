import sanitizeHtml from "sanitize-html";

const sanitizerOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "a",
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeRichText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const sanitized = sanitizeHtml(value, sanitizerOptions).trim();
  return sanitized.length > 0 ? sanitized : null;
}

export function stripHtmlToPlainText(value?: string | null): string {
  if (!value) {
    return "";
  }

  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}
