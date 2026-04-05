import { NextRequest } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createOrderAtomically } from "@/lib/orders";
import {
  sendOrderConfirmation,
  sendAdminNewOrderNotification,
  OrderWithItems,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Idempotency: check if order with stripeSessionId already exists
    const existing = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (existing) {
      console.log("Order already processed for session:", session.id);
      return new Response("Already processed", { status: 200 });
    }

    // Parse metadata
    const metadata = session.metadata;
    if (!metadata?.guestName || !metadata?.guestEmail || !metadata?.items) {
      console.error("Missing required metadata in Stripe session:", session.id);
      return new Response("Missing metadata", { status: 400 });
    }
    const { guestName, guestEmail, guestPhone, guestNotes, items } = metadata;
    const parsedItems = JSON.parse(items) as Array<{
      productId: string;
      quantity: number;
    }>;

    // Fetch prices from DB (not metadata - always re-verify)
    const products = await prisma.product.findMany({
      where: { id: { in: parsedItems.map((i) => i.productId) } },
      select: { id: true, price: true },
    });

    const priceSnapshot = Object.fromEntries(
      products.map((p) => [p.id, p.price])
    );

    try {
      // Create order atomically
      const order = await createOrderAtomically(
        {
          guestName,
          guestEmail,
          guestPhone: guestPhone || null,
          guestNotes: guestNotes || null,
          paymentMethod: "STRIPE",
          items: parsedItems,
        },
        priceSnapshot
      );

      await prisma.order.update({
        where: { id: order.id },
        data: {
          stripeSessionId: session.id,
          paymentStatus: "PAID",
          paidAt: new Date(),
          paidAmount: new Prisma.Decimal(session.amount_total! / 100),
        },
      });

      console.log("Order created from webhook:", order.orderNumber);

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
    } catch (error) {
      console.error("Failed to create order from webhook:", error);
      // Return 500 so Stripe retries
      return new Response("Order creation failed", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
