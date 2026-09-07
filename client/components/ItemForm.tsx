'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ItemInput, itemsApi, ApiError } from '@/lib/api';
import BarcodeScanner from './BarcodeScanner';

interface Props {
  initial?: Item;
  mode: 'create' | 'edit';
}

export default function ItemForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ItemInput>({
    name: initial?.name || '',
    description: initial?.description || '',
    barcode: initial?.barcode || '',
    sku: initial?.sku || '',
    category: initial?.category || '',
    unit: initial?.unit || 'pcs',
    quantity: initial?.quantity ?? 0,
    costPrice: initial ? Number(initial.costPrice) : 0,
    sellingPrice: initial ? Number(initial.sellingPrice) : 0,
    reorderLevel: initial?.reorderLevel ?? 0,
  });
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof ItemInput, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleScan = (code: string) => {
    update('barcode', code);
    setScanning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        const { item } = await itemsApi.create(form);
        router.push(`/items/${item.id}`);
      } else if (initial) {
        await itemsApi.update(initial.id, form);
        router.push(`/items/${initial.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {error && <p className="error-text">{error}</p>}

      <div className="field">
        <label>Name *</label>
        <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
      </div>

      <div className="field">
        <label>Barcode</label>
        <div className="row">
          <input
            value={form.barcode}
            onChange={(e) => update('barcode', e.target.value)}
            placeholder="Scan or type barcode"
          />
          <button type="button" className="icon-btn" onClick={() => setScanning((s) => !s)} aria-label="Scan barcode">
            📷
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: 10 }}>
            <BarcodeScanner active={scanning} onDetected={handleScan} />
          </div>
        )}
      </div>

      <div className="field">
        <label>SKU</label>
        <input value={form.sku} onChange={(e) => update('sku', e.target.value)} />
      </div>

      <div className="field">
        <label>Category</label>
        <input value={form.category} onChange={(e) => update('category', e.target.value)} />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Unit</label>
          <input value={form.unit} onChange={(e) => update('unit', e.target.value)} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>{mode === 'create' ? 'Opening quantity' : 'Quantity (read-only)'}</label>
          <input
            type="number"
            value={form.quantity}
            disabled={mode === 'edit'}
            onChange={(e) => update('quantity', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Cost price</label>
          <input
            type="number"
            step="0.01"
            value={form.costPrice}
            onChange={(e) => update('costPrice', Number(e.target.value))}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Selling price</label>
          <input
            type="number"
            step="0.01"
            value={form.sellingPrice}
            onChange={(e) => update('sellingPrice', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field">
        <label>Reorder level (low stock alert)</label>
        <input
          type="number"
          value={form.reorderLevel}
          onChange={(e) => update('reorderLevel', Number(e.target.value))}
        />
      </div>

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : mode === 'create' ? 'Create item' : 'Save changes'}
      </button>
    </form>
  );
}
