import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "./db";

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CheckoutData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestNotes?: string | null;
  paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
  items: CheckoutItem[];
}

export async function createOrderAtomically(
  data: CheckoutData,
  priceSnapshot: Record<string, Decimal>
) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Re-fetch products and verify stock
      for (const item of data.items) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
        });
        if (product.stockQuantity < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }
      }

      // 2. Calculate total from DB prices (not client-submitted prices)
      const total = data.items.reduce((sum, item) => {
        return sum + Number(priceSnapshot[item.productId]) * item.quantity;
      }, 0);

      // 3. Create order + items
      const order = await tx.order.create({
        data: {
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          guestPhone: data.guestPhone || null,
          guestNotes: data.guestNotes || null,
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

      // 4. Deduct stock atomically
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return order;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
