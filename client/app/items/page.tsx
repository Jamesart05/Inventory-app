'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentFilters = useRef({ q: '', name: '', style: '', minPrice: '' });

  const loadItems = useCallback(async (pageNum: number, params: { q?: string; name?: string; style?: string; minPrice?: string }, append = false) => {
    setLoading(true);
    setError('');
    try {
      const response = await itemsApi.list({ ...params, page: pageNum, pageSize: 20 });
      const fetchedItems = response.items || [];
      
      setItems((prev) => (append ? [...prev, ...fetchedItems] : fetchedItems));
      setHasMore(fetchedItems.length === 20);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadItems(1, currentFilters.current, false);
  }, [loadItems]);

  // Infinite scroll handler (triggers at 3/4 of the way down)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight * 0.75;

      if (scrollPosition >= threshold && !loading && hasMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadItems(nextPage, currentFilters.current, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, loadItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filters = { q, name: nameFilter, style: styleFilter, minPrice: priceFilter };
    currentFilters.current = filters;
    setPage(1);
    loadItems(1, filters, false);
  };

  return (
    <>
      <TopBar title="Inventory" />
      <div className="container inventory-page-container">
        <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
          <Link href="/items/import" className="btn btn-secondary btn-sm">
            Bulk import
          </Link>
        </div>

        <form className="search-bar-stack" onSubmit={handleSearch}>
          <div className="row">
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
          <div className="row">
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
            <button className="btn btn-sm-filter" type="submit">
              Filter
            </button>
          </div>
        </form>

        {error && <div className="error-text">{error}</div>}

        {items.length === 0 && !loading && (
          <div className="empty-state">
            <p>No items found.</p>
            <Link href="/items/new" className="btn" style={{ display: 'inline-flex', width: 'auto', marginTop: '12px' }}>
              Add your first item
            </Link>
          </div>
        )}

        <div className="item-list">
          {items.map((item: any) => {
            const low = item.quantity <= item.reorderLevel;
            return (
              <Link key={item.id} href={`/items/${item.id}`} className="item-row custom-item-row">
                <div className="item-main">
                  <div className="item-name">{item.name}</div>
                  <div className="meta">
                    {item.category ? `Style: ${item.category}` : ''} {item.sku ? `· SKU: ${item.sku}` : ''}
                  </div>
                </div>

                <div className="item-prices">
                  <div className="price-line">
                    <span className="price-label">Cost:</span>
                    <span className="price-value">{formatMoney(item.costPrice)}</span>
                  </div>
                  <div className="price-line">
                    <span className="price-label">Retail:</span>
                    <span className="price-value">{formatMoney(item.retailPrice)}</span>
                  </div>
                  <div className="price-line">
                    <span className="price-label">Wholesale:</span>
                    <span className="price-value">{formatMoney(item.wholesalePrice)}</span>
                  </div>
                </div>

                <div className="item-qty">
                  <div className="qty-value">
                    {item.quantity} {item.unit}
                  </div>
                  {low && <span className="badge low">Low stock</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {loading && <div className="loading-text">Loading more items…</div>}
      </div>
      <BottomNav />

      <style jsx>{`
        .inventory-page-container {
          max-width: 900px !important;
        }
        .search-bar-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
          background: var(--surface);
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .btn-sm-filter {
          width: auto !important;
          padding: 0 20px;
          white-space: nowrap;
        }
        .custom-item-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          grid-template-areas: 'main prices qty';
          align-items: center;
          column-gap: 24px;
          padding: 14px 18px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }
        .custom-item-row:hover {
          border-color: var(--primary);
        }
        .item-main {
          grid-area: main;
          min-width: 0;
        }
        .item-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 2px;
        }
        .item-prices {
          grid-area: prices;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
          min-width: 170px;
        }
        .price-line {
          display: grid;
          grid-template-columns: 70px 1fr;
          align-items: center;
        }
        .price-label {
          color: var(--text-muted);
        }
        .price-value {
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: var(--text);
          font-weight: 500;
        }
        .item-qty {
          grid-area: qty;
          text-align: right;
          min-width: 85px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .qty-value {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
        }
        .loading-text {
          text-align: center;
          margin: 20px 0;
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Responsive layout adaptation for smaller/mobile screens */
        @media (max-width: 768px) {
          .search-bar-stack .row {
            flex-direction: column;
          }
          .btn-sm-filter {
            width: 100% !important;
          }
          .custom-item-row {
            grid-template-columns: 1fr;
            grid-template-areas: 
              'main'
              'prices'
              'qty';
            gap: 12px;
            padding: 12px 14px;
          }
          .item-prices {
            width: 100%;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 6px 0;
          }
          .item-qty {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            min-width: 0;
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