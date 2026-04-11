import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "./db";

/**
 * Generates the next order number in sequence (ORD-001, ORD-002, etc.)
 * Uses a database-level counter to prevent race conditions
 */
async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  // Use raw query to get and increment counter atomically
  // This prevents race conditions between concurrent transactions
  const result = await tx.$queryRaw<{ next_val: number }[]>`
    INSERT INTO "order_number_counter" ("id", "lastNumber", "updatedAt")
    VALUES (1, 1, NOW())
    ON CONFLICT ("id")
    DO UPDATE SET "lastNumber" = "order_number_counter"."lastNumber" + 1, "updatedAt" = NOW()
    RETURNING "lastNumber" as next_val
  `;

  const nextNumber = result[0]?.next_val ?? 1;

  // Format: ORD-001, ORD-002, etc.
  return `ORD-${String(nextNumber).padStart(3, "0")}`;
}

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestNotes?: string | null;
  pickupTime?: string | null;
  paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
   status?: OrderStatus;
   paymentStatus?: PaymentStatus;
   stripeSessionId?: string | null;
   paidAt?: Date | null;
   paidAmount?: Decimal | Prisma.Decimal | null;
  items: CheckoutItem[];
}

async function createOrderAtomicallyInTransaction(
  tx: Prisma.TransactionClient,
  data: CheckoutData,
  priceSnapshot: Record<string, Decimal>
) {
  // 1. Re-fetch products and verify availability
  for (const item of data.items) {
    const product = await tx.product.findUniqueOrThrow({
      where: { id: item.productId },
    });
    if (!product.isAvailable) {
      throw new Error(`ITEM_UNAVAILABLE:${product.name}`);
    }
  }

  // 2. Calculate total from DB prices (not client-submitted prices)
  const total = data.items.reduce((sum, item) => {
    return sum + Number(priceSnapshot[item.productId]) * item.quantity;
  }, 0);

  // 3. Generate order number using atomic counter
  const orderNumber = await generateOrderNumber(tx);

  // 4. Create order + items
  const order = await tx.order.create({
    data: {
      orderNumber,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone || null,
      guestNotes: data.guestNotes || null,
      pickupTime: data.pickupTime ? new Date(data.pickupTime) : null,
      status: data.status,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      stripeSessionId: data.stripeSessionId || null,
      paidAt: data.paidAt || null,
      paidAmount: data.paidAmount || null,
      total: new Prisma.Decimal(total),
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: priceSnapshot[item.productId],
        })),
      },
    },
  });

  return order;
}

export async function createOrderAtomically(
  data: CheckoutData,
  priceSnapshot: Record<string, Decimal>
) {
  return prisma.$transaction(
    async (tx) => {
      return createOrderAtomicallyInTransaction(tx, data, priceSnapshot);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function createOrderAtomicallyWithTransaction(
  tx: Prisma.TransactionClient,
  data: CheckoutData,
  priceSnapshot: Record<string, Decimal>
) {
  return createOrderAtomicallyInTransaction(tx, data, priceSnapshot);
}
