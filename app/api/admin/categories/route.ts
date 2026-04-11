import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { getCategoryStorefrontPaths, revalidateStorefrontPaths } from "@/lib/store-revalidation";
import { categorySchema } from "@/lib/validators";
import { generateSlug } from "@/lib/utils";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, description } = parsed.data;
  const slug = generateSlug(name);

  // Check slug/name uniqueness
  const existing = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A category with this name already exists" },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: { name, slug, description: sanitizeRichText(description) },
    include: { _count: { select: { products: true } } },
  });

  revalidateStorefrontPaths(getCategoryStorefrontPaths([]));

  return NextResponse.json(category, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const deleteSchema = z.object({ id: z.string().cuid() });
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }
  const { id } = parsed.data;

  // Check product count
  const productCount = await prisma.product.count({
    where: { categoryId: id },
  });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete category with ${productCount} product(s). Reassign products first.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  revalidateStorefrontPaths(getCategoryStorefrontPaths([]));

  return NextResponse.json({ success: true });
}
