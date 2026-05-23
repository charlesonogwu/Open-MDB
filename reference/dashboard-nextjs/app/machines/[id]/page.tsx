'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatCents, formatRelative } from '@/app/_lib/format';
import { supabase } from '@/app/_lib/supabase';
import type { Machine, Slot, Vend } from '@/types/db';

export default function MachinePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [machine, setMachine] = useState<Machine | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [vends, setVends] = useState<Vend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [machineRes, slotsRes, vendsRes] = await Promise.all([
        supabase.from('machines').select('*').eq('id', id).maybeSingle(),
        supabase.from('slots').select('*').eq('machine_id', id).order('selection'),
        supabase
          .from('vends')
          .select('*')
          .eq('machine_id', id)
          .order('ts', { ascending: false })
          .limit(20),
      ]);
      if (cancelled) return;
      setMachine((machineRes.data as Machine | null) ?? null);
      setSlots((slotsRes.data as Slot[] | null) ?? []);
      setVends((vendsRes.data as Vend[] | null) ?? []);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading machine…</div>;
  }
  if (!machine) {
    return (
      <div className="space-y-3">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Back to fleet
        </Link>
        <div className="text-sm text-slate-700">
          No machine found with id <code>{id}</code>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Back to fleet
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{machine.label}</h1>
        <div className="text-sm text-slate-500">
          {machine.id} · {machine.location_name ?? '—'}
        </div>
        <div className="mt-3">
          <Link
            href={`/machines/${machine.id}/inventory`}
            className="inline-block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Edit inventory
          </Link>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Slot grid</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-slate-400">No slots configured for this machine yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
            {slots.map((s) => {
              const lowThreshold = Math.max(1, Math.floor(s.capacity * 0.25));
              const low = s.current_stock <= lowThreshold;
              return (
                <div
                  key={s.selection}
                  className={`rounded-md border p-2 text-sm ${
                    low ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-xs text-slate-500">Slot {s.selection}</div>
                  <div className="truncate font-medium">{s.product_sku ?? 'unassigned'}</div>
                  <div className="mt-1 text-xs">
                    {s.current_stock} / {s.capacity}
                  </div>
                  <div className="text-xs text-slate-500">{formatCents(s.retail_price_cents)}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Recent vends</h2>
        <ul className="divide-y divide-slate-100">
          {vends.length === 0 && (
            <li className="py-2 text-sm text-slate-400">No vends recorded for this machine yet.</li>
          )}
          {vends.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className="font-medium">{v.product_name ?? `Slot ${v.selection}`}</span>
                <span className="ml-2 text-slate-500">
                  {v.selection} · {v.payment_type ?? 'unknown'}
                </span>
              </div>
              <div className="text-right">
                <div>{formatCents(v.price_cents)}</div>
                <div className="text-xs text-slate-400">{formatRelative(v.ts)}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
