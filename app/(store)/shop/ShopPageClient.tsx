"use client";

import { useState, useMemo } from "react";
import SearchBar from "@/components/store/SearchBar";
import ProductGrid from "@/components/store/ProductGrid";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  category: {
    name: string;
  };
}

interface ShopPageClientProps {
  products: Product[];
}

export default function ShopPageClient({ products }: ShopPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.category.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar value={searchQuery} onSearch={setSearchQuery} />

      {/* Product Grid */}
      <ProductGrid
        products={filteredProducts}
        emptyMessage={
          searchQuery
            ? `No products found for "${searchQuery}"`
            : "No products match your filters"
        }
      />
    </div>
  );
}
