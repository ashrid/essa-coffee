import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createOrderAtomically: vi.fn(),
  createOrderAtomicallyWithTransaction: vi.fn(),
  getStripe: vi.fn(),
  getShopHours: vi.fn(),
  getShopHoursConfigFromEnv: vi.fn(),
  isShopOpenAt: vi.fn(),
  sendOrderConfirmation: vi.fn(),
  sendAdminNewOrderNotification: vi.fn(),
  tx: {
    stripeWebhookEvent: {
      create: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  prisma: {
    $transaction: vi.fn(),
    product: {
      findMany: vi.fn(),
    },
    order: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

vi.mock("@/lib/orders", () => ({
  createOrderAtomically: mocks.createOrderAtomically,
  createOrderAtomicallyWithTransaction: mocks.createOrderAtomicallyWithTransaction,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: mocks.getStripe,
}));

vi.mock("@/lib/shop-hours", () => ({
  getShopHours: mocks.getShopHours,
  getShopHoursConfigFromEnv: mocks.getShopHoursConfigFromEnv,
  isShopOpenAt: mocks.isShopOpenAt,
}));

vi.mock("@/lib/email", () => ({
  sendOrderConfirmation: mocks.sendOrderConfirmation,
  sendAdminNewOrderNotification: mocks.sendAdminNewOrderNotification,
}));

vi.mock("@/lib/db", () => ({
  prisma: mocks.prisma,
}));

describe("Stripe checkout/order flow", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));

    mocks.getShopHours.mockReturnValue({
      isOpen: true,
      open: "09:00",
      close: "18:00",
    });
    mocks.getShopHoursConfigFromEnv.mockReturnValue({
      weekday: "09:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed",
      timezone: "Asia/Dubai",
    });
    mocks.isShopOpenAt.mockReturnValue(true);

    mocks.prisma.product.findMany.mockResolvedValue([
      {
        id: "prod_1",
        name: "Latte",
        price: 18,
        images: [],
      },
    ]);

    mocks.getStripe.mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_test_123",
            url: "https://stripe.test/session",
          }),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    });

    mocks.prisma.$transaction.mockImplementation(async (callback) => {
      return callback(mocks.tx);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a Stripe order before returning the checkout URL", async () => {
    mocks.createOrderAtomically.mockResolvedValue({
      id: "ord_1",
      orderNumber: "ORD-001",
    });

    const { POST } = await import("@/app/api/checkout/route");

    const response = await POST(
      new Request("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: "Test User",
          guestEmail: "test@example.com",
          paymentMethod: "STRIPE",
          items: [{ productId: "prod_1", quantity: 2 }],
        }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(mocks.createOrderAtomically).toHaveBeenCalledTimes(1);
    expect(mocks.createOrderAtomically).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentMethod: "STRIPE",
      }),
      expect.any(Object)
    );
  });

  it("marks an existing pending Stripe order as paid when the webhook arrives", async () => {
    const stripe = mocks.getStripe();
    stripe.webhooks.constructEvent.mockReturnValue({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          amount_total: 3600,
          metadata: {
            guestName: "Test User",
            guestEmail: "test@example.com",
            guestPhone: "",
            guestNotes: "",
            items: JSON.stringify([{ productId: "prod_1", quantity: 2 }]),
          },
        },
      },
    });

    mocks.tx.stripeWebhookEvent.create.mockResolvedValue({ id: "evt_123" });
    mocks.tx.order.findUnique.mockResolvedValue({
      id: "ord_1",
      stripeSessionId: "cs_test_123",
      paymentStatus: "PENDING",
      orderNumber: "ORD-001",
    });
    mocks.tx.order.update.mockResolvedValue({ id: "ord_1" });
    mocks.prisma.order.findUniqueOrThrow.mockResolvedValue({
      id: "ord_1",
      orderNumber: "ORD-001",
      items: [],
    });

    const { POST } = await import("@/app/api/webhook/route");

    const response = await POST(
      new Request("http://localhost:3000/api/webhook", {
        method: "POST",
        headers: { "stripe-signature": "test-signature" },
        body: "test-body",
      }) as never
    );

    expect(response.status).toBe(200);
    expect(mocks.tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord_1" },
        data: expect.objectContaining({ paymentStatus: "PAID" }),
      })
    );
  });
});
