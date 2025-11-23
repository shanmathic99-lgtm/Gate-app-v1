import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (visitorId: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startScanning = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR code scanned successfully
            onScanSuccess(decodedText);
            stopScanning();
          },
          (errorMessage) => {
            // Ignore scanning errors (they're frequent during scanning)
          }
        );
        setIsScanning(true);
        setError('');
      } catch (err) {
        console.error('Error starting QR scanner:', err);
        setError('Failed to start camera. Please check permissions.');
        setIsScanning(false);
      }
    };

    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-800">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="relative">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-slate-900"></div>
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

