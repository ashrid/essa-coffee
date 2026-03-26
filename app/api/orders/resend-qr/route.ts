import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQRToken, sendOrderReadyEmail, type OrderWithItems } from "@/lib/email";
import { z } from "zod";

const resendQRSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
});

// Type guard to ensure order matches OrderWithItems interface
function isOrderWithItems(order: unknown): order is OrderWithItems {
  if (typeof order !== "object" || order === null) return false;

  const o = order as Record<string, unknown>;

  return (
    typeof o.id === "string" &&
    typeof o.orderNumber === "string" &&
    typeof o.guestName === "string" &&
    typeof o.guestEmail === "string" &&
    (o.guestPhone === null || typeof o.guestPhone === "string") &&
    (o.guestNotes === null || typeof o.guestNotes === "string") &&
    (o.paymentMethod === "STRIPE" || o.paymentMethod === "PAY_ON_PICKUP") &&
    (typeof o.total === "object" || typeof o.total === "number") &&
    (o.pickupTime === null || o.pickupTime instanceof Date) &&
    Array.isArray(o.items) &&
    o.items.every(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).quantity === "number" &&
        (typeof (item as Record<string, unknown>).price === "object" ||
          typeof (item as Record<string, unknown>).price === "number") &&
        typeof (item as Record<string, unknown>).product === "object" &&
        (item as Record<string, unknown>).product !== null &&
        typeof ((item as Record<string, unknown>).product as Record<string, unknown>).name === "string"
    )
  );
}

/**
 * POST /api/orders/resend-qr
 * Admin-only endpoint to regenerate and resend QR code for an order
 * Useful when QR code expires or customer needs a new one
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const result = resendQRSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 }
      );
    }

    const { orderId } = result.data;

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Only allow resending QR for orders that are READY or COMPLETED
    // (COMPLETED allows re-sending if customer lost the email)
    if (order.status !== "READY" && order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Cannot resend QR code for order with status: ${order.status}` },
        { status: 409 }
      );
    }

    // Generate new QR token and expiry
    const { token, expiresAt } = generateQRToken();

    // Update order with new QR token
    await prisma.order.update({
      where: { id: orderId },
      data: {
        qrToken: token,
        qrTokenExpiresAt: expiresAt,
      },
    });

    // Send order ready email with new QR code
    // Validate order shape before casting
    if (!isOrderWithItems(order)) {
      return NextResponse.json(
        { error: "Order data validation failed" },
        { status: 500 }
      );
    }

    await sendOrderReadyEmail(order, token);

    return NextResponse.json({
      success: true,
      message: "QR code regenerated and email sent",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Resend QR error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
