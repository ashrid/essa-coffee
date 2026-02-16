"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/cart-store";
import { CartItem } from "@/components/store/CartItem";
import { CartSummary } from "@/components/store/CartSummary";
import EmptyState from "@/components/store/EmptyState";

export function CartDrawer() {
  const { items, isDrawerOpen, openDrawer, closeDrawer, totalItems, subtotal } =
    useCartStore();

  return (
    <Sheet
      open={isDrawerOpen}
      onOpenChange={(open) => (open ? openDrawer() : closeDrawer())}
    >
      <SheetContent side="right" className="bg-white w-full sm:max-w-sm flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-cream-200">
          <SheetTitle className="text-forest-900 text-lg font-bold">
            Your Cart {totalItems > 0 && `(${totalItems})`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="pt-6">
              <EmptyState
                title="Your cart is empty"
                subtitle="Add some plants or seeds to get started"
              />
              <div className="text-center mt-4">
                <Link
                  href="/shop"
                  onClick={closeDrawer}
                  className="text-forest-600 hover:text-forest-700 underline text-sm font-medium"
                >
                  Start shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-cream-200">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 pb-6">
            <CartSummary
              subtotal={subtotal}
              itemCount={totalItems}
              ctaHref="/cart"
              ctaLabel="View Cart"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
