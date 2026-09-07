'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import ItemForm from '@/components/ItemForm';
import { Item, itemsApi } from '@/lib/api';

function EditItem() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    itemsApi
      .get(id)
      .then(({ item }) => setItem(item))
      .catch((err) => setError(err.message || 'Failed to load item'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <TopBar title="Edit item" />
      <div className="container">
        {loading && <p>Loading…</p>}
        {error && <p className="error-text">{error}</p>}
        {item && <ItemForm mode="edit" initial={item} />}
      </div>
      <BottomNav />
    </>
  );
}

export default function EditItemPage() {
  return (
    <RequireAuth>
      <EditItem />
    </RequireAuth>
  );
}
