import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";

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

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export default function ProductGrid({ products, emptyMessage }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyMessage || "No products found"}
        subtitle="Try adjusting your filters or search terms"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
