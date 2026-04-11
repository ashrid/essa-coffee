import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/email", () => ({
  sendOrderReadyEmail: vi.fn(),
  sendOrderStatusUpdateEmail: vi.fn(),
}));

import { sendAdminOrderStatusEmails } from "@/lib/admin-order-emails";

describe("admin order status email delivery", () => {
  it("waits for email attempts to settle before resolving", async () => {
    let settled = false;

    const promise = sendAdminOrderStatusEmails({
      previousStatus: "NEW",
      newStatus: "READY",
      qrToken: "qr-token",
      order: { id: "ord_1" } as never,
      sendReadyEmail: vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            setTimeout(() => {
              settled = true;
              resolve();
            }, 0);
          })
      ),
      sendStatusEmail: vi.fn(),
    });

    expect(settled).toBe(false);
    await promise;
    expect(settled).toBe(true);
  });

  it("does not send emails when the status did not change", async () => {
    const sendReadyEmail = vi.fn();
    const sendStatusEmail = vi.fn();

    await sendAdminOrderStatusEmails({
      previousStatus: "READY",
      newStatus: "READY",
      qrToken: "qr-token",
      order: { id: "ord_1" } as never,
      sendReadyEmail,
      sendStatusEmail,
    });

    expect(sendReadyEmail).not.toHaveBeenCalled();
    expect(sendStatusEmail).not.toHaveBeenCalled();
  });
});
