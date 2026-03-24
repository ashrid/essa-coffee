"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Info, CreditCard, Store, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onSubmit: (paymentMethod: "STRIPE" | "PAY_ON_PICKUP", pickupTime?: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

// Format date for datetime-local input (YYYY-MM-DDTHH:mm)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Format date for display
function formatPickupTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Get shop hours for a given date
function getShopHours(date: Date): { open: string; close: string } {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) {
    return { open: "closed", close: "closed" }; // Sunday closed
  } else if (day === 6) {
    return { open: "09:00", close: "17:00" }; // Saturday 9AM-5PM
  } else {
    return { open: "09:00", close: "18:00" }; // Weekdays 9AM-6PM
  }
}

// Check if a date is within shop hours
function isWithinShopHours(date: Date): boolean {
  const { open, close } = getShopHours(date);
  if (open === "closed") return false;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return timeString >= open && timeString <= close;
}

export function CheckoutStepPayment({
  cartItems,
  subtotal,
  onSubmit,
  onBack,
  isLoading,
}: CheckoutStepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<"STRIPE" | "PAY_ON_PICKUP">("STRIPE");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupError, setPickupError] = useState<string>("");

  // Calculate minimum pickup time (now + 10 minutes)
  const minPickupTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    return formatDateTimeLocal(now);
  }, []);

  // Calculate maximum pickup time (7 days from now)
  const maxPickupTime = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + 7);
    return formatDateTimeLocal(max);
  }, []);

  const handleSubmit = () => {
    if (selectedMethod === "PAY_ON_PICKUP") {
      if (!pickupTime) {
        setPickupError("Please select a pickup time");
        return;
      }

      const selectedDate = new Date(pickupTime);
      const minDate = new Date(minPickupTime);

      // Validate 10-minute buffer
      if (selectedDate < minDate) {
        setPickupError("Pickup time must be at least 10 minutes from now");
        return;
      }

      // Validate shop hours
      if (!isWithinShopHours(selectedDate)) {
        const { open, close } = getShopHours(selectedDate);
        const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
        if (open === "closed") {
          setPickupError(`We are closed on ${dayName}s. Please select another day.`);
        } else {
          setPickupError(`Pickup time must be between ${open} and ${close} on ${dayName}s.`);
        }
        return;
      }

      setPickupError("");
      onSubmit(selectedMethod, pickupTime);
    } else {
      onSubmit(selectedMethod);
    }
  };

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
            onChange={() => {
              setSelectedMethod("STRIPE");
              setPickupError("");
            }}
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

      {/* Pickup Time Selector - Only for Pay on Pickup */}
      {selectedMethod === "PAY_ON_PICKUP" && (
        <div className="bg-cream-50 border border-cream-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-forest-600" />
            <Label htmlFor="pickupTime" className="font-semibold text-forest-900">
              Select Pickup Time
            </Label>
          </div>
          <p className="text-sm text-forest-600">
            Please select a time at least 10 minutes from now during our business hours.
          </p>
          <Input
            id="pickupTime"
            type="datetime-local"
            value={pickupTime}
            min={minPickupTime}
            max={maxPickupTime}
            onChange={(e) => {
              setPickupTime(e.target.value);
              setPickupError("");
            }}
            className={pickupError ? "border-red-500" : ""}
          />
          {pickupError && (
            <p className="text-sm text-red-500">{pickupError}</p>
          )}
          {pickupTime && !pickupError && (
            <p className="text-sm text-forest-600">
              You selected: <strong>{formatPickupTime(pickupTime)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleSubmit}
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
