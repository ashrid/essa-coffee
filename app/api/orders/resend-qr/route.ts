import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQRToken, sendOrderReadyEmail, type OrderWithItems } from "@/lib/email";

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

    // Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

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
    // Cast to OrderWithItems for type compatibility
    await sendOrderReadyEmail(order as OrderWithItems, token);

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
