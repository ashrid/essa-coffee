import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { orderStatusSchema } from "@/lib/validators";
import { generateQRToken, sendOrderReadyEmail, type OrderWithItems } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = orderStatusSchema.safeParse(body.status);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const newStatus = parsed.data;

  // Fetch current order to check if status is changing to READY
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });

  if (!currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const isChangingToReady = newStatus === "READY" && currentOrder.status !== "READY";

  // Prepare update data
  const updateData: {
    status: typeof newStatus;
    qrToken?: string;
    qrTokenExpiresAt?: Date;
  } = {
    status: newStatus,
  };

  // Generate QR token if changing to READY
  let qrToken: string | undefined;
  if (isChangingToReady) {
    const qrData = generateQRToken();
    qrToken = qrData.token;
    updateData.qrToken = qrData.token;
    updateData.qrTokenExpiresAt = qrData.expiresAt;
  }

  // Update order
  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  // Send order ready email if status changed to READY
  if (isChangingToReady && qrToken) {
    // Fire and forget - don't block the response on email sending
    sendOrderReadyEmail(currentOrder as OrderWithItems, qrToken).catch((error) => {
      console.error("Failed to send order ready email:", error);
    });
  }

  return NextResponse.json(order);
}
