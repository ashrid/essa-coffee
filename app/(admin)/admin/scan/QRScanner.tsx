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

    // Check if we're in a secure context (required for camera)
    if (window.isSecureContext === false) {
      setState('unsupported');
      setErrorMessage('Camera requires HTTPS or localhost. Please access via https:// or localhost:3000');
      return;
    }

    // Try to actually access the camera instead of just checking API existence
    // This is more reliable on Android where the API may exist but behave differently
    const checkCameraAccess = async () => {
      try {
        const stream = await navigator.mediaDevices?.getUserMedia({ video: true });
        // Stop the stream immediately - we just wanted to check access
        stream?.getTracks().forEach(track => track.stop());
        // Camera is available, initialize the scanner
        initializeScanner();
      } catch (err) {
        const error = err as Error;
        // Handle specific error cases
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setState('permission-denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setState('unsupported');
          setErrorMessage('No camera found on this device.');
        } else if (error.name === 'NotSupportedError' || error.name === 'SecurityError') {
          setState('unsupported');
          setErrorMessage('Camera access requires a secure connection (HTTPS) or localhost.');
        } else {
          // Unknown error - try to initialize anyway, html5-qrcode has its own error handling
          console.warn('Camera check failed, trying scanner anyway:', error);
          initializeScanner();
        }
      }
    };

    checkCameraAccess();

    function initializeScanner() {
      try {
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

        // render() uses callbacks, not promises
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
        );

        // Set scanning state immediately - the scanner is now rendering
        setState('scanning');
      } catch (err) {
        const error = err as Error;
        setState('error');
        setErrorMessage(error.message || 'Failed to start camera');
        onError?.(error.message);
      }
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
    const isHttpsIssue = errorMessage.includes('HTTPS') || errorMessage.includes('localhost');

    return (
      <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
        <CameraOff className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-2">Camera Not Available</h3>
        <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>
        {isHttpsIssue && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm">
            <p className="font-medium text-amber-900 mb-2">To fix this:</p>
            <ol className="text-amber-800 space-y-1 list-decimal list-inside">
              <li>Use <code className="bg-amber-100 px-1 rounded">localhost:3000</code> instead of IP address</li>
              <li>Or set up HTTPS for your local network</li>
            </ol>
            <p className="mt-3 text-amber-700">
              Browsers require secure connections for camera access.
            </p>
          </div>
        )}
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
