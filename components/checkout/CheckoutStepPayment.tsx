"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, CreditCard, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

interface CheckoutStepPaymentProps {
  contactData: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    guestNotes?: string;
  };
  cartItems: CartItem[];
  subtotal: number;
  onSubmit: (paymentMethod: "STRIPE" | "PAY_ON_PICKUP") => void;
  onBack: () => void;
  isLoading: boolean;
}

export function CheckoutStepPayment({
  cartItems,
  subtotal,
  onSubmit,
  onBack,
  isLoading,
}: CheckoutStepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<"STRIPE" | "PAY_ON_PICKUP">("STRIPE");

  return (
    <div className="space-y-6">
      {/* Pickup Info Summary */}
      <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-forest-900">
              Pickup at 123 Green Street
            </p>
            <p className="text-sm text-forest-700">
              Mon–Fri 9AM–6PM, Sat 9AM–5PM
            </p>
            <Link
              href="/pickup-info"
              className="text-sm text-forest-600 hover:text-forest-700 underline mt-1 inline-block"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="border border-cream-200 rounded-lg p-4">
        <h3 className="font-semibold text-forest-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="text-forest-700">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-forest-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-cream-200 mt-4 pt-4 flex justify-between">
          <span className="font-semibold text-forest-900">Subtotal</span>
          <span className="font-bold text-lg text-forest-900">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h3 className="font-semibold text-forest-900">Payment Method</h3>

        <label
          className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedMethod === "STRIPE"
              ? "border-forest-600 bg-forest-50"
              : "border-cream-200 hover:border-forest-300"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="STRIPE"
            checked={selectedMethod === "STRIPE"}
            onChange={() => setSelectedMethod("STRIPE")}
            className="w-4 h-4 text-forest-600"
          />
          <div className="flex items-center gap-3 flex-1">
            <CreditCard className="w-5 h-5 text-forest-600" />
            <div>
              <p className="font-medium text-forest-900">Pay now with card</p>
              <p className="text-sm text-forest-600">
                Secure payment via Stripe
              </p>
            </div>
          </div>
        </label>

        <label
          className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedMethod === "PAY_ON_PICKUP"
              ? "border-forest-600 bg-forest-50"
              : "border-cream-200 hover:border-forest-300"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="PAY_ON_PICKUP"
            checked={selectedMethod === "PAY_ON_PICKUP"}
            onChange={() => setSelectedMethod("PAY_ON_PICKUP")}
            className="w-4 h-4 text-forest-600"
          />
          <div className="flex items-center gap-3 flex-1">
            <Store className="w-5 h-5 text-forest-600" />
            <div>
              <p className="font-medium text-forest-900">Pay on pickup</p>
              <p className="text-sm text-forest-600">
                Cash or card when you pick up
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => onSubmit(selectedMethod)}
          disabled={isLoading}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Place Order"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full text-forest-600 hover:text-forest-700"
        >
          ← Back to Contact Details
        </Button>
      </div>
    </div>
  );
}
