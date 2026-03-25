import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";
import { ShopHoursConfig } from "@/lib/shop-hours";

export default function CheckoutPage() {
  // Read shop hours from environment variables on the server
  const shopHoursConfig: ShopHoursConfig = {
    weekday: process.env.SHOP_HOURS_WEEKDAY || "09:00-18:00",
    saturday: process.env.SHOP_HOURS_SATURDAY || "09:00-17:00",
    sunday: process.env.SHOP_HOURS_SUNDAY || "closed",
  };

  return <CheckoutPageClient shopHours={shopHoursConfig} />;
}
