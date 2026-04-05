"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type OrderStatus = "NEW" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

interface OrderItem {
  id: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_TABS: { label: string; value: OrderStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled/Refunded", value: "CANCELLED" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | "ALL">("ALL");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders?limit=100");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "CANCELLED") return o.status === "CANCELLED" || o.status === "REFUNDED";
    return o.status === activeTab;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? "border-forest-600 text-forest-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Items</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
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
                  <td className="px-4 py-3 text-gray-500 text-xs">{order.guestEmail}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatPrice(Number(order.total))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {order.paymentMethod === "STRIPE" ? "Card" : "Pickup"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect
                      orderId={order.id}
                      currentStatus={order.status}
                      onStatusChange={handleStatusChange}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
