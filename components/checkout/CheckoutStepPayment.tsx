"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Info, CreditCard, Store, Loader2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Generate time slots in 5-minute increments
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const h = String(hour).padStart(2, "0");
      const m = String(minute).padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

// Get shop hours for a given date
function getShopHours(date: Date): { open: string; close: string; isOpen: boolean } {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) {
    return { open: "closed", close: "closed", isOpen: false };
  } else if (day === 6) {
    return { open: "09:00", close: "17:00", isOpen: true };
  } else {
    return { open: "09:00", close: "18:00", isOpen: true };
  }
}

// Check if a time is within shop hours for a given date
function isWithinShopHours(date: Date, timeString: string): boolean {
  const { open, close, isOpen } = getShopHours(date);
  if (!isOpen) return false;
  return timeString >= open && timeString <= close;
}

// Format pickup time for display
function formatPickupTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function CheckoutStepPayment({
  cartItems,
  subtotal,
  onSubmit,
  onBack,
  isLoading,
}: CheckoutStepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<"STRIPE" | "PAY_ON_PICKUP">("PAY_ON_PICKUP");
  const [selectedDay, setSelectedDay] = useState<"today" | "tomorrow">("today");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [pickupError, setPickupError] = useState<string>("");

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Calculate selected pickup date
  const selectedPickupDate = useMemo(() => {
    const date = new Date();
    if (selectedDay === "tomorrow") {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }, [selectedDay]);

  // Check if selected time is outside business hours
  const isOutsideHours = useMemo(() => {
    if (!selectedTime) return false;
    return !isWithinShopHours(selectedPickupDate, selectedTime);
  }, [selectedPickupDate, selectedTime]);

  // Get warning message from env var
  const pickupWarningMessage = process.env.NEXT_PUBLIC_PICKUP_WARNING_MESSAGE ||
    "Please note our business hours. We'll prepare your order for your selected time.";

  const handleSubmit = () => {
    if (selectedMethod === "PAY_ON_PICKUP") {
      if (!selectedTime) {
        setPickupError("Please select a pickup time");
        return;
      }

      // Construct full pickup datetime
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const pickupDate = new Date(selectedPickupDate);
      pickupDate.setHours(hours, minutes, 0, 0);

      // Validate 10-minute buffer
      const minDate = new Date();
      minDate.setMinutes(minDate.getMinutes() + 10);
      if (pickupDate < minDate) {
        setPickupError("Pickup time must be at least 10 minutes from now");
        return;
      }

      setPickupError("");
      onSubmit(selectedMethod, pickupDate.toISOString());
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
      </div>

      {/* Pickup Time Selector - Only for Pay on Pickup */}
      {selectedMethod === "PAY_ON_PICKUP" && (
        <div className="bg-cream-50 border border-cream-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-forest-600" />
            <Label className="font-semibold text-forest-900">
              Select Pickup Time
            </Label>
          </div>
          <p className="text-sm text-forest-600">
            Please select a time at least 10 minutes from now.
          </p>

          {/* Day Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedDay === "today" ? "default" : "outline"}
              onClick={() => {
                setSelectedDay("today");
                setPickupError("");
              }}
              className={`flex-1 ${
                selectedDay === "today"
                  ? "bg-forest-600 hover:bg-forest-700"
                  : "border-cream-300"
              }`}
            >
              Today
            </Button>
            <Button
              type="button"
              variant={selectedDay === "tomorrow" ? "default" : "outline"}
              onClick={() => {
                setSelectedDay("tomorrow");
                setPickupError("");
              }}
              className={`flex-1 ${
                selectedDay === "tomorrow"
                  ? "bg-forest-600 hover:bg-forest-700"
                  : "border-cream-300"
              }`}
            >
              Tomorrow
            </Button>
          </div>

          {/* Time Selector */}
          <Select
            value={selectedTime}
            onValueChange={(value) => {
              setSelectedTime(value);
              setPickupError("");
            }}
          >
            <SelectTrigger className={pickupError ? "border-red-500" : ""}>
              <SelectValue placeholder="Select a time" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {pickupError && (
            <p className="text-sm text-red-500">{pickupError}</p>
          )}

          {/* Warning for outside business hours */}
          {isOutsideHours && (
            <div className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{pickupWarningMessage}</p>
            </div>
          )}

          {selectedTime && !pickupError && (
            <p className="text-sm text-forest-600">
              You selected:{" "}
              <strong>
                {selectedDay === "today" ? "Today" : "Tomorrow"} at {selectedTime}
              </strong>
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
