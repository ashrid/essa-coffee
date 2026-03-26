import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";

const verifyQRSchema = z.object({
  token: z.string().min(64).max(64).regex(/^[a-f0-9]+$/, "Invalid token format"),
});

/**
 * GET /api/orders/verify-qr
 * Validates a QR code token and returns order details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token");

    // Validate token format
    const result = verifyQRSchema.safeParse({ token: rawToken });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid QR token format" },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Extract client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // Rate limit: 30 requests per minute per IP
    const rateResult = await checkRateLimit(`verify-qr:${ip}`, 30, 60_000);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in 1 minute.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // Find order by QR token
    const order = await prisma.order.findFirst({
      where: {
        qrToken: token,
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Invalid QR code" },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (order.qrTokenExpiresAt && order.qrTokenExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "QR code has expired. Please ask staff to resend." },
        { status: 410 }
      );
    }

    // D-06: Check if order is already completed (before READY check)
    if (order.status === "COMPLETED") {
      return NextResponse.json({
        error: "Order already completed",
        code: "ALREADY_COMPLETED",
        status: order.status,
        alreadyCompleted: true,
      }, { status: 200 });
    }

    // Verify order status is READY
    if (order.status !== "READY") {
      return NextResponse.json(
        {
          error: "Order is not ready for pickup",
          status: order.status,
        },
        { status: 409 }
      );
    }

    // Return order details for display on scan page
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      items: order.items.map((item) => ({
        quantity: item.quantity,
        price: item.price.toString(),
        productName: item.product.name,
      })),
      total: order.total.toString(),
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    console.error("QR verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
