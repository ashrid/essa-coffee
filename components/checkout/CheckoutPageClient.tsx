"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import { CheckoutStepContact } from "@/components/checkout/CheckoutStepContact";
import { CheckoutStepPayment } from "@/components/checkout/CheckoutStepPayment";
import { Badge } from "@/components/ui/badge";
import { ShopHoursConfig } from "@/lib/shop-hours";

interface ContactData {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNotes?: string;
  pickupTime?: string;
}

interface CheckoutPageClientProps {
  shopHours: ShopHoursConfig;
  shopAddress: {
    line1: string;
    line2: string;
  };
  hoursSummary: string;
}

export function CheckoutPageClient({
  shopHours,
  shopAddress,
  hoursSummary,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Redirect to cart if empty (but not during order completion)
  useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      router.push("/cart");
    }
  }, [items.length, router, orderComplete]);

  const handleContactNext = (data: ContactData) => {
    setContactData(data);
    setStep(2);
  };

  const handlePaymentSubmit = async (
    paymentMethod: "STRIPE" | "PAY_ON_PICKUP",
    pickupTime?: string
  ) => {
    if (!contactData) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactData,
          paymentMethod,
          pickupTime,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.productName) {
          toast.error(`Out of stock: ${data.productName}`);
        } else {
          toast.error("Something went wrong, please try again");
        }
        setIsLoading(false);
        return;
      }

      if (paymentMethod === "PAY_ON_PICKUP") {
        // Mark order complete to prevent empty cart redirect, then navigate, then clear cart
        setOrderComplete(true);
        router.push(`/order-confirmation?orderId=${data.orderId}`);
        clearCart();
      } else {
        // Stripe redirect
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong, please try again");
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !orderComplete) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Pickup Badge */}
      <div className="mb-6">
        <Badge
          variant="secondary"
          className="bg-forest-100 text-forest-800 hover:bg-forest-100"
        >
          Pickup only — no shipping
        </Badge>
      </div>

      <h1 className="text-3xl font-bold text-forest-900 mb-8">Checkout</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              step === 1
                ? "bg-forest-600 text-white"
                : "bg-forest-100 text-forest-700"
            }`}
          >
            1
          </div>
          <span
            className={`font-medium ${
              step === 1 ? "text-forest-900" : "text-forest-600"
            }`}
          >
            Contact Details
          </span>
        </div>

        <div className="flex-1 h-px bg-cream-200" />

        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
              step === 2
                ? "bg-forest-600 text-white"
                : "bg-cream-200 text-sage-500"
            }`}
          >
            2
          </div>
          <span
            className={`font-medium ${
              step === 2 ? "text-forest-900" : "text-sage-500"
            }`}
          >
            Payment
          </span>
        </div>
      </div>

      {/* Step Content */}
      {step === 1 ? (
        <CheckoutStepContact
          onNext={handleContactNext}
          defaultValues={contactData || undefined}
        />
      ) : contactData ? (
        <CheckoutStepPayment
          contactData={contactData}
          cartItems={items}
          subtotal={subtotal}
          onSubmit={handlePaymentSubmit}
          onBack={() => setStep(1)}
          isLoading={isLoading}
          shopHours={shopHours}
          shopAddress={shopAddress}
          hoursSummary={hoursSummary}
        />
      ) : null}
    </div>
  );
}
