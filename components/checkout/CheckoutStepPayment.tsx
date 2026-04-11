"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Info, CreditCard, Store, Loader2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import {
  getShopDateTimeParts,
  getShopHoursFromConfig,
  isPickupTimeAtLeastMinutesAhead,
  isShopOpenAt,
  isWithinShopHoursWithConfig,
  ShopHoursConfig,
} from "@/lib/shop-hours";

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
  shopHours: ShopHoursConfig;
  shopAddress: {
    line1: string;
    line2: string;
  };
  hoursSummary: string;
}

// Generate time slots in 5-minute increments from shop open to close
function generateTimeSlotsForDay(day: number, shopHours: ShopHoursConfig): string[] {
  const { open, close, isOpen } = getShopHoursFromConfig(day, shopHours);
  if (!isOpen || open === "closed" || close === "closed") {
    return [];
  }

  const slots: string[] = [];
  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);

  let currentHour = openHour;
  let currentMinute = openMinute;

  while (currentHour < closeHour || (currentHour === closeHour && currentMinute <= closeMinute)) {
    const h = String(currentHour).padStart(2, "0");
    const m = String(currentMinute).padStart(2, "0");
    slots.push(`${h}:${m}`);

    currentMinute += 5;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }

  return slots;
}

// Format time for display (e.g., "14:30" → "2:30 PM")
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function CheckoutStepPayment({
  cartItems,
  subtotal,
  onSubmit,
  onBack,
  isLoading,
  shopHours,
  shopAddress,
  hoursSummary,
}: CheckoutStepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<"STRIPE" | "PAY_ON_PICKUP">("PAY_ON_PICKUP");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [pickupError, setPickupError] = useState<string>("");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const shopNow = useMemo(
    () => getShopDateTimeParts(now, shopHours.timezone),
    [now, shopHours.timezone]
  );
  const timeSlots = useMemo(() => generateTimeSlotsForDay(shopNow.day, shopHours), [shopHours, shopNow.day]);
  const todayHours = useMemo(() => getShopHoursFromConfig(shopNow.day, shopHours), [shopHours, shopNow.day]);
  const shopOpen = useMemo(() => isShopOpenAt(now, shopHours), [now, shopHours]);

  // Check if selected time is outside business hours
  const isOutsideHours = useMemo(() => {
    if (!selectedTime) return false;
    return !isWithinShopHoursWithConfig(now, selectedTime, shopHours);
  }, [selectedTime, shopHours, now]);

  // Get warning message from env var
  const pickupWarningMessage = process.env.NEXT_PUBLIC_PICKUP_WARNING_MESSAGE ||
    "Please note our business hours. We'll prepare your order for your selected time.";

  // Filter out elapsed time slots and group into morning, afternoon, evening
  const groupedSlots = useMemo(() => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    timeSlots.forEach((time) => {
      // Hide elapsed slots entirely
      if (!isPickupTimeAtLeastMinutesAhead(now, time, 10, shopHours.timezone)) return;

      const hour = parseInt(time.split(":")[0]);
      if (hour < 12) {
        morning.push(time);
      } else if (hour < 17) {
        afternoon.push(time);
      } else {
        evening.push(time);
      }
    });

    return { morning, afternoon, evening };
  }, [now, shopHours.timezone, timeSlots]);

  const hasAvailableSlots = groupedSlots.morning.length > 0 || groupedSlots.afternoon.length > 0 || groupedSlots.evening.length > 0;

  const handleSubmit = () => {
    if (selectedMethod === "PAY_ON_PICKUP") {
      if (!selectedTime) {
        setPickupError("Please select a pickup time");
        return;
      }

      if (!isPickupTimeAtLeastMinutesAhead(new Date(), selectedTime, 10, shopHours.timezone)) {
        setPickupError("Pickup time must be at least 10 minutes from now");
        return;
      }

      setPickupError("");
      onSubmit(selectedMethod, selectedTime);
    } else {
      onSubmit(selectedMethod);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setPickupError("");
    setIsTimePickerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Shop Closed Warning - Shows when shop is closed */}
      {!shopOpen && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                We are currently closed
              </p>
              <p className="text-sm text-red-700">
                {todayHours.isOpen
                  ? `Today's hours: ${formatTimeDisplay(todayHours.open)} – ${formatTimeDisplay(todayHours.close)}`
                  : "We're closed today. Please come back during business hours."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Info Summary */}
      <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-forest-900">
              Pickup at {shopAddress.line1}
            </p>
            <p className="text-sm text-forest-700">
              {hoursSummary}
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

        {/* Pay on Pickup - Now First */}
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

        {/* Pay with Card - Now Second */}
        <label
          className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
            !shopOpen
              ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              : selectedMethod === "STRIPE"
                ? "border-forest-600 bg-forest-50 cursor-pointer"
                : "border-cream-200 hover:border-forest-300 cursor-pointer"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="STRIPE"
            checked={selectedMethod === "STRIPE"}
            onChange={() => {
              if (shopOpen) {
                setSelectedMethod("STRIPE");
                setPickupError("");
              }
            }}
            disabled={!shopOpen}
            className="w-4 h-4 text-forest-600 disabled:opacity-40"
          />
          <div className="flex items-center gap-3 flex-1">
            <CreditCard className={`w-5 h-5 ${shopOpen ? "text-forest-600" : "text-gray-400"}`} />
            <div>
              <p className={`font-medium ${shopOpen ? "text-forest-900" : "text-gray-500"}`}>
                Pay now with card
                {!shopOpen && " (Unavailable — Shop Closed)"}
              </p>
              <p className="text-sm text-forest-600">
                {shopOpen ? "Secure payment via Stripe" : "Available during business hours only"}
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
            Choose a time at least 10 minutes from now during our business hours.
          </p>

          {/* Custom Time Picker Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-lg text-left transition-colors ${
                pickupError
                  ? "border-red-500"
                  : selectedTime
                  ? "border-forest-600"
                  : "border-cream-300"
              } ${selectedTime ? "text-forest-900" : "text-forest-400"}`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {selectedTime ? formatTimeDisplay(selectedTime) : "Select a time"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isTimePickerOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Time Picker Panel */}
            {isTimePickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTimePickerOpen(false)}
                />
                <div className="absolute z-50 w-full mt-1 bg-white border border-cream-200 rounded-lg shadow-lg max-h-[280px] overflow-y-auto">
                  {!hasAvailableSlots ? (
                    <div className="p-4 text-center text-forest-600 text-sm">
                      No available time slots today
                    </div>
                  ) : (
                    <>
                      {groupedSlots.morning.length > 0 && (
                        <>
                          <div className="sticky top-0 bg-cream-50 px-3 py-1.5 text-xs font-medium text-forest-400 uppercase tracking-wider border-b border-cream-100">
                            Morning
                          </div>
                          {groupedSlots.morning.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleTimeSelect(time)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                selectedTime === time
                                  ? "bg-forest-600 text-white"
                                  : "text-forest-700 hover:bg-forest-50"
                              }`}
                            >
                              {formatTimeDisplay(time)}
                            </button>
                          ))}
                        </>
                      )}
                      {groupedSlots.afternoon.length > 0 && (
                        <>
                          <div className="sticky top-0 bg-cream-50 px-3 py-1.5 text-xs font-medium text-forest-400 uppercase tracking-wider border-b border-cream-100">
                            Afternoon
                          </div>
                          {groupedSlots.afternoon.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleTimeSelect(time)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                selectedTime === time
                                  ? "bg-forest-600 text-white"
                                  : "text-forest-700 hover:bg-forest-50"
                              }`}
                            >
                              {formatTimeDisplay(time)}
                            </button>
                          ))}
                        </>
                      )}
                      {groupedSlots.evening.length > 0 && (
                        <>
                          <div className="sticky top-0 bg-cream-50 px-3 py-1.5 text-xs font-medium text-forest-400 uppercase tracking-wider border-b border-cream-100">
                            Evening
                          </div>
                          {groupedSlots.evening.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => handleTimeSelect(time)}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                selectedTime === time
                                  ? "bg-forest-600 text-white"
                                  : "text-forest-700 hover:bg-forest-50"
                              }`}
                            >
                              {formatTimeDisplay(time)}
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

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
              <strong>Today at {formatTimeDisplay(selectedTime)} ({shopHours.timezone})</strong>
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
