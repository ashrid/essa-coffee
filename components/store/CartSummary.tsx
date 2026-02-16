import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  ctaHref: string;
  ctaLabel: string;
}

export function CartSummary({ subtotal, itemCount, ctaHref, ctaLabel }: CartSummaryProps) {
  return (
    <div className="border-t border-cream-200 pt-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-sage-500">
        <span>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-center justify-between font-semibold text-forest-900">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <Link
        href={ctaHref}
        className="block w-full text-center bg-forest-600 hover:bg-forest-700 text-cream-50 font-medium py-2.5 px-4 rounded-md transition-colors text-sm"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
