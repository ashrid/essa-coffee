import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toString(): string };
  images: string[];
  isAvailable: boolean;
  category: {
    name: string;
  };
}

interface RelatedProductsProps {
  products: Product[];
  title?: string;
}

export default function RelatedProducts({
  products,
  title = "Related Products",
}: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-12 border-t border-cream-200">
      <h2 className="text-xl md:text-2xl font-bold text-forest-900 mb-6">
        {title}
      </h2>

      {/* Mobile: horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:hidden -mx-4 px-4">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-48">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
