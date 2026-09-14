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

        <div className="table-responsive-wrapper">
          <table className="inventory-table">
            <tbody>
              {items.map((item: any) => {
                const low = item.quantity <= item.reorderLevel;
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => window.location.href = `/items/${item.id}`}
                    className="inventory-row"
                  >
                    {/* Item Info Column */}
                    <td className="col-main">
                      <div className="item-name">{item.name}</div>
                      <div className="meta">
                        {item.category ? `Style: ${item.category}` : ''} {item.sku ? `· SKU: ${item.sku}` : ''}
                      </div>
                    </td>

                    {/* Prices Column */}
                    <td className="col-prices">
                      <div className="price-row">
                        <span className="price-label">Cost:</span>
                        <span className="price-val">{formatMoney(item.costPrice)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Retail:</span>
                        <span className="price-val">{formatMoney(item.retailPrice)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Wholesale:</span>
                        <span className="price-val">{formatMoney(item.wholesalePrice)}</span>
                      </div>
                    </td>

                    {/* Quantity & Badge Column */}
                    <td className="col-qty">
                      <div className="qty-val">
                        {item.quantity} {item.unit}
                      </div>
                      {low && <span className="badge low">Low stock</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && <div className="loading-text">Loading more items…</div>}
      </div>
      <BottomNav />

      <style jsx>{`
        .inventory-page-container {
          max-width: 1000px !important;
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
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .inventory-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
        }
        .inventory-row {
          background: var(--surface);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: border-color 0.15s ease, background-color 0.15s ease;
        }
        .inventory-row td {
          padding: 14px 16px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .inventory-row td:first-child {
          border-left: 1px solid var(--border);
          border-top-left-radius: var(--radius);
          border-bottom-left-radius: var(--radius);
        }
        .inventory-row td:last-child {
          border-right: 1px solid var(--border);
          border-top-right-radius: var(--radius);
          border-bottom-right-radius: var(--radius);
        }
        .inventory-row:hover {
          border-color: var(--primary);
          background: var(--surface-2);
        }
        .col-main {
          width: 50%;
        }
        .item-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--text);
          margin-bottom: 3px;
        }
        .meta {
          font-size: 12px;
          color: var(--text-muted);
        }
        .col-prices {
          width: 30%;
          white-space: nowrap;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          font-size: 13px;
          line-height: 1.5;
        }
        .price-label {
          color: var(--text-muted);
        }
        .price-val {
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: var(--text);
          text-align: right;
          min-width: 90px;
        }
        .col-qty {
          width: 20%;
          text-align: right;
          white-space: nowrap;
        }
        .qty-val {
          font-weight: 600;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 4px;
        }
        .loading-text {
          text-align: center;
          margin: 20px 0;
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Mobile / Smaller screen adaptation */
        @media (max-width: 768px) {
          .search-bar-stack .row {
            flex-direction: column;
          }
          .btn-sm-filter {
            width: 100% !important;
          }
          .inventory-table, .inventory-table tbody, .inventory-row, .inventory-row td {
            display: block;
            width: 100%;
          }
          .inventory-row {
            margin-bottom: 12px;
            border-radius: var(--radius);
          }
          .inventory-row td {
            border: none !important;
            padding: 10px 14px;
          }
          .col-main {
            border-bottom: 1px solid var(--border) !important;
          }
          .col-prices {
            border-bottom: 1px solid var(--border) !important;
            padding: 8px 14px !important;
          }
          .col-qty {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
            padding: 10px 14px !important;
          }
          .qty-val {
            margin-bottom: 0;
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