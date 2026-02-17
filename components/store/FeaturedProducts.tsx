import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toString(): string };
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  category: {
    name: string;
  };
}

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      <h2 className="text-2xl md:text-3xl font-bold text-forest-900 mb-6 md:mb-8">
        Featured Plants
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
