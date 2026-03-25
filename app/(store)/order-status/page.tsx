import { Suspense } from 'react';
import { OrderStatusContent } from './OrderStatusContent';
import { getHoursSummary } from '@/lib/shop-hours';

export default function OrderStatusPage() {
  // Read shop info from environment variables on the server
  const shopAddress = {
    line1: process.env.SHOP_ADDRESS_LINE1 || "123 Green Street",
    line2: process.env.SHOP_ADDRESS_LINE2 || "Your City, State 00000",
  };

  const hoursSummary = getHoursSummary();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full mx-auto mb-4" />
            <p className="text-forest-600">Loading...</p>
          </div>
        }
      >
        <OrderStatusContent shopAddress={shopAddress} hoursSummary={hoursSummary} />
      </Suspense>
    </div>
  );
}
