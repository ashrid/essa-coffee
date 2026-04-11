const GOOGLE_MAPS_EMBED_HOSTS = new Set([
  "www.google.com",
  "google.com",
]);

function isValidGoogleMapsEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      GOOGLE_MAPS_EMBED_HOSTS.has(url.hostname) &&
      url.pathname.startsWith("/maps/embed")
    );
  } catch {
    return false;
  }
}

export function resolveGoogleMapsEmbedUrl(value?: string | null): string {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (isValidGoogleMapsEmbedUrl(trimmed)) {
    return trimmed;
  }

  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (!srcMatch?.[1]) {
    return "";
  }

  const src = srcMatch[1].trim();
  return isValidGoogleMapsEmbedUrl(src) ? src : "";
}
