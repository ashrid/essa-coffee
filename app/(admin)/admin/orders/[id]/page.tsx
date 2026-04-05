"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { QrCode, Loader2, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

type OrderStatus = "NEW" | "READY" | "COMPLETED" | "CANCELLED" | "REFUNDED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestNotes: string | null;
  pickupTime: string | null;
  status: OrderStatus;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  qrToken: string | null;
  qrTokenExpiresAt: string | null;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Generate QR code data URL when order has a token
  useEffect(() => {
    if (order?.qrToken && !qrDataUrl && !isGeneratingQR) {
      setIsGeneratingQR(true);
      const scanUrl = `${window.location.origin}/admin/scan?token=${encodeURIComponent(order.qrToken)}`;
      QRCode.toDataURL(scanUrl, { width: 256, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => toast.error("Failed to generate QR code"))
        .finally(() => setIsGeneratingQR(false));
    }
  }, [order?.qrToken, qrDataUrl, isGeneratingQR]);

  async function handleResendQR() {
    if (!order) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/orders/resend-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend QR code");
      }
      toast.success("QR code resent successfully");
      // Refresh order to get new expiry
      const refreshed = await fetch(`/api/admin/orders/${id}`).then((r) => r.json());
      setOrder(refreshed);
      // Regenerate QR with new token
      setQrDataUrl(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend QR code");
    } finally {
      setIsResending(false);
    }
  }

  const isQRValid = order?.qrToken && order?.qrTokenExpiresAt && new Date(order.qrTokenExpiresAt) > new Date();

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-gray-400">
        Order not found.{" "}
        <Link href="/admin/orders" className="text-forest-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Order #{order.orderNumber.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-gray-800 text-sm">Customer Information</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="text-gray-800">{order.guestName}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="text-gray-800">{order.guestEmail}</span>
          </div>
          {order.guestPhone && (
            <div>
              <span className="text-gray-500">Phone:</span>{" "}
              <span className="text-gray-800">{order.guestPhone}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">Payment:</span>{" "}
            <span className="text-gray-800">
              {order.paymentMethod === "STRIPE" ? "Credit Card" : "Pay on Pickup"}
            </span>
          </div>
        </div>
        {order.pickupTime && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <span className="text-emerald-700 font-medium">Scheduled Pickup:</span>{" "}
            <span className="text-emerald-900">
              {new Date(order.pickupTime).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Dubai",
              })}
            </span>
          </div>
        )}
        {order.guestNotes && (
          <div className="text-sm">
            <span className="text-gray-500">Notes:</span>{" "}
            <span className="text-gray-800 italic">{order.guestNotes}</span>
          </div>
        )}
      </div>

      {/* QR Code Section - Only for READY or COMPLETED orders */}
      {(order.status === "READY" || order.status === "COMPLETED") && (
        <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-forest-600" />
            <h2 className="font-semibold text-forest-800 text-sm">Pickup QR Code</h2>
          </div>

          {isQRValid ? (
            <>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* QR Code Image */}
                <div className="bg-white p-4 rounded-lg border border-forest-200">
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
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm text-forest-700">
                      QR code is <span className="font-medium text-green-700">valid</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-forest-600 mt-0.5" />
                    <span className="text-sm text-forest-700">
                      Expires:{" "}
                      <span className="font-medium">
                        {new Date(order.qrTokenExpiresAt!).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-forest-600 pt-2">
                    Customer scans this code at pickup. Staff can scan with any phone logged into admin.
                  </p>
                </div>
              </div>

              {/* Resend Button */}
              <div className="pt-2 border-t border-forest-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendQR}
                  disabled={isResending}
                  className="bg-white border-forest-300 text-forest-700 hover:bg-forest-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend QR Code
                    </>
                  )}
                </Button>
                <p className="text-xs text-forest-500 mt-2">
                  Regenerates the QR code and sends a new email to the customer.
                </p>
              </div>
            </>
          ) : (
            <div className="text-sm text-forest-700">
              {order.qrToken ? (
                <>
                  <p className="text-amber-700 font-medium mb-2">QR code has expired</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendQR}
                    disabled={isResending}
                    className="bg-white border-forest-300 text-forest-700 hover:bg-forest-50"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generate New QR Code
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-forest-600">
                  No QR code generated yet. Change order status to READY to generate one.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200"
            >
              {item.product.images[0] ? (
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-14 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                  No img
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity} × {formatPrice(Number(item.price))}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                {formatPrice(Number(item.price) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <span className="text-gray-500 text-sm">Order Total</span>
            <p className="text-xl font-bold text-gray-900">
              {formatPrice(Number(order.total))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
