import { prisma } from "@/lib/db";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Low stock: fetch all products and count those where stock <= threshold
  const [newOrdersCount, allProducts, todayRevenueResult, recentOrders] =
    await Promise.all([
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.product.findMany({
        select: { isAvailable: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          paymentMethod: "STRIPE",
        },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          guestName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

  const lowStockCount = allProducts.filter(
    (p: { isAvailable: boolean }) => !p.isAvailable
  ).length;

  return {
    newOrdersCount,
    lowStockCount,
    todayRevenue: Number(todayRevenueResult._sum.total ?? 0),
    recentOrders,
  };
}

type RecentOrder = {
  id: string;
  orderNumber: string;
  guestName: string;
  total: { toString: () => string } | number | string;
  status: string;
  createdAt: Date;
};

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  READY: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default async function AdminDashboardPage() {
  const { newOrdersCount, lowStockCount, todayRevenue, recentOrders } =
    await getStats();

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">ShopSeeds admin overview</p>
      </div>

      <DashboardStats
        newOrdersCount={newOrdersCount}
        lowStockCount={lowStockCount}
        todayRevenue={todayRevenue}
      />

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link
          href="/admin/products/new"
          className="bg-forest-600 hover:bg-forest-700 text-cream-50 text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          Add Product
        </Link>
        <Link
          href="/admin/orders"
          className="bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 transition-colors"
        >
          View All Orders
        </Link>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(recentOrders as RecentOrder[]).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-forest-600 hover:underline font-mono text-xs"
                      >
                        #{order.orderNumber.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.guestName}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
