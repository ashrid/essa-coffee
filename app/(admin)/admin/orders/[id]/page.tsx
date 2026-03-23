"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type OrderStatus = "NEW" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestNotes: string | null;
  status: OrderStatus;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-gray-400">
        Order not found.{" "}
        <Link href="/admin/orders" className="text-forest-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Order #{order.orderNumber.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-gray-800 text-sm">Customer Information</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="text-gray-800">{order.guestName}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="text-gray-800">{order.guestEmail}</span>
          </div>
          {order.guestPhone && (
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              <span className="text-gray-800">{order.guestPhone}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Payment:</span>{" "}
            <span className="text-gray-800">
              {order.paymentMethod === "STRIPE" ? "Credit Card" : "Pay on Pickup"}
            </span>
          </div>
        </div>
        {order.guestNotes && (
          <div className="text-sm">
            <span className="text-gray-500">Notes:</span>{" "}
            <span className="text-gray-800 italic">{order.guestNotes}</span>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200"
            >
              {item.product.images[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                  No img
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity} × {formatPrice(Number(item.price))}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                {formatPrice(Number(item.price) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <span className="text-gray-500 text-sm">Order Total</span>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(Number(order.total))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
