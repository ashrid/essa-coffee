import { prisma } from "@/lib/db";
import FeaturedProducts from "@/components/store/FeaturedProducts";
import ProductGrid from "@/components/store/ProductGrid";
import Link from "next/link";

export const metadata = {
  title: "ShopSeeds - Plants & Seeds for Local Pickup",
  description: "Browse our collection of houseplants, seeds, and succulents. Order online and pick up locally.",
};

export default async function HomePage() {
  // Fetch featured products (in stock only)
  const featuredProducts = await prisma.product.findMany({
    where: {
      isFeatured: true,
      isAvailable: true,
    },
    take: 4,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all products for the catalog section
  const allProducts = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-forest-600 text-cream-50 py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Plants & Seeds for Your Space
            </h1>
            <p className="text-lg md:text-xl text-cream-100 mb-6">
              Curated houseplants, seeds, and succulents. Order online, pick up locally.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center bg-cream-50 text-forest-600 font-semibold px-6 py-3 rounded-lg hover:bg-cream-100 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <FeaturedProducts products={featuredProducts} />
      </section>

      {/* Full Catalog Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-forest-900">
            Our Collection
          </h2>
          <Link
            href="/shop"
            className="text-forest-600 hover:text-forest-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
        <ProductGrid products={allProducts} />
      </section>
    </div>
  );
}
