interface AvailabilityBadgeProps {
  isAvailable: boolean;
}

export default function AvailabilityBadge({ isAvailable }: AvailabilityBadgeProps) {
  if (isAvailable) {
    return (
      <span className="bg-sage-100 text-sage-500 text-xs px-2 py-0.5 rounded-full font-medium">
        Available
      </span>
    );
  }

  return (
    <span className="bg-forest-100 text-forest-500 text-xs px-2 py-0.5 rounded-full font-medium">
      Unavailable
    </span>
  );
}

// Named export alias so any existing code using StockBadge named export still works
export { AvailabilityBadge };
