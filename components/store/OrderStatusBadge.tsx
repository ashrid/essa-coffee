'use client';

type OrderStatus = 'NEW' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: 'text-blue-700 bg-blue-50 border-blue-200',
  READY: 'text-amber-700 bg-amber-50 border-amber-200',
  COMPLETED: 'text-green-700 bg-green-50 border-green-200',
  CANCELLED: 'text-red-700 bg-red-50 border-red-200',
  REFUNDED: 'text-gray-700 bg-gray-50 border-gray-200',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'New',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
