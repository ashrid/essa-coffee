"use client";

import { useState } from "react";
import { toast } from "sonner";

type OrderStatus = "NEW" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

interface OrderStatusSelectProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "text-blue-700 bg-blue-50 border-blue-200",
  READY: "text-amber-700 bg-amber-50 border-amber-200",
  COMPLETED: "text-green-700 bg-green-50 border-green-200",
  CANCELLED: "text-red-700 bg-red-50 border-red-200",
  REFUNDED: "text-gray-700 bg-gray-50 border-gray-200",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export function OrderStatusSelect({ orderId, currentStatus }: OrderStatusSelectProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  async function handleChange(newStatus: OrderStatus) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update status");
      }

      setStatus(newStatus);
      toast.success(`Order status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      disabled={isLoading}
      className={`text-xs border rounded px-2 py-1 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${STATUS_COLORS[status]}`}
    >
      {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
