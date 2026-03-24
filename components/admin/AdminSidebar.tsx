"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
];

interface AdminSidebarProps {
  onSignOut: () => void;
}

export function AdminSidebar({ onSignOut }: AdminSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-forest-600 text-cream-50 flex items-center justify-between px-4 z-50">
        <span className="font-bold text-lg">Essa Cafe Admin</span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-forest-500 rounded transition-colors"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: sticky, Mobile: fixed overlay */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-60 bg-forest-600 text-cream-50 flex flex-col h-screen shrink-0
          transition-transform duration-200 ease-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header - Hidden on mobile (shown in top bar) */}
        <div className="hidden lg:flex h-16 px-4 items-center border-b border-forest-700 shrink-0">
          <span className="font-bold text-lg text-cream-50">Essa Cafe Admin</span>
        </div>

        {/* Close button for mobile */}
        <div className="lg:hidden flex justify-end p-4 pb-0">
          <button
            onClick={closeMobileMenu}
            className="p-2 hover:bg-forest-500 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-3 py-2 rounded text-sm text-cream-50 hover:bg-forest-500 transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          <div className="my-2 border-t border-forest-500" />

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm text-cream-50 hover:bg-forest-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            View Store
          </a>
        </nav>

        {/* Sign Out */}
        <div className="border-t border-forest-500 p-4 shrink-0">
          <form action={onSignOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-cream-50 hover:bg-forest-500 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
