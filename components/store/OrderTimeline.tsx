'use client';

type OrderStatus = 'NEW' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

interface OrderTimelineProps {
  status: OrderStatus;
}

const STEPS = [
  { status: 'NEW', label: 'Order Placed', description: 'We received your order' },
  { status: 'READY', label: 'Being Prepared', description: 'Your order is being prepared' },
  { status: 'READY', label: 'Ready for Pickup', description: 'Come pick up your order' },
  { status: 'COMPLETED', label: 'Picked Up', description: 'Order completed' },
] as const;

export function OrderTimeline({ status }: OrderTimelineProps) {
  // Cancelled or refunded orders show a different timeline
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700 font-medium">
          This order has been {status === 'CANCELLED' ? 'cancelled' : 'refunded'}.
        </p>
        <p className="text-red-600 text-sm mt-1">
          Please contact us if you have any questions.
        </p>
      </div>
    );
  }

  const getStepState = (stepIndex: number) => {
    const statusIndex = STEPS.findIndex((s) => s.status === status);
    // Special case: READY status means both step 1 and 2 are active
    if (status === 'READY') {
      if (stepIndex <= 1) return 'completed';
      if (stepIndex === 2) return 'current';
      return 'pending';
    }
    // For other statuses, find the furthest matching step
    if (stepIndex < statusIndex) return 'completed';
    if (stepIndex === statusIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="relative">
      {STEPS.map((step, index) => {
        const state = getStepState(index);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={index} className="flex gap-4">
            {/* Line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  state === 'completed'
                    ? 'bg-green-500 text-white'
                    : state === 'current'
                    ? 'bg-forest-600 text-white ring-4 ring-forest-100'
                    : 'bg-cream-200 text-forest-400'
                }`}
              >
                {state === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-12 mt-1 ${
                    state === 'completed' ? 'bg-green-500' : 'bg-cream-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 ${state === 'pending' ? 'opacity-50' : ''}`}>
              <p
                className={`font-medium ${
                  state === 'current' ? 'text-forest-900' : 'text-forest-700'
                }`}
              >
                {step.label}
              </p>
              <p className="text-sm text-forest-600">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
