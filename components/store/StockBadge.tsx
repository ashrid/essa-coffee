interface StockBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
}

export default function StockBadge({ stockQuantity, lowStockThreshold }: StockBadgeProps) {
  if (stockQuantity === 0) {
    return (
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
        Out of Stock
      </span>
    );
  }

  if (stockQuantity <= lowStockThreshold) {
    return (
      <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
        Low Stock
      </span>
    );
  }

  return (
    <span className="bg-sage-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
      In Stock
    </span>
  );
}

export { StockBadge };
