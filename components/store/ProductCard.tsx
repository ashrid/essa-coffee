"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import StockBadge from "@/components/store/StockBadge";
import { formatPrice } from "@/lib/utils";

interface ProductCardProduct {
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

interface ProductCardProps {
  product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = product.stockQuantity === 0;

  const handleAddToCart = () => {
    useCartStore.getState().addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images[0] ?? null,
      slug: product.slug,
      stockQuantity: product.stockQuantity,
    });
    toast.success("Added to cart");
  };

  return (
    <div
      className={`group flex flex-col bg-white rounded-xl border border-cream-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow${
        isOutOfStock ? " opacity-60 grayscale" : ""
      }`}
    >
      {/* Product image */}
      <Link href={`/shop/${product.slug}`} className="block aspect-square overflow-hidden">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-sage-100 flex items-center justify-center">
            <span className="text-sage-400 text-sm">No image</span>
          </div>
        )}
      </Link>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-start justify-between gap-1">
          <div>
            <Link
              href={`/shop/${product.slug}`}
              className="font-semibold text-forest-900 text-sm leading-tight line-clamp-2 hover:text-forest-600 transition-colors"
            >
              {product.name}
            </Link>
            <p className="text-xs text-sage-500 mt-0.5">{product.category.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-forest-600 font-semibold text-sm">
            {formatPrice(Number(product.price))}
          </span>
          <StockBadge
            stockQuantity={product.stockQuantity}
            lowStockThreshold={product.lowStockThreshold}
          />
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="mt-auto w-full bg-forest-600 hover:bg-forest-700 disabled:bg-sage-200 disabled:cursor-not-allowed text-cream-50 disabled:text-sage-400 text-sm font-medium py-2 px-3 rounded-md transition-colors"
        >
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
