"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCartStore, CartItem as CartItemType } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleQuantityChange = (newQty: number) => {
    if (newQty <= 0) {
      removeItem(item.productId);
    } else {
      updateQuantity(item.productId, newQty);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      handleQuantityChange(val);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Product image */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-cream-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-sage-100 flex items-center justify-center">
            <span className="text-sage-400 text-xs">No image</span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/shop/${item.slug}`}
          className="text-sm font-medium text-forest-900 hover:text-forest-600 line-clamp-2"
        >
          {item.name}
        </Link>
        <p className="text-xs text-sage-500 mt-0.5">{formatPrice(item.price)}</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-1 mt-1.5">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-cream-200 bg-white text-forest-600 hover:bg-cream-100 text-sm font-medium transition-colors"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={item.stockQuantity}
            value={item.quantity}
            onChange={handleInputChange}
            className="w-10 h-6 text-center text-sm border border-cream-200 rounded bg-white text-forest-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label="Quantity"
          />
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={item.quantity >= item.stockQuantity}
            className="w-6 h-6 flex items-center justify-center rounded border border-cream-200 bg-white text-forest-600 hover:bg-cream-100 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-semibold text-forest-900">
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          onClick={() => removeItem(item.productId)}
          className="text-red-500 hover:text-red-700 transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
