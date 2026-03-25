import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "./db";

/**
 * Generates the next order number in sequence (ORD-001, ORD-002, etc.)
 */
async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  // Get the latest order number
  const lastOrder = await tx.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let nextNumber = 1;

  if (lastOrder?.orderNumber) {
    // Extract number from existing format (e.g., "ORD-123" -> 123)
    const match = lastOrder.orderNumber.match(/\d+/);
    if (match) {
      nextNumber = parseInt(match[0], 10) + 1;
    }
  }

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
  items: CheckoutItem[];
}

export async function createOrderAtomically(
  data: CheckoutData,
  priceSnapshot: Record<string, Decimal>
) {
  return prisma.$transaction(
    async (tx) => {
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

      // 3. Generate simple order number
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
          paymentMethod: data.paymentMethod,
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
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
