import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let slug = generateSlug(data.name);

  // Check slug uniqueness; append random suffix if taken
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${randomUUID().slice(0, 8)}`;
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description ?? null,
      price: data.price,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured,
      categoryId: data.categoryId,
      images: data.images ?? [],
    },
    include: { category: true },
  });

  revalidatePath("/shop");
  revalidatePath("/");

  return NextResponse.json(product, { status: 201 });
}
