import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import ProductImageCarousel from "@/components/store/ProductImageCarousel";
import AvailabilityBadge from "@/components/store/StockBadge";
import RelatedProducts from "@/components/store/RelatedProducts";
import { sanitizeRichText, stripHtmlToPlainText } from "@/lib/sanitize-rich-text";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "./AddToCartButton";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all products (ISR)
export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { slug: true },
  });

  return products.map((p) => ({ slug: p.slug }));
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: { category: true },
  });

  if (!product) {
    return {
      title: "Product Not Found | Essa Cafe",
    };
  }

  const plainDescription = stripHtmlToPlainText(product.description);

  return {
    title: `${product.name} | Essa Cafe`,
    description:
      plainDescription.slice(0, 160) ||
      `Shop ${product.name} at Essa Cafe. Local pickup available.`,
    openGraph: {
      title: product.name,
      description: plainDescription.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: {
      category: {
        include: {
          products: {
            where: {
              deletedAt: null,
              slug: { not: slug },
              isAvailable: true,
            },
            take: 3,
            include: { category: true },
          },
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const isUnavailable = !product.isAvailable;
  const relatedProducts = product.category.products;
  const sanitizedDescription = sanitizeRichText(product.description);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Back Link */}
      <Link
        href="/shop"
        className="inline-flex items-center text-forest-600 hover:text-forest-700 font-medium mb-6"
      >
        ← Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-8 lg:gap-12">
        {/* Left: Image Carousel */}
        <ProductImageCarousel
          images={product.images}
          productName={product.name}
        />

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Category Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-sage-500 bg-sage-100 px-3 py-1 rounded-full">
              {product.category.name}
            </span>
          </div>

          {/* Product Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-forest-900">
            {product.name}
          </h1>

          {/* Price and Stock */}
          <div className="flex items-center gap-4">
            <span className="text-2xl md:text-3xl font-bold text-forest-600">
              {formatPrice(Number(product.price))}
            </span>
            <AvailabilityBadge isAvailable={product.isAvailable} />
          </div>

          {/* Add to Cart Button */}
          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              images: product.images,
              isAvailable: product.isAvailable,
              slug: product.slug,
            }}
            disabled={isUnavailable}
          />

          {/* Description */}
          {sanitizedDescription && (
            <div className="pt-6 border-t border-cream-200">
              <h2 className="text-lg font-semibold text-forest-900 mb-3">
                Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-forest-700"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        products={relatedProducts}
        title={`More from ${product.category.name}`}
      />
    </div>
  );
}
