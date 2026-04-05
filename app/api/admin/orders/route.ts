import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.order.count(),
  ]);

  return NextResponse.json({ orders, total, limit, offset });
}
