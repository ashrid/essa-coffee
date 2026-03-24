import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderLookupSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = orderLookupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input. Please check your order number and email." },
        { status: 400 }
      );
    }

    const { orderNumber, email } = result.data;

    // Find order by orderNumber
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.toLowerCase() },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    // Verify order exists and email matches
    // Use generic error message for security (don't reveal if order exists)
    if (!order || order.guestEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Order not found. Please check your order number and email." },
        { status: 404 }
      );
    }

    // Return order details (excluding sensitive/internal fields)
    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      guestName: order.guestName,
      guestEmail: order.guestEmail,
      guestPhone: order.guestPhone,
      guestNotes: order.guestNotes,
      pickupTime: order.pickupTime?.toISOString() || null,
      items: order.items.map((item) => ({
        quantity: item.quantity,
        price: item.price.toString(),
        productName: item.product.name,
      })),
      total: order.total.toString(),
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      // Include QR token for READY orders so customer can see their pickup QR code
      qrToken: order.status === "READY" ? order.qrToken : null,
      qrTokenExpiresAt: order.status === "READY" ? order.qrTokenExpiresAt?.toISOString() || null : null,
    });
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
