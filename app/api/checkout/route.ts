import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createOrderAtomically } from "@/lib/orders";
import { checkoutContactSchema } from "@/lib/validators";
import {
  sendOrderConfirmation,
  sendAdminNewOrderNotification,
  OrderWithItems,
} from "@/lib/email";

const checkoutSchema = checkoutContactSchema.merge(
  z.object({
    paymentMethod: z.enum(["STRIPE", "PAY_ON_PICKUP"]),
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  })
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 }
      );
    }

    const { guestName, guestEmail, guestPhone, guestNotes, paymentMethod, items } = result.data;

    // Fetch products and prices from DB (never trust client prices)
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, images: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Invalid request", message: "Some products not found" },
        { status: 400 }
      );
    }

    const priceSnapshot = Object.fromEntries(
      products.map((p) => [p.id, p.price])
    );

    // PAY_ON_PICKUP path - create order immediately
    if (paymentMethod === "PAY_ON_PICKUP") {
      const order = await createOrderAtomically(
        { guestName, guestEmail, guestPhone, guestNotes, paymentMethod, items },
        priceSnapshot
      );

      // Fetch full order with items for email
      const orderWithItems = (await prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      })) as OrderWithItems;

      // Send emails - await so Vercel doesn't kill the function before SMTP finishes
      await Promise.allSettled([
        sendOrderConfirmation(orderWithItems),
        sendAdminNewOrderNotification(orderWithItems),
      ]);

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: "PAY_ON_PICKUP",
      });
    }

    // STRIPE path - create checkout session, order created by webhook
    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        price_data: {
          currency: "aed",
          product_data: {
            name: product.name,
            images: product.images.length > 0 ? [product.images[0]] : undefined,
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: guestEmail,
      metadata: {
        guestName,
        guestEmail,
        guestPhone: guestPhone || "",
        guestNotes: guestNotes || "",
        items: JSON.stringify(items),
      },
      success_url: `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    // Handle insufficient stock error
    if (error instanceof Error && error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.replace("INSUFFICIENT_STOCK:", "");
      return NextResponse.json(
        { error: "Out of stock", productName },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Order failed" },
      { status: 500 }
    );
  }
}
