import type { OrderStatus } from "@prisma/client";
import {
  sendOrderReadyEmail,
  sendOrderStatusUpdateEmail,
  type OrderWithItems,
} from "@/lib/email";

interface SendAdminOrderStatusEmailsArgs {
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  qrToken?: string;
  order: OrderWithItems;
  sendReadyEmail?: (order: OrderWithItems, qrToken: string) => Promise<void>;
  sendStatusEmail?: (
    order: OrderWithItems,
    newStatus: "CANCELLED" | "REFUNDED"
  ) => Promise<void>;
}

export async function sendAdminOrderStatusEmails({
  previousStatus,
  newStatus,
  qrToken,
  order,
  sendReadyEmail = sendOrderReadyEmail,
  sendStatusEmail = sendOrderStatusUpdateEmail,
}: SendAdminOrderStatusEmailsArgs) {
  if (previousStatus === newStatus) {
    return;
  }

  const tasks: Promise<unknown>[] = [];

  if (newStatus === "READY" && qrToken) {
    tasks.push(sendReadyEmail(order, qrToken));
  }

  if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
    tasks.push(sendStatusEmail(order, newStatus));
  }

  if (tasks.length === 0) {
    return;
  }

  await Promise.allSettled(tasks);
}
