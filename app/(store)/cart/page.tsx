"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { CartItem } from "@/components/store/CartItem";
import { CartSummary } from "@/components/store/CartSummary";
import EmptyState from "@/components/store/EmptyState";

export default function CartPage() {
  const { items, totalItems, subtotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold text-forest-900 mb-8">Your Cart</h1>
        <EmptyState
          title="Your cart is empty"
          subtitle="Add some plants or seeds to your cart before checking out"
        />
        <div className="text-center mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center text-forest-600 hover:text-forest-700 font-medium underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold text-forest-900 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8">
        {/* Cart items */}
        <div>
          <div className="bg-white rounded-xl border border-cream-200 divide-y divide-cream-200 px-6">
            {items.map((item) => (
              <CartItem key={item.productId} item={item} />
            ))}
          </div>

          <div className="mt-4">
            <Link
              href="/shop"
              className="text-forest-600 hover:text-forest-700 text-sm font-medium underline"
            >
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Cart summary */}
        <div>
          <div className="bg-white rounded-xl border border-cream-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-forest-900 mb-4">Order Summary</h2>
            <CartSummary
              subtotal={subtotal}
              itemCount={totalItems}
              ctaHref="/checkout"
              ctaLabel="Proceed to Checkout"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
