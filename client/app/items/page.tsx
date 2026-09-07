'use client';

<<<<<<< HEAD
import { useEffect, useState, useCallback } from 'react';
=======
import { useRef, useState } from 'react';
>>>>>>> 80c67bd0b7a27054c2a21e0173fca4bdd288c9e0
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
<<<<<<< HEAD
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
=======
import { itemsApi, ImportResult, ApiError } from '@/lib/api';

const TEMPLATE_CSV =
  'name,barcode,sku,category,unit,quantity,costPrice,sellingPrice,reorderLevel,description\n' +
  'Coca-Cola 50cl,5449000000996,,Drinks,pcs,100,400,500,20,\n' +
  'Peak Milk 400g,,PM-400,Dairy,pcs,50,4000,4500,10,\n';

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ImportInner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setResult(null);
    setUploading(true);
    try {
      const res = await itemsApi.import(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
>>>>>>> 80c67bd0b7a27054c2a21e0173fca4bdd288c9e0
  };

  return (
    <>
<<<<<<< HEAD
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
=======
      <TopBar title="Bulk import" />
      <div className="container">
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Import products from a spreadsheet</h3>
          <p className="meta">
            Upload a CSV or Excel (.xlsx) file with columns like <code>name</code>,{' '}
            <code>barcode</code>, <code>sku</code>, <code>category</code>, <code>unit</code>,{' '}
            <code>quantity</code>, <code>costPrice</code>, <code>sellingPrice</code>,{' '}
            <code>reorderLevel</code>, <code>description</code>. Only <code>name</code> is required.
          </p>
          <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>
            Download template CSV
          </button>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Upload file</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {fileName && <p className="meta" style={{ marginTop: 8 }}>{uploading ? 'Uploading' : 'Uploaded'}: {fileName}</p>}
          {error && <p className="error-text">{error}</p>}
        </div>

        {result && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Import result</h3>
            <p className="success-text">
              Imported {result.imported} of {result.total} rows.
            </p>
            {result.errors.length > 0 && (
              <>
                <p className="error-text" style={{ marginBottom: 8 }}>
                  {result.errors.length} row(s) skipped:
                </p>
                <div className="item-list">
                  {result.errors.map((e, i) => (
                    <div key={i} className="item-row">
                      <div>Row {e.row}</div>
                      <div className="meta">{e.reason}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Link href="/items" className="btn" style={{ display: 'inline-block', width: 'auto', marginTop: 16 }}>
              View items
            </Link>
          </div>
        )}
>>>>>>> 80c67bd0b7a27054c2a21e0173fca4bdd288c9e0
      </div>
      <BottomNav />
    </>
  );
}

<<<<<<< HEAD
export default function ItemsPage() {
  return (
    <RequireAuth>
      <ItemsList />
=======
export default function ImportPage() {
  return (
    <RequireAuth>
      <ImportInner />
>>>>>>> 80c67bd0b7a27054c2a21e0173fca4bdd288c9e0
    </RequireAuth>
  );
}
