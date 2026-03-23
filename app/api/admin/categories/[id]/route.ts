import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import { generateSlug } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, description } = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (name) {
    const slug = generateSlug(name);
    // Check uniqueness excluding current category
    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name }], NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }
    updateData.name = name;
    updateData.slug = slug;
  }

  if (description !== undefined) {
    updateData.description = description ?? null;
  }

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(category);
}
