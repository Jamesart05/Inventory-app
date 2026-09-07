'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Item, itemsApi, ApiError } from '@/lib/api';

function SearchPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [scanning, setScanning] = useState(params.get('scan') === '1');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { items } = await itemsApi.list({ q });
      setResults(items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDetected = async (code: string) => {
    setScanning(false);
    setError('');
    setLoading(true);
    try {
      const { item } = await itemsApi.getByBarcode(code);
      router.push(`/items/${item.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(`No item found for barcode "${code}". You can add it as a new item.`);
        setQ(code);
      } else {
        setError('Lookup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="Search" />
      <div className="container">
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Scan barcode</h3>
          <button className="btn" onClick={() => setScanning((s) => !s)}>
            {scanning ? 'Stop camera' : '📷 Start camera'}
          </button>
          {scanning && (
            <div style={{ marginTop: 12 }}>
              <BarcodeScanner active={scanning} onDetected={handleDetected} />
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Search by keyword</h3>
          <form className="search-bar" onSubmit={runTextSearch}>
            <input
              placeholder="Name, SKU, category, barcode…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="icon-btn" type="submit" aria-label="Search">
              🔍
            </button>
          </form>

          {error && (
            <p className="error-text">
              {error}{' '}
              {error.includes('add it') && (
                <Link href="/items/new">Add item →</Link>
              )}
            </p>
          )}
          {loading && <p>Loading…</p>}

          <div className="item-list">
            {results.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="item-row">
                <div>
                  <div>{item.name}</div>
                  <div className="meta">{item.barcode || item.sku}</div>
                </div>
                <div>
                  {item.quantity} {item.unit}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default function SearchPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="container">Loading…</div>}>
        <SearchPageInner />
      </Suspense>
    </RequireAuth>
  );
}
