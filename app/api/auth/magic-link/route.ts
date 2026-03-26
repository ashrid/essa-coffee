import { NextRequest, NextResponse } from "next/server";
import { sendMagicLink } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { getSafeOrigin } from "@/lib/origin";
import { z } from "zod";

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  callbackUrl: z.string().optional(),
});

function getClientIP(request: NextRequest): string {
  // Try various headers in order of reliability
  const headers = [
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-client-ip"),
  ];

  for (const header of headers) {
    if (header) {
      // x-forwarded-for can contain multiple IPs separated by commas
      const ip = header.split(",")[0]?.trim();
      if (ip) return ip;
    }
  }

  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check - use IP address as identifier
    const ip = getClientIP(request);
    const { success: rateLimitOk, remaining, reset } = await checkRateLimit(
      `magic-link:${ip}`,
      5, // 5 requests
      15 * 60 * 1000 // per 15 minutes
    );

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const result = magicLinkSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email, callbackUrl } = result.data;

    // Validate and get safe origin
    const origin = getSafeOrigin(request);

    await sendMagicLink(email, callbackUrl ?? "/admin", origin);

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
        },
      }
    );
  } catch (error) {
    console.error("Magic link error:", error);
    // Return success even on error to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
