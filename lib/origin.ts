/**
 * Validates and sanitizes origin headers to prevent open redirect attacks
 */

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

/**
 * Get the default base URL from environment or fallback
 */
export function getDefaultBaseUrl(): string {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

/**
 * Build allowed origins list from environment variables
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  // Add explicitly configured origins
  ALLOWED_ORIGINS.forEach((o) => origins.add(o));

  // Add environment-based origins
  const envOrigins = [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  envOrigins.forEach((o) => {
    // Add both http and https variants for localhost
    if (o.includes("localhost")) {
      origins.add(o.replace("https:", "http:"));
      origins.add(o.replace("http:", "https:"));
    } else {
      origins.add(o);
    }
  });

  // Always allow localhost for development
  origins.add("http://localhost:3000");
  origins.add("https://localhost:3000");

  return Array.from(origins).filter((o) => o.length > 0);
}

/**
 * Validates an origin from request headers against allowed origins
 * Returns a safe origin or null if invalid
 */
export function validateOrigin(request: Request): string | null {
  const allowedOrigins = getAllowedOrigins();

  // Try to get origin from various headers
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  // If we have a direct origin header, validate it
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const normalizedOrigin = `${originUrl.protocol}//${originUrl.host}`;
      if (allowedOrigins.some((allowed) => normalizedOrigin === allowed)) {
        return normalizedOrigin;
      }
    } catch {
      // Invalid URL format
    }
  }

  // If we have a referer, try to validate it
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const normalizedReferer = `${refererUrl.protocol}//${refererUrl.host}`;
      if (allowedOrigins.some((allowed) => normalizedReferer === allowed)) {
        return normalizedReferer;
      }
    } catch {
      // Invalid URL format
    }
  }

  // Reconstruct from forwarded headers (less secure, validate carefully)
  if (forwardedHost) {
    const proto = forwardedProto === "https" ? "https" : "http";
    const reconstructed = `${proto}://${forwardedHost}`;
    if (allowedOrigins.some((allowed) => reconstructed === allowed)) {
      return reconstructed;
    }
  }

  // Last resort: use host header (only for localhost)
  if (host) {
    // Only allow host header reconstruction for localhost
    if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
      return `http://${host}`;
    }
  }

  // Return null if no valid origin found
  return null;
}

/**
 * Gets a safe origin or falls back to the default
 */
export function getSafeOrigin(request: Request): string {
  return validateOrigin(request) || getDefaultBaseUrl();
}
