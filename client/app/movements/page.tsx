'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { Movement, movementsApi } from '@/lib/api';

function MovementsList() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filter, setFilter] = useState<'' | 'STOCK_IN' | 'STOCK_OUT'>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    movementsApi
      .list({ type: filter || undefined })
      .then(({ movements }) => setMovements(movements))
      .catch((err) => setError(err.message || 'Failed to load movements'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <>
      <TopBar title="Movements" />
      <div className="container">
        <div className="row" style={{ marginBottom: 16 }}>
          <button
            className={`btn ${filter === '' ? '' : 'btn-secondary'}`}
            onClick={() => setFilter('')}
          >
            All
          </button>
          <button
            className={`btn ${filter === 'STOCK_IN' ? '' : 'btn-secondary'}`}
            onClick={() => setFilter('STOCK_IN')}
          >
            Stock in
          </button>
          <button
            className={`btn ${filter === 'STOCK_OUT' ? '' : 'btn-secondary'}`}
            onClick={() => setFilter('STOCK_OUT')}
          >
            Stock out
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading && <p>Loading…</p>}
        {!loading && movements.length === 0 && <p className="empty-state">No movements recorded yet.</p>}

        <div className="item-list">
          {movements.map((m) => (
            <div key={m.id} className="item-row">
              <div>
                <div>{m.item?.name || 'Unknown item'}</div>
                <div className="meta">
                  {new Date(m.createdAt).toLocaleString()} {m.note ? `· ${m.note}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: m.type === 'STOCK_IN' ? '#86efac' : '#fca5a5' }}>
                  {m.type === 'STOCK_IN' ? '+' : '-'}
                  {m.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </>
  );
}

export default function MovementsPage() {
  return (
    <RequireAuth>
      <MovementsList />
    </RequireAuth>
  );
}
