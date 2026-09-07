'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { Item, Movement, itemsApi, movementsApi, ApiError } from '@/lib/api';

function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<(Item & { movements: Movement[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [moveType, setMoveType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [moveQty, setMoveQty] = useState(1);
  const [moveNote, setMoveNote] = useState('');
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { item } = await itemsApi.get(id);
      setItem(item);
    } catch (err: any) {
      setError(err.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    try {
      await itemsApi.remove(id);
      router.push('/items');
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete item');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setMoveError('');
    if (moveQty <= 0) {
      setMoveError('Quantity must be greater than 0');
      return;
    }
    setMoving(true);
    try {
      await movementsApi.create({ itemId: id, type: moveType, quantity: moveQty, note: moveNote });
      setMoveQty(1);
      setMoveNote('');
      await load();
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : 'Failed to record movement');
    } finally {
      setMoving(false);
    }
  };

  return (
    <>
      <TopBar title="Item detail" />
      <div className="container">
        {loading && <p>Loading…</p>}
        {error && <p className="error-text">{error}</p>}

        {item && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>{item.name}</h2>
                  <div className="meta">
                    {item.sku && <div>SKU: {item.sku}</div>}
                    {item.barcode && <div>Barcode: {item.barcode}</div>}
                    {item.category && <div>Category: {item.category}</div>}
                  </div>
                </div>
                <span className={`badge ${item.quantity <= item.reorderLevel ? 'low' : ''}`}>
                  {item.quantity} {item.unit}
                </span>
              </div>
              {item.description && <p style={{ marginTop: 12 }}>{item.description}</p>}
              <div className="row" style={{ marginTop: 12 }}>
                <div>Cost: {Number(item.costPrice).toFixed(2)}</div>
                <div>Sell: {Number(item.sellingPrice).toFixed(2)}</div>
              </div>
              <div className="row" style={{ marginTop: 16 }}>
                <Link href={`/items/${item.id}/edit`} className="btn btn-secondary">
                  Edit
                </Link>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Record movement</h3>
              {moveError && <p className="error-text">{moveError}</p>}
              <form onSubmit={handleMovement}>
                <div className="row">
                  <button
                    type="button"
                    className={`btn ${moveType === 'STOCK_IN' ? '' : 'btn-secondary'}`}
                    onClick={() => setMoveType('STOCK_IN')}
                  >
                    Stock in
                  </button>
                  <button
                    type="button"
                    className={`btn ${moveType === 'STOCK_OUT' ? '' : 'btn-secondary'}`}
                    onClick={() => setMoveType('STOCK_OUT')}
                  >
                    Stock out
                  </button>
                </div>
                <div className="field" style={{ marginTop: 14 }}>
                  <label>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={moveQty}
                    onChange={(e) => setMoveQty(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <input value={moveNote} onChange={(e) => setMoveNote(e.target.value)} />
                </div>
                <button className="btn" type="submit" disabled={moving}>
                  {moving ? 'Recording…' : 'Record movement'}
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Recent movements</h3>
              {item.movements.length === 0 && <p className="meta">No movements yet.</p>}
              <div className="item-list">
                {item.movements.map((m) => (
                  <div key={m.id} className="item-row">
                    <div>
                      <div>{m.type === 'STOCK_IN' ? 'Stock in' : 'Stock out'}</div>
                      <div className="meta">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                    <div>{m.quantity}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </>
  );
}

export default function ItemDetailPage() {
  return (
    <RequireAuth>
      <ItemDetail />
    </RequireAuth>
  );
}
