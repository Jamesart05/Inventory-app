'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { Item, itemsApi } from '@/lib/api';

function formatMoney(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num)
    ? num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

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
                <div className="item-main">
                  <div className="item-name">{item.name}</div>
                  <div className="meta">
                    {item.sku ? `SKU: ${item.sku}` : ''} {item.barcode ? `· ${item.barcode}` : ''}
                  </div>
                </div>
                <div className="item-prices">
                  <span className="price">Cost: {formatMoney(item.costPrice)}</span>
                  <span className="price">Sell: {formatMoney(item.sellingPrice)}</span>
                </div>
                <div className="item-qty">
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

      <style jsx>{`
        .item-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          grid-template-areas: 'main prices qty';
          align-items: center;
          column-gap: 16px;
          row-gap: 4px;
          padding: 16px;
        }
        .item-main {
          grid-area: main;
          min-width: 0;
        }
        .item-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-prices {
          grid-area: prices;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
          white-space: nowrap;
        }
        .item-prices .price {
          font-size: 0.85em;
          opacity: 0.85;
        }
        .item-qty {
          grid-area: qty;
          text-align: right;
          white-space: nowrap;
          min-width: 70px;
        }

        @media (max-width: 560px) {
          .item-row {
            grid-template-columns: 1fr auto;
            grid-template-areas:
              'main qty'
              'prices prices';
            row-gap: 6px;
          }
          .item-prices {
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            gap: 12px;
            text-align: left;
          }
        }

        @media (max-width: 360px) {
          .item-prices {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
        }
      `}</style>
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