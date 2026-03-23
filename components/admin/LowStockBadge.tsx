interface LowStockBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
}

export function LowStockBadge({ stockQuantity, lowStockThreshold }: LowStockBadgeProps) {
  if (stockQuantity > lowStockThreshold) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
      Low Stock: {stockQuantity}
    </span>
  );
}
