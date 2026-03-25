'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Search, ArrowLeft, Calendar, CreditCard, User, Clock, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OrderStatusBadge } from '@/components/store/OrderStatusBadge';
import { OrderTimeline } from '@/components/store/OrderTimeline';
import { formatPrice } from '@/lib/utils';
import QRCode from 'qrcode';

type OrderStatus = 'NEW' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

interface OrderItem {
  quantity: number;
  price: string;
  productName: string;
}

interface OrderData {
  orderNumber: string;
  status: OrderStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestNotes: string | null;
  pickupTime: string | null;
  items: OrderItem[];
  total: string;
  paymentMethod: string;
  createdAt: string;
  qrToken: string | null;
  qrTokenExpiresAt: string | null;
}

interface OrderStatusContentProps {
  shopAddress: {
    line1: string;
    line2: string;
  };
  hoursSummary: string;
}

function formatPickupTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function OrderStatusContent({ shopAddress, hoursSummary }: OrderStatusContentProps) {
  const searchParams = useSearchParams();
  const prefillOrderNumber = searchParams.get('order');

  const [orderNumber, setOrderNumber] = useState(prefillOrderNumber || '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Update order number if query param changes
  useEffect(() => {
    if (prefillOrderNumber) {
      setOrderNumber(prefillOrderNumber);
    }
  }, [prefillOrderNumber]);

  // Generate QR code data URL when order has a token
  useEffect(() => {
    if (order?.qrToken && !qrDataUrl && !isGeneratingQR) {
      setIsGeneratingQR(true);
      const scanUrl = `${window.location.origin}/admin/scan?token=${encodeURIComponent(order.qrToken)}`;
      QRCode.toDataURL(scanUrl, { width: 256, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => console.error('Failed to generate QR code'))
        .finally(() => setIsGeneratingQR(false));
    }
  }, [order?.qrToken, qrDataUrl, isGeneratingQR]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to find order');
        return;
      }

      setOrder(data);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOrder(null);
    setError('');
    setOrderNumber('');
    setEmail('');
  }

  if (order) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Order Header */}
        <div className="bg-forest-50 border border-forest-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-forest-600 mb-1">Order Number</p>
              <h1 className="text-3xl font-bold text-forest-900 tracking-wide">
                {order.orderNumber.toUpperCase()}
              </h1>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-cream-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-forest-900 mb-6">Order Progress</h2>
          <OrderTimeline status={order.status} />
        </div>

        {/* QR Code Section - Only for READY orders */}
        {order.status === 'READY' && order.qrToken && (
          <div className="bg-forest-50 border border-forest-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-forest-600" />
              <h2 className="text-lg font-semibold text-forest-900">Pickup QR Code</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* QR Code Image */}
              <div className="bg-white p-4 rounded-lg border border-forest-200 mx-auto sm:mx-0">
                {isGeneratingQR ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pickup QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-forest-400 text-sm">
                    Failed to load
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <p className="text-forest-700">
                  Show this QR code to staff when picking up your order.
                </p>
                {order.qrTokenExpiresAt && (
                  <p className="text-sm text-forest-600">
                    Expires:{" "}
                    <span className="font-medium">
                      {new Date(order.qrTokenExpiresAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </p>
                )}
                <p className="text-xs text-forest-500 pt-2">
                  Staff will scan this code to verify and complete your order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white border border-cream-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-forest-900 mb-4">Order Details</h2>

          <div className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-forest-900">{order.guestName}</p>
                <p className="text-sm text-forest-600">{order.guestEmail}</p>
                {order.guestPhone && (
                  <p className="text-sm text-forest-600">{order.guestPhone}</p>
                )}
              </div>
            </div>

            {/* Order Date */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-forest-900">Order Date</p>
                <p className="text-sm text-forest-600">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-forest-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-forest-900">Payment Method</p>
                <p className="text-sm text-forest-600">
                  {order.paymentMethod === 'STRIPE' ? 'Paid online' : 'Pay on pickup'}
                </p>
              </div>
            </div>

            {/* Scheduled Pickup Time - Only for Pay on Pickup with pickupTime */}
            {order.paymentMethod === 'PAY_ON_PICKUP' && order.pickupTime && (
              <div className="flex items-start gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <Clock className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-900">Scheduled Pickup</p>
                  <p className="text-sm text-emerald-700">
                    {formatPickupTime(order.pickupTime)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Notes */}
          {order.guestNotes && (
            <div className="mt-4 pt-4 border-t border-cream-200">
              <p className="font-medium text-forest-900 mb-1">Notes</p>
              <p className="text-sm text-forest-600">{order.guestNotes}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white border border-cream-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-forest-900 mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-forest-700">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium text-forest-900">
                  {formatPrice(parseFloat(item.price) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-cream-200 mt-4 pt-4 flex justify-between">
            <span className="font-semibold text-forest-900">Total</span>
            <span className="font-bold text-lg text-forest-900">
              {formatPrice(parseFloat(order.total))}
            </span>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-forest-50 border border-forest-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-forest-900 mb-4">Pickup Information</h2>
          <div className="space-y-2 text-sm text-forest-700">
            <p>📍 {shopAddress.line1}, {shopAddress.line2}</p>
            <p>🕒 {hoursSummary}</p>
            <p className="mt-4 text-forest-600">
              We&apos;ll email you at {order.guestEmail} when your order is ready for pickup.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-100 rounded-full mb-4">
          <Package className="w-8 h-8 text-forest-600" />
        </div>
        <h1 className="text-2xl font-bold text-forest-900 mb-2">Track Your Order</h1>
        <p className="text-forest-600">
          Enter your order number and email to check your order status.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-cream-200 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              type="text"
              placeholder="e.g., ORD-001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-forest-600 hover:bg-forest-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Track Order
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Back to Shop */}
      <div className="text-center mt-6">
        <Link href="/shop" className="text-forest-600 hover:text-forest-800 text-sm">
          ← Back to Shop
        </Link>
      </div>
    </div>
  );
}

export default function OrderStatusPage() {
  // Read shop info from environment variables on the server
  const shopAddress = {
    line1: process.env.SHOP_ADDRESS_LINE1 || "123 Green Street",
    line2: process.env.SHOP_ADDRESS_LINE2 || "Your City, State 00000",
  };

  // Import and call getHoursSummary on the server
  const { getHoursSummary } = require("@/lib/shop-hours");
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
