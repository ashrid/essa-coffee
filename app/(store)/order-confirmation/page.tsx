import Link from "next/link";
import { CheckCircle, Package, MapPin, Clock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OrderConfirmationPageProps {
  searchParams: Promise<{
    orderId?: string;
    session_id?: string;
  }>;
}

export default async function OrderConfirmationPage({
  searchParams,
}: OrderConfirmationPageProps) {
  const params = await searchParams;
  let order: {
    id: string;
    orderNumber: string;
    total: { toString: () => string };
    status: string;
    paymentMethod: string;
    items: {
      quantity: number;
      price: { toString: () => string };
      product: { name: string };
    }[];
  } | null = null;

  if (params.orderId) {
    // Pay-on-pickup flow
    order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });
  } else if (params.session_id) {
    // Stripe flow - find order by session ID
    order = await prisma.order.findFirst({
      where: { stripeSessionId: params.session_id },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });

    // If order not found yet, try to fetch session and wait
    if (!order) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(
          params.session_id
        );
        if (session.payment_status === "paid") {
          // Order might still be processing via webhook
          // Show a "processing" state
          return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-forest-200 border-t-forest-600 rounded-full mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-forest-900 mb-4">
                Processing Your Order
              </h1>
              <p className="text-forest-700 mb-8">
                We&apos;re finalizing your order. This will just take a moment...
              </p>
              <meta httpEquiv="refresh" content="3" />
            </div>
          );
        }
      } catch {
        // Invalid session
      }
    }
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package className="w-16 h-16 text-sage-400 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-forest-900 mb-4">
          Order Not Found
        </h1>
        <p className="text-forest-700 mb-8">
          We couldn&apos;t find your order. If you just placed an order, it may
          take a moment to appear.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-forest-600 hover:bg-forest-700">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pickup-info">Contact Support</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Order Confirmed!
        </h1>
        <p className="text-forest-700">
          Thank you for your order. We&apos;ll email you when it&apos;s ready for
          pickup.
        </p>
      </div>

      {/* Order Number */}
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-6 mb-8 text-center">
        <p className="text-sm text-forest-600 mb-1">Order Number</p>
        <p className="text-3xl font-bold text-forest-900 tracking-wide">
          {order.orderNumber.toUpperCase()}
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-white border border-cream-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-forest-900 mb-4">
          Order Summary
        </h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-forest-700">
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium text-forest-900">
                {formatPrice(parseFloat(item.price.toString()) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-cream-200 mt-4 pt-4 flex justify-between">
          <span className="font-semibold text-forest-900">Total</span>
          <span className="font-bold text-lg text-forest-900">
            {formatPrice(parseFloat(order.total.toString()))}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-cream-200">
          <p className="text-sm text-forest-600">
            Payment method:{" "}
            <span className="font-medium text-forest-900">
              {order.paymentMethod === "STRIPE"
                ? "Paid online"
                : "Pay on pickup"}
            </span>
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-forest-900 mb-4">
          What&apos;s Next?
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-forest-900">
                We&apos;ll email you when your order is ready
              </p>
              <p className="text-sm text-forest-700">
                Most orders are ready within 24 hours
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-forest-900">
                Pick up at 123 Green Street
              </p>
              <p className="text-sm text-forest-700">
                Mon–Fri 9AM–6PM, Sat 9AM–5PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild className="bg-forest-600 hover:bg-forest-700">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/order-status?order=${order.orderNumber}`}>Check Order Status</Link>
        </Button>
      </div>
    </div>
  );
}
