import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "QR token is required" },
        { status: 400 }
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
