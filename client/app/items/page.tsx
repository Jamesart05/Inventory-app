'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { Item, itemsApi } from '@/lib/api';

function ItemsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError('');
    try {
      const { items } = await itemsApi.list({ q: query });
      setItems(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(q);
  };

  return (
    <>
      <TopBar title="Inventory" />
      <div className="container">
        <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
          <Link href="/items/import" className="btn btn-secondary btn-sm">
            Bulk import
          </Link>
        </div>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            placeholder="Search by name, SKU, category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="icon-btn" type="submit" aria-label="Search">
            🔍
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
        {loading && <p>Loading…</p>}

        {!loading && items.length === 0 && (
          <div className="empty-state">
            <p>No items yet.</p>
            <Link href="/items/new" className="btn" style={{ display: 'inline-block', width: 'auto' }}>
              Add your first item
            </Link>
          </div>
        )}

        <div className="item-list">
          {items.map((item) => {
            const low = item.quantity <= item.reorderLevel;
            return (
              <Link key={item.id} href={`/items/${item.id}`} className="item-row">
                <div>
                  <div>{item.name}</div>
                  <div className="meta">
                    {item.sku ? `SKU: ${item.sku}` : ''} {item.barcode ? `· ${item.barcode}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>
                    {item.quantity} {item.unit}
                  </div>
                  {low && <span className="badge low">Low stock</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default function ItemsPage() {
  return (
    <RequireAuth>
      <ItemsList />
    </RequireAuth>
  );
}
