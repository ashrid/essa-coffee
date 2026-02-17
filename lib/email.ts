import { Resend } from "resend";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/components/emails/OrderConfirmationEmail";
import { AdminNewOrderEmail } from "@/components/emails/AdminNewOrderEmail";
import { Prisma } from "@prisma/client";

const resend = new Resend(process.env.AUTH_RESEND_KEY);

// Type for order with items and product names
export interface OrderWithItems {
  id: string;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestNotes?: string | null;
  paymentMethod: "STRIPE" | "PAY_ON_PICKUP";
  total: Prisma.Decimal | number;
  items: Array<{
    id: string;
    quantity: number;
    price: Prisma.Decimal | number;
    product: {
      name: string;
    };
  }>;
}

/**
 * Send order confirmation email to customer
 * Non-blocking - errors are caught and logged
 */
export async function sendOrderConfirmation(order: OrderWithItems): Promise<void> {
  try {
    const items = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: typeof item.price === "number" ? item.price : Number(item.price),
    }));

    const total =
      typeof order.total === "number" ? order.total : Number(order.total);

    const html = await render(
      OrderConfirmationEmail({
        orderNumber: order.orderNumber,
        guestName: order.guestName,
        items,
        total,
        paymentMethod: order.paymentMethod,
      })
    );

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: order.guestEmail,
      subject: `Order Confirmed #${order.orderNumber} — ShopSeeds`,
      html,
    });

    if (result.error) {
      console.error("Failed to send order confirmation email:", result.error);
    } else {
      console.log("Order confirmation email sent:", result.data?.id);
    }
  } catch (error) {
    // Email failure must NOT propagate - log and continue
    console.error("Error sending order confirmation email:", error);
  }
}

/**
 * Send new order notification email to admin
 * Non-blocking - errors are caught and logged
 */
export async function sendAdminNewOrderNotification(
  order: OrderWithItems
): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.warn("ADMIN_EMAIL not set, skipping admin notification");
      return;
    }

    const items = order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: typeof item.price === "number" ? item.price : Number(item.price),
    }));

    const total =
      typeof order.total === "number" ? order.total : Number(order.total);

    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}`;

    const html = await render(
      AdminNewOrderEmail({
        orderNumber: order.orderNumber,
        guestName: order.guestName,
        guestEmail: order.guestEmail,
        guestPhone: order.guestPhone ?? undefined,
        items,
        total,
        paymentMethod: order.paymentMethod,
        adminUrl,
      })
    );

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
      to: adminEmail,
      subject: `New Order #${order.orderNumber} — ShopSeeds`,
      html,
    });

    if (result.error) {
      console.error("Failed to send admin notification email:", result.error);
    } else {
      console.log("Admin notification email sent:", result.data?.id);
    }
  } catch (error) {
    // Email failure must NOT propagate - log and continue
    console.error("Error sending admin notification email:", error);
  }
}
