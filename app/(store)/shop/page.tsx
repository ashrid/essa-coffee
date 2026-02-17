import { prisma } from "@/lib/db";
import CategorySidebar from "@/components/store/CategorySidebar";
import ShopPageClient from "./ShopPageClient";

export const metadata = {
  title: "Shop All Plants & Seeds | ShopSeeds",
  description: "Browse our complete collection of houseplants, seeds, and succulents.",
};

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    inStock?: string;
    sort?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const inStockOnly = params.inStock === "true";
  const sortParam = params.sort;

  // Fetch all categories for the sidebar
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // Build where clause for products
  const where: {
    category?: { slug: string };
    stockQuantity?: { gt: number };
  } = {};

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (inStockOnly) {
    where.stockQuantity = { gt: 0 };
  }

  // Build orderBy clause
  let orderBy: { price?: "asc" | "desc"; createdAt?: "desc" } = {
    createdAt: "desc",
  };

  if (sortParam === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sortParam === "price-desc") {
    orderBy = { price: "desc" };
  }

  // Fetch products with filters
  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold text-forest-900 mb-2">
        Shop All Plants & Seeds
      </h1>
      <p className="text-sage-500 mb-8">
        {products.length} product{products.length !== 1 ? "s" : ""} available
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-8">
        {/* Sidebar */}
        <CategorySidebar categories={categories} />

        {/* Product Grid with Client-Side Search */}
        <ShopPageClient products={products} />
      </div>
    </div>
  );
}
