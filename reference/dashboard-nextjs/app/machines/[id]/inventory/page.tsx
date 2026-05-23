'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/_lib/supabase';
import type { Product, Slot } from '@/types/db';

type SlotEdit = Slot & { dirty: boolean };

export default function InventoryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [slots, setSlots] = useState<SlotEdit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [slotsRes, productsRes] = await Promise.all([
        supabase.from('slots').select('*').eq('machine_id', id).order('selection'),
        supabase.from('products').select('*').order('sku'),
      ]);
      if (cancelled) return;
      setSlots(((slotsRes.data as Slot[] | null) ?? []).map((s) => ({ ...s, dirty: false })));
      setProducts((productsRes.data as Product[] | null) ?? []);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function update(selection: string, patch: Partial<Slot>) {
    setSlots((prev) =>
      prev.map((s) => (s.selection === selection ? { ...s, ...patch, dirty: true } : s)),
    );
  }

  async function saveAll() {
    const dirty = slots.filter((s) => s.dirty);
    if (dirty.length === 0) return;
    setSaving(true);
    setError(null);
    for (const s of dirty) {
      const { error: updateError } = await supabase
        .from('slots')
        .update({
          current_stock: s.current_stock,
          capacity: s.capacity,
          product_sku: s.product_sku,
          retail_price_cents: s.retail_price_cents,
          last_restocked_at: new Date().toISOString(),
        })
        .eq('machine_id', id)
        .eq('selection', s.selection);
      if (updateError) {
        setError(
          `${updateError.message}. If this is a permissions error, apply ` +
            'supabase/004_dashboard_writes.sql to enable inventory editing from the anon role.',
        );
        setSaving(false);
        return;
      }
    }
    setSlots((prev) => prev.map((s) => ({ ...s, dirty: false })));
    setSavedAt(new Date());
    setSaving(false);
  }

  const hasDirty = slots.some((s) => s.dirty);

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/machines/${id}`} className="text-sm text-slate-500 hover:underline">
          ← Back to machine
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Inventory — {id}</h1>
        <p className="text-sm text-slate-500">
          Edit stock counts, product assignments, and retail prices. Changes save in a single batch.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void saveAll()}
          disabled={saving || !hasDirty}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-300"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {savedAt && !hasDirty && (
          <span className="text-xs text-slate-500">Last saved {savedAt.toLocaleTimeString()}</span>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-slate-400">No slots to edit. Add rows to the slots table first.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="px-2 py-2">Slot</th>
              <th className="px-2 py-2">Product</th>
              <th className="px-2 py-2 text-right">Stock</th>
              <th className="px-2 py-2 text-right">Capacity</th>
              <th className="px-2 py-2 text-right">Price (cents)</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((s) => (
              <tr
                key={s.selection}
                className={`border-b border-slate-100 ${s.dirty ? 'bg-amber-50' : ''}`}
              >
                <td className="px-2 py-2 font-mono">{s.selection}</td>
                <td className="px-2 py-2">
                  <select
                    value={s.product_sku ?? ''}
                    onChange={(e) => update(s.selection, { product_sku: e.target.value || null })}
                    className="w-full max-w-xs rounded border border-slate-300 px-2 py-1"
                  >
                    <option value="">— unassigned —</option>
                    {products.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} · {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    value={s.current_stock}
                    onChange={(e) => update(s.selection, { current_stock: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    min={1}
                    value={s.capacity}
                    onChange={(e) => update(s.selection, { capacity: Number(e.target.value) })}
                    className="w-20 rounded border border-slate-300 px-2 py-1 text-right"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    value={s.retail_price_cents ?? 0}
                    onChange={(e) =>
                      update(s.selection, { retail_price_cents: Number(e.target.value) })
                    }
                    className="w-24 rounded border border-slate-300 px-2 py-1 text-right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
