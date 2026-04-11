import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { getHoursSummary, getShopHoursConfigFromEnv } from "@/lib/shop-hours";

export default function CheckoutPage() {
  const shopHoursConfig = getShopHoursConfigFromEnv();

  // Read shop address from environment variables
  const shopAddress = {
    line1: process.env.SHOP_ADDRESS_LINE1 || "123 Green Street",
    line2: process.env.SHOP_ADDRESS_LINE2 || "Your City, State 00000",
  };

  // Get formatted hours summary
  const hoursSummary = getHoursSummary();

  return (
    <CheckoutPageClient
      shopHours={shopHoursConfig}
      shopAddress={shopAddress}
      hoursSummary={hoursSummary}
    />
  );
}
