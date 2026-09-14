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
  const [form, setForm] = useState<any>({
    name: initial?.name || '',
    description: initial?.description || '',
    barcode: initial?.barcode || '',
    sku: initial?.sku || '',
    category: initial?.category || '',
    unit: initial?.unit || 'pcs',
    quantity: initial?.quantity ?? 0,
    costPrice: initial ? Number(initial.costPrice) : 0,
    retailPrice: initial ? Number(initial.retailPrice) : 0,
    wholesalePrice: initial ? Number(initial.wholesalePrice) : 0,
    reorderLevel: initial?.reorderLevel ?? 0,
  });
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

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
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      {error && <p className="error-text" style={{ color: '#ff4d4d', marginBottom: '12px' }}>{error}</p>}

      <div className="field">
        <label>Name *</label>
        <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
      </div>

      <div className="field">
        <label>Barcode</label>
        <div className="row" style={{ display: 'flex', gap: '8px' }}>
          <input
            value={form.barcode}
            onChange={(e) => update('barcode', e.target.value)}
            placeholder="Scan or type barcode"
            style={{ flex: 1 }}
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
        <label>Style / Category</label>
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

      <div className="row" style={{ display: 'flex', gap: '8px' }}>
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

      <div className="row" style={{ display: 'flex', gap: '8px' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Cost Price</label>
          <input
            type="number"
            step="0.01"
            value={form.costPrice}
            onChange={(e) => update('costPrice', Number(e.target.value))}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Retail Price</label>
          <input
            type="number"
            step="0.01"
            value={form.retailPrice}
            onChange={(e) => update('retailPrice', Number(e.target.value))}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Wholesale Price</label>
          <input
            type="number"
            step="0.01"
            value={form.wholesalePrice}
            onChange={(e) => update('wholesalePrice', Number(e.target.value))}
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

      <button className="btn" type="submit" disabled={submitting} style={{ marginTop: '16px' }}>
        {submitting ? 'Saving…' : mode === 'create' ? 'Create item' : 'Save changes'}
      </button>
    </form>
  );
}