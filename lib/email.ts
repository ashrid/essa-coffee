import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/components/emails/OrderConfirmationEmail";
import { AdminNewOrderEmail } from "@/components/emails/AdminNewOrderEmail";
import { Prisma } from "@prisma/client";

// Create Gmail transporter
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn("Gmail not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing)");
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

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
    const transporter = createTransporter();
    if (!transporter) {
      console.warn("Gmail not configured, skipping order confirmation email");
      return;
    }

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

    const result = await transporter.sendMail({
      from: `"ShopSeeds" <${process.env.GMAIL_USER}>`,
      to: order.guestEmail,
      subject: `Order Confirmed #${order.orderNumber} — ShopSeeds`,
      html,
    });

    console.log("Order confirmation email sent:", result.messageId);
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
    const transporter = createTransporter();
    if (!transporter) {
      console.warn("Gmail not configured, skipping admin notification");
      return;
    }

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const adminUrl = `${baseUrl}/admin/orders/${order.id}`;

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

    const result = await transporter.sendMail({
      from: `"ShopSeeds" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `New Order #${order.orderNumber} — ShopSeeds`,
      html,
    });

    console.log("Admin notification email sent:", result.messageId);
  } catch (error) {
    // Email failure must NOT propagate - log and continue
    console.error("Error sending admin notification email:", error);
  }
}

/**
 * Send magic link email for admin authentication
 */
export async function sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn("Gmail not configured, cannot send magic link");
      throw new Error("Email service not configured");
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ShopSeeds</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #166534; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">ShopSeeds Admin</h1>
  </div>
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
    <p style="font-size: 16px; margin-bottom: 20px;">Click the button below to sign in to your ShopSeeds admin account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" style="display: inline-block; background: #166534; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Sign In to Admin</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #6b7280; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">${magicLink}</p>
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">This link will expire in 15 minutes for security reasons.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="font-size: 13px; color: #9ca3af;">If you didn't request this email, you can safely ignore it.</p>
  </div>
</body>
</html>
    `;

    const result = await transporter.sendMail({
      from: `"ShopSeeds" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Sign in to ShopSeeds Admin",
      html,
    });

    console.log("Magic link email sent:", result.messageId);
  } catch (error) {
    console.error("Error sending magic link email:", error);
    throw error;
  }
}
