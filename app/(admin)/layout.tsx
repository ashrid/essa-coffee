import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  ExternalLink,
  LogOut,
} from "lucide-react";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // No session: middleware handles redirects to login.
  // Render children only (login page renders its own full-page layout).
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-60 bg-forest-600 text-cream-50 flex flex-col h-screen sticky top-0 shrink-0">
        {/* Header */}
        <div className="h-16 px-4 flex items-center border-b border-forest-700 shrink-0">
          <span className="font-bold text-lg text-cream-50">ShopSeeds Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
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
            className="flex items-center gap-3 px-3 py-2 rounded text-sm text-cream-50 hover:bg-forest-500 transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            View Store
          </a>
        </nav>

        {/* Sign Out */}
        <div className="border-t border-forest-500 p-4 shrink-0">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
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

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
}
