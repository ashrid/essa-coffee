"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Menu, Leaf } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, openDrawer } = useCartStore();

  const navLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/pickup-info", label: "Pickup Info" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-cream-50 border-b border-cream-200">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-forest-600 font-bold text-xl hover:text-forest-700 transition-colors"
        >
          <Leaf className="w-5 h-5" />
          Essa Cafe
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-forest-600 hover:text-forest-700 font-medium transition-colors text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: cart + mobile menu */}
        <div className="flex items-center gap-3">
          {/* Cart icon — opens drawer on click */}
          <button
            onClick={openDrawer}
            className="relative p-2 text-forest-600 hover:text-forest-700 transition-colors"
            aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ", empty"}`}
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-forest-600 text-cream-50 text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 text-forest-600 hover:text-forest-700 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-cream-50 w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8 pt-2">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-forest-600 font-bold text-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Leaf className="w-4 h-4" />
                    Essa Cafe
                  </Link>
                </div>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-2 text-forest-600 hover:bg-cream-100 hover:text-forest-700 rounded-md font-medium transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      openDrawer();
                    }}
                    className="px-3 py-2 text-forest-600 hover:bg-cream-100 hover:text-forest-700 rounded-md font-medium transition-colors flex items-center gap-2 text-left"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {totalItems > 0 && (
                      <span className="bg-forest-600 text-cream-50 text-xs rounded-full px-1.5 py-0.5 font-medium">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
