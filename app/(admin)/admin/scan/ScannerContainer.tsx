'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamic import with SSR disabled - REQUIRED for browser-only camera APIs
const QRScanner = dynamic(
  () => import('./QRScanner').then(mod => mod.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-cream-50 rounded-xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin mx-auto mb-2" />
          <p className="text-forest-600 text-sm">Loading scanner...</p>
        </div>
      </div>
    )
  }
);

interface ScannerContainerProps {
  onScan: (token: string) => void;
  onError?: (error: string) => void;
}

export function ScannerContainer({ onScan, onError }: ScannerContainerProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 bg-cream-50 rounded-xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-forest-600 animate-spin mx-auto mb-2" />
          <p className="text-forest-600 text-sm">Loading scanner...</p>
        </div>
      </div>
    }>
      <QRScanner onScan={onScan} onError={onError} />
    </Suspense>
  );
}
