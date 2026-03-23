interface StockBadgeProps {
  isAvailable: boolean;
}

export default function StockBadge({ isAvailable }: StockBadgeProps) {
  if (!isAvailable) {
    return (
      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
        Unavailable
      </span>
    );
  }

  return (
    <span className="bg-sage-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
      Available
    </span>
  );
}

export { StockBadge };
