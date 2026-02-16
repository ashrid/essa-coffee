interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export default function EmptyState({
  title = "Nothing here yet",
  subtitle = "Check back soon for new additions",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Stem */}
        <path
          d="M40 70 L40 35"
          stroke="#52855a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <path
          d="M40 50 C40 50 25 45 22 30 C22 30 38 28 40 45"
          fill="#52855a"
          opacity="0.8"
        />
        {/* Right leaf */}
        <path
          d="M40 42 C40 42 55 37 58 22 C58 22 42 20 40 37"
          fill="#2d6a4f"
          opacity="0.9"
        />
        {/* Top sprout */}
        <path
          d="M40 35 C40 35 38 22 40 15 C42 22 40 35 40 35"
          fill="#52855a"
        />
        {/* Soil mound */}
        <ellipse cx="40" cy="70" rx="16" ry="5" fill="#a08060" opacity="0.4" />
      </svg>

      <div className="text-center">
        <p className="text-forest-900 text-xl font-semibold">{title}</p>
        <p className="text-sage-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
