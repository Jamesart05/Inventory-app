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
  const [nameFilter, setNameFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (params?: { q?: string; name?: string; style?: string; minPrice?: string }) => {
    setLoading(true);
    setError('');
    try {
      const { items } = await itemsApi.list(params);
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
    load({ q, name: nameFilter, style: styleFilter, minPrice: priceFilter });
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

        <form className="search-bar-stack" onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Search general (name, SKU…)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              placeholder="Filter by Name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Filter by Style / Category"
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              placeholder="Min Price"
              type="number"
              step="0.01"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn" type="submit" style={{ width: 'auto', padding: '0 16px' }}>
              Filter
            </button>
          </div>
        </form>

        {error && <p className="error-text">{error}</p>}
        {loading && <p>Loading…</p>}

        {!loading && items.length === 0 && (
          <div className="empty-state">
            <p>No items found.</p>
            <Link href="/items/new" className="btn" style={{ display: 'inline-block', width: 'auto' }}>
              Add your first item
            </Link>
          </div>
        )}

        <div className="item-list">
          {items.map((item: any) => {
            const low = item.quantity <= item.reorderLevel;
            return (
              <Link key={item.id} href={`/items/${item.id}`} className="item-row">
                <div className="item-main">
                  <div className="item-name">{item.name}</div>
                  <div className="meta">
                    {item.category ? `Style: ${item.category}` : ''} {item.sku ? `· SKU: ${item.sku}` : ''}
                  </div>
                </div>
                <div className="item-prices">
                  <span className="price">Cost: {formatMoney(item.costPrice)}</span>
                  <span className="price">Retail: {formatMoney(item.retailPrice)}</span>
                  <span className="price">Wholesale: {formatMoney(item.wholesalePrice)}</span>
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
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .item-main {
          grid-area: main;
          min-width: 0;
        }
        .item-name {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .meta {
          font-size: 0.8em;
          opacity: 0.7;
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
          font-size: 0.8em;
          opacity: 0.85;
        }
        .item-qty {
          grid-area: qty;
          text-align: right;
          white-space: nowrap;
          min-width: 70px;
        }
        .badge.low {
          background: #ff4d4d;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75em;
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