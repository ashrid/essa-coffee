import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { ShopHoursConfig, getHoursSummary } from "@/lib/shop-hours";

export default function CheckoutPage() {
  // Read shop hours from environment variables on the server
  const shopHoursConfig: ShopHoursConfig = {
    weekday: process.env.SHOP_HOURS_WEEKDAY || "09:00-18:00",
    saturday: process.env.SHOP_HOURS_SATURDAY || "09:00-17:00",
    sunday: process.env.SHOP_HOURS_SUNDAY || "closed",
  };

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
