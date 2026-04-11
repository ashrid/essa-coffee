import { NextRequest } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createOrderAtomicallyWithTransaction } from "@/lib/orders";
import {
  sendOrderConfirmation,
  sendAdminNewOrderNotification,
  OrderWithItems,
} from "@/lib/email";

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

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
      const paidAt = new Date();
      const paidAmount = new Prisma.Decimal((session.amount_total ?? 0) / 100);

      const result = await prisma.$transaction(
        async (tx) => {
          try {
            await tx.stripeWebhookEvent.create({
              data: {
                id: event.id,
                eventType: event.type,
                stripeSessionId: session.id,
              },
            });
          } catch (error) {
            if (isUniqueConstraintError(error)) {
              return { orderId: null, shouldSendEmails: false };
            }
            throw error;
          }

          const existingOrder = await tx.order.findUnique({
            where: { stripeSessionId: session.id },
          });

          if (existingOrder) {
            if (existingOrder.paymentStatus === "PAID") {
              return { orderId: existingOrder.id, shouldSendEmails: false };
            }

            const updatedOrder = await tx.order.update({
              where: { id: existingOrder.id },
              data: {
                paymentStatus: "PAID",
                paidAt,
                paidAmount,
              },
            });

            return { orderId: updatedOrder.id, shouldSendEmails: true };
          }

          const createdOrder = await createOrderAtomicallyWithTransaction(
            tx,
            {
              guestName,
              guestEmail,
              guestPhone: guestPhone || null,
              guestNotes: guestNotes || null,
              paymentMethod: "STRIPE",
              paymentStatus: "PAID",
              stripeSessionId: session.id,
              paidAt,
              paidAmount,
              items: parsedItems,
            },
            priceSnapshot
          );

          return { orderId: createdOrder.id, shouldSendEmails: true };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      if (!result.orderId) {
        return new Response("Already processed", { status: 200 });
      }

      // Fetch full order with items for email
      const orderWithItems = (await prisma.order.findUniqueOrThrow({
        where: { id: result.orderId },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      })) as OrderWithItems;

      if (result.shouldSendEmails) {
        // Send emails - await so Vercel doesn't kill the function before SMTP finishes
        await Promise.allSettled([
          sendOrderConfirmation(orderWithItems),
          sendAdminNewOrderNotification(orderWithItems),
        ]);
      }
    } catch (error) {
      console.error("Failed to create order from webhook:", error);
      // Return 500 so Stripe retries
      return new Response("Order creation failed", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
