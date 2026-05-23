'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatCents, formatRelative, startOfTodayIso } from '@/app/_lib/format';
import { supabase } from '@/app/_lib/supabase';
import type { Machine, Vend } from '@/types/db';

type TopSeller = {
  product_sku: string | null;
  product_name: string | null;
  units: number;
  revenue_cents: number;
};

const DAY_MS = 86_400_000;

export default function HomePage() {
  const [vends, setVends] = useState<Vend[]>([]);
  const [revenueToday, setRevenueToday] = useState(0);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineVendCounts, setMachineVendCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadInitial();

    const channel = supabase
      .channel('vends-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vends' },
        (payload) => {
          const v = payload.new as Vend;
          setVends((prev) => [v, ...prev].slice(0, 50));
          if (v.ts >= startOfTodayIso()) {
            setRevenueToday((r) => r + (v.price_cents ?? 0));
          }
          setMachineVendCounts((prev) => ({
            ...prev,
            [v.machine_id]: (prev[v.machine_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function loadInitial() {
    const [vendsRes, machinesRes] = await Promise.all([
      supabase.from('vends').select('*').order('ts', { ascending: false }).limit(50),
      supabase.from('machines').select('*').is('archived_at', null).order('label'),
    ]);
    if (vendsRes.data) setVends(vendsRes.data as Vend[]);
    if (machinesRes.data) setMachines(machinesRes.data as Machine[]);

    const today = startOfTodayIso();
    const revRes = await supabase.from('vends').select('price_cents').gte('ts', today);
    if (revRes.data) {
      const total = (revRes.data as Array<{ price_cents: number | null }>).reduce(
        (sum, r) => sum + (r.price_cents ?? 0),
        0,
      );
      setRevenueToday(total);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS).toISOString();
    const sellersRes = await supabase
      .from('vends')
      .select('product_sku, product_name, price_cents')
      .gte('ts', thirtyDaysAgo);
    if (sellersRes.data) {
      const agg = new Map<string, TopSeller>();
      for (const r of sellersRes.data as Array<Pick<Vend, 'product_sku' | 'product_name' | 'price_cents'>>) {
        const key = r.product_sku ?? '__unknown__';
        const existing = agg.get(key) ?? {
          product_sku: r.product_sku,
          product_name: r.product_name,
          units: 0,
          revenue_cents: 0,
        };
        existing.units += 1;
        existing.revenue_cents += r.price_cents ?? 0;
        agg.set(key, existing);
      }
      setTopSellers(
        Array.from(agg.values()).sort((a, b) => b.units - a.units).slice(0, 10),
      );
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const recentRes = await supabase
      .from('vends')
      .select('machine_id')
      .gte('ts', sevenDaysAgo);
    if (recentRes.data) {
      const counts: Record<string, number> = {};
      for (const r of recentRes.data as Array<{ machine_id: string }>) {
        counts[r.machine_id] = (counts[r.machine_id] ?? 0) + 1;
      }
      setMachineVendCounts(counts);
    }
  }

  const vendsToday = vends.filter((v) => v.ts >= startOfTodayIso()).length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="Revenue today" value={formatCents(revenueToday)} note="across all machines" />
        <SummaryCard title="Vends today" value={String(vendsToday)} note="in live feed window" />
        <SummaryCard title="Active machines" value={String(machines.length)} note="deployed in fleet" />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="Live vends">
          <ul className="divide-y divide-slate-100">
            {vends.length === 0 && (
              <li className="py-2 text-sm text-slate-400">No vends yet — perform a test purchase.</li>
            )}
            {vends.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{v.product_name ?? `Slot ${v.selection}`}</span>
                  <span className="ml-2 text-slate-500">
                    {v.machine_id} · {v.selection}
                  </span>
                </div>
                <div className="text-right">
                  <div>{formatCents(v.price_cents)}</div>
                  <div className="text-xs text-slate-400">{formatRelative(v.ts)}</div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Top sellers (30 days)">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2">Product</th>
                <th className="py-2 text-right">Units</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topSellers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-2 text-slate-400">
                    Not enough data yet.
                  </td>
                </tr>
              )}
              {topSellers.map((s) => (
                <tr key={s.product_sku ?? 'unknown'}>
                  <td className="py-2">{s.product_name ?? '—'}</td>
                  <td className="py-2 text-right">{s.units}</td>
                  <td className="py-2 text-right">{formatCents(s.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </section>

      <Panel title="Machines">
        {machines.length === 0 ? (
          <p className="text-sm text-slate-400">
            No machines registered. Add a row to the <code>machines</code> table to get started.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {machines.map((m) => {
              const vends7d = machineVendCounts[m.id] ?? 0;
              return (
                <li key={m.id} className="rounded-md border border-slate-200 p-3">
                  <Link href={`/machines/${m.id}`} className="block hover:opacity-80">
                    <div className="font-medium">{m.label}</div>
                    <div className="text-xs text-slate-500">
                      {m.id} · {m.location_name ?? '—'}
                    </div>
                    <div className="mt-2 text-sm">{vends7d} vends past 7 days</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function SummaryCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="text-sm text-slate-500">{note}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}
