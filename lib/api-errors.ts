/**
 * Standard API Error Response Interface
 * All API routes should use this format for consistency
 */
export interface ApiError {
  error: string; // Human-readable message (always present)
  code?: string; // Machine-readable code for programmatic handling
  details?: unknown; // Additional context (optional)
}

/**
 * Helper function to create a standard error response
 */
export function apiErrorResponse(
  error: string,
  code?: string,
  details?: unknown
): ApiError {
  return { error, code, details };
}

/**
 * Common error codes used across the application
 */
export const ErrorCodes = {
  ITEM_UNAVAILABLE: "ITEM_UNAVAILABLE",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  INVALID_TOKEN: "INVALID_TOKEN",
  UNAUTHORIZED: "UNAUTHORIZED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SHOP_CLOSED: "SHOP_CLOSED",
  INVALID_REQUEST: "INVALID_REQUEST",
} as const;
