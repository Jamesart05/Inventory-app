'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onDetected: (code: string) => void;
  active: boolean;
}

const REGION_ID = 'scanner-region';

export default function BarcodeScanner({ onDetected, active }: Props) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!active || startedRef.current) return;
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const instance = new Html5Qrcode(REGION_ID);
        scannerRef.current = instance;

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            onDetected(decodedText);
          },
          () => {
            // ignore per-frame scan failures — they happen constantly while
            // the camera is searching for a code.
          }
        );
        startedRef.current = true;
      } catch (err: any) {
        setError(err?.message || 'Unable to access camera');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current && startedRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch(() => {});
        startedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div>
      <div id={REGION_ID} style={{ width: '100%' }} />
      {error && <p className="error-text">{error}. You can still search by typing above.</p>}
    </div>
  );
}
