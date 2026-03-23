"use client";

import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    isAvailable: boolean;
    slug: string;
  };
  disabled?: boolean;
}

export default function AddToCartButton({
  product,
  disabled,
}: AddToCartButtonProps) {
  const handleAddToCart = () => {
    useCartStore.getState().addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      slug: product.slug,
      isAvailable: product.isAvailable,
    });
    toast.success("Added to cart");
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled}
      className="w-full bg-forest-600 hover:bg-forest-700 disabled:bg-sage-200 disabled:cursor-not-allowed disabled:text-sage-400 text-cream-50 font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
    >
      {disabled ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
