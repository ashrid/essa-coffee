'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, CheckCircle, XCircle, AlertCircle, Loader2, Package, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

type OrderStatus = 'NEW' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

interface OrderItem {
  quantity: number;
  price: string;
  productName: string;
}

interface VerifiedOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  guestName: string;
  guestEmail: string;
  items: OrderItem[];
  total: string;
  paymentMethod: string;
}

interface VerificationError {
  error: string;
  status?: OrderStatus;
}

function ScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [error, setError] = useState<VerificationError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Verify QR token on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    async function verifyToken() {
      try {
        const response = await fetch(`/api/orders/verify-qr?token=${encodeURIComponent(token!)}`);
        const data = await response.json();

        if (!response.ok) {
          setError({
            error: data.error || 'Failed to verify QR code',
            status: data.status,
          });
          return;
        }

        setOrder(data);
      } catch {
        setError({ error: 'An unexpected error occurred while verifying the QR code' });
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // Handle order completion
  async function handleCompleteOrder() {
    if (!order) return;

    setIsCompleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to complete order');
      }

      setIsCompleted(true);
      toast.success('Order marked as completed!');

      // Auto-redirect back to scan page after 3 seconds
      setTimeout(() => {
        router.push('/admin/scan');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete order');
    } finally {
      setIsCompleting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <Loader2 className="w-12 h-12 text-forest-600 animate-spin mb-4" />
        <p className="text-forest-700">Verifying QR code...</p>
      </div>
    );
  }

  // No token - show instructions
  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-100 rounded-full mb-4">
            <QrCode className="w-10 h-10 text-forest-600" />
          </div>
          <h1 className="text-2xl font-bold text-forest-900 mb-2">QR Scan</h1>
          <p className="text-forest-600">
            Scan a customer&apos;s QR code to verify their order and mark it as completed.
          </p>
        </div>

        <div className="bg-cream-50 border border-cream-200 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-forest-900">How it works:</h2>
          <ol className="space-y-3 text-forest-700 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
              <span>Customer receives QR code via email when their order is ready</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
              <span>Customer shows QR code to staff at pickup</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
              <span>Staff scans QR code to verify order details</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
              <span>Staff marks order as completed and hands over items</span>
            </li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/admin/orders"
            className="text-forest-600 hover:text-forest-800 text-sm"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isExpired = error.error.toLowerCase().includes('expired');
    const isWrongStatus = error.status && error.status !== 'READY';

    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            {isExpired ? (
              <AlertCircle className="w-10 h-10 text-red-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            {isExpired ? 'QR Code Expired' : 'Invalid QR Code'}
          </h1>
          <p className="text-red-700">{error.error}</p>
          {isWrongStatus && (
            <p className="text-forest-600 mt-2 text-sm">
              Current order status: <span className="font-semibold">{error.status}</span>
            </p>
          )}
        </div>

        <div className="bg-cream-50 border border-cream-200 rounded-xl p-6">
          {isExpired ? (
            <>
              <h2 className="font-semibold text-forest-900 mb-2">What to do:</h2>
              <p className="text-forest-700 text-sm mb-4">
                The QR code has expired. You can resend a new QR code to the customer from the order details page.
              </p>
              <Link href="/admin/orders">
                <Button className="w-full bg-forest-600 hover:bg-forest-700">
                  Go to Orders
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-forest-900 mb-2">What to check:</h2>
              <ul className="text-forest-700 text-sm space-y-2">
                <li>• Make sure the QR code is fully visible in the camera frame</li>
                <li>• Check that the QR code hasn&apos;t been damaged or blurred</li>
                <li>• Ask the customer to show the email with the QR code</li>
              </ul>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/scan')}
            className="w-full"
          >
            Scan Another Code
          </Button>
        </div>
      </div>
    );
  }

  // Success - order verified
  if (order) {
    if (isCompleted) {
      return (
        <div className="max-w-md mx-auto p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-900 mb-2">Order Completed!</h1>
            <p className="text-green-700">
              Order <span className="font-semibold">#{order.orderNumber.toUpperCase()}</span> has been marked as completed.
            </p>
          </div>

          <div className="bg-cream-50 border border-cream-200 rounded-xl p-6 text-center">
            <p className="text-forest-600 text-sm mb-4">
              Redirecting to scan another order in a few seconds...
            </p>
            <Button
              onClick={() => router.push('/admin/scan')}
              className="w-full bg-forest-600 hover:bg-forest-700"
            >
              Scan Next Order
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-forest-900 mb-1">Order Verified</h1>
          <p className="text-forest-600">Valid pickup QR code</p>
        </div>

        {/* Order Card */}
        <div className="bg-white border border-cream-200 rounded-xl overflow-hidden mb-6">
          {/* Order Header */}
          <div className="bg-forest-50 border-b border-forest-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-forest-600 mb-1">Order Number</p>
                <p className="text-2xl font-bold text-forest-900 tracking-wide">
                  {order.orderNumber.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-forest-600 mb-1">Total</p>
                <p className="text-xl font-bold text-forest-900">
                  {formatPrice(parseFloat(order.total))}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-4 border-b border-cream-200">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-forest-600 mt-0.5" />
              <div>
                <p className="font-medium text-forest-900">{order.guestName}</p>
                <p className="text-sm text-forest-600">{order.guestEmail}</p>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4 border-b border-cream-200">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-forest-600 mt-0.5" />
              <div>
                <p className="font-medium text-forest-900">Payment</p>
                <p className="text-sm text-forest-600">
                  {order.paymentMethod === 'STRIPE' ? 'Paid online (Stripe)' : 'Pay on pickup'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-forest-600" />
              <h2 className="font-semibold text-forest-900">Items</h2>
            </div>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-cream-100 last:border-0"
                >
                  <span className="text-forest-700">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-medium text-forest-900">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-forest-200 flex justify-between">
              <span className="font-semibold text-forest-900">Total</span>
              <span className="font-bold text-lg text-forest-900">
                {formatPrice(parseFloat(order.total))}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleCompleteOrder}
            disabled={isCompleting}
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Order
              </>
            )}
          </Button>

          <Link href="/admin/scan">
            <Button variant="outline" className="w-full">
              Cancel & Scan Another
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <Loader2 className="w-12 h-12 text-forest-600 animate-spin mb-4" />
            <p className="text-forest-700">Loading...</p>
          </div>
        }
      >
        <ScanPageContent />
      </Suspense>
    </div>
  );
}
