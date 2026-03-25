'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (error: string) => void;
}

type ScannerState = 'initializing' | 'scanning' | 'error' | 'permission-denied' | 'unsupported';

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const elementId = 'admin-qr-scanner';

  const handleScan = useCallback((decodedText: string) => {
    try {
      // Support both full URLs and raw tokens
      let token: string | null = null;

      if (decodedText.includes('?token=')) {
        // Full URL format: https://.../admin/scan?token=xxx
        const url = new URL(decodedText);
        token = url.searchParams.get('token');
      } else if (decodedText.startsWith('http')) {
        // URL without token param
        const url = new URL(decodedText);
        token = url.searchParams.get('token');
      } else {
        // Raw token format
        token = decodedText.trim();
      }

      if (token) {
        onScan(token);
      } else {
        onError?.('Invalid QR code. No token found.');
      }
    } catch {
      // If URL parsing fails, treat as raw token
      const token = decodedText.trim();
      if (token) {
        onScan(token);
      } else {
        onError?.('Invalid QR code format.');
      }
    }
  }, [onScan, onError]);

  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return;

    // Check for camera support
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      setErrorMessage('Camera access is not supported in this browser.');
      return;
    }

    // Check permission before initializing
    navigator.permissions?.query({ name: 'camera' as PermissionName })
      .then(permissionStatus => {
        if (permissionStatus.state === 'denied') {
          setState('permission-denied');
          return;
        }
        initializeScanner();
      })
      .catch(() => {
        // permissions API not supported, try anyway
        initializeScanner();
      });

    function initializeScanner() {
      scannerRef.current = new Html5QrcodeScanner(
        elementId,
        {
          fps: 2,  // Lower for mobile battery life (per RESEARCH.md)
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        false  // verbose
      );

      scannerRef.current.render(
        handleScan,
        (error) => {
          // Ignore "no QR found" errors - they happen constantly while scanning
          if (error?.includes('No MultiFormat Readers')) return;
          if (error?.includes('No barcode found')) return;

          // Handle permission errors
          if (error?.includes('NotAllowedError')) {
            setState('permission-denied');
          }
        }
      ).then(() => {
        setState('scanning');
      }).catch((err) => {
        setState('error');
        setErrorMessage(err.message || 'Failed to start camera');
        onError?.(err.message);
      });
    }

    // Cleanup function - CRITICAL for releasing camera
    return () => {
      scannerRef.current?.clear().catch(console.error);
    };
  }, [handleScan, onError]);

  // Permission denied state
  if (state === 'permission-denied') {
    return (
      <div className="text-center p-6 bg-amber-50 rounded-xl border border-amber-200">
        <CameraOff className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <h3 className="font-semibold text-amber-900 mb-2">Camera Access Denied</h3>
        <p className="text-amber-700 text-sm mb-4">
          Please enable camera access in your browser settings, or use manual order entry below.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="bg-white">
          Try Again
        </Button>
      </div>
    );
  }

  // Unsupported browser state
  if (state === 'unsupported') {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
        <CameraOff className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">Camera Not Supported</h3>
        <p className="text-gray-600 text-sm">
          Your browser does not support camera access. Please use manual order entry below.
        </p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="font-semibold text-red-900 mb-2">Scanner Error</h3>
        <p className="text-red-700 text-sm">{errorMessage}</p>
      </div>
    );
  }

  // Initializing or scanning state
  return (
    <div className="relative">
      {state === 'initializing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-cream-50 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-forest-600 animate-spin mx-auto mb-2" />
            <p className="text-forest-600 text-sm">Initializing camera...</p>
          </div>
        </div>
      )}
      <div id={elementId} className="w-full" />
    </div>
  );
}
