import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { getProductStorefrontPaths, revalidateStorefrontPaths } from "@/lib/store-revalidation";
import { generateSlug } from "@/lib/utils";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { ...data };

  if (data.description !== undefined) {
    updateData.description = sanitizeRichText(data.description);
  }

  // Re-generate slug if name changed
  if (data.name) {
    let newSlug = generateSlug(data.name);
    const existing = await prisma.product.findFirst({
      where: { slug: newSlug, NOT: { id } },
    });
    if (existing) {
      newSlug = `${newSlug}-${randomUUID().slice(0, 8)}`;
    }
    updateData.slug = newSlug;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });

  revalidateStorefrontPaths(
    getProductStorefrontPaths({
      previousSlug: existingProduct.slug,
      nextSlug: product.slug,
    })
  );

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if product has order items
  const orderItemCount = await prisma.orderItem.count({
    where: { productId: id },
  });

  if (orderItemCount > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete product that has order history. Remove from all orders first.",
      },
      { status: 409 }
    );
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  revalidateStorefrontPaths(
    getProductStorefrontPaths({ previousSlug: existingProduct.slug })
  );

  return NextResponse.json({ success: true });
}
