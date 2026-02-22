"use client";

import { useMemo } from "react";
import useSWR from "swr";
import "./ChartSetup";
import { Bar, Chart, Doughnut } from "react-chartjs-2";
import type { CSFilters } from "./ControlStockFilterBar";
import { fetcher } from "@/lib/fetcher";
import { Skeleton } from "@/components/ui/skeleton";

interface CSKPIs {
  total_skus: number;
  total_stok_global: number;
  total_wh_pusat: number;
  total_wh_bali: number;
  total_wh_jkt: number;
  total_stok_toko: number;
  total_stok_online: number;
}

interface GenderRow { gender: string; qty: number }
interface SeriesRow { series: string; qty: number }
interface TierRow   { tier: string; qty: number; articles: number }
interface ChannelRow { channel: string; qty: number }

interface SummaryData {
  kpis: CSKPIs;
  by_gender: GenderRow[];
  by_series: SeriesRow[];
  by_tier: TierRow[];
  by_channel: ChannelRow[];
}

const GENDER_COLORS: Record<string, string> = {
  Men:           "#00E273",
  Ladies:        "#E8266A",
  "Baby & Kids": "#5D625A",
  Unknown:       "#C8C5BE",
};

const TIER_ORDER = ["1", "2", "3", "4", "5", "8"];
const TIER_COLORS: Record<string, string> = {
  "1": "#00E273",
  "2": "#1A1A18",
  "3": "#5D625A",
  "4": "#A9A69F",
  "5": "#E3E3DE",
  "8": "#F5F5F0",
};

const CHANNEL_COLORS = ["#00E273", "#1A1A18", "#5D625A", "#A9A69F", "#C8C5BE"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }

function KPICard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</p>
      <p className="text-2xl font-bold tabular-nums text-card-foreground mt-1">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function ControlStockCharts({ filters }: { filters: CSFilters }) {
  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.gender.length) params.set("gender", filters.gender.join(","));
    if (filters.series.length) params.set("series", filters.series.join(","));
    if (filters.color.length)  params.set("color", filters.color.join(","));
    if (filters.tipe.length)   params.set("tipe", filters.tipe.join(","));
    if (filters.tier.length)   params.set("tier", filters.tier.join(","));
    if (filters.size.length)   params.set("size", filters.size.join(","));
    if (filters.q)             params.set("q", filters.q);
    return `/api/control-stock-summary?${params}`;
  }, [filters]);

  const { data } = useSWR<SummaryData>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`cs-kpi-skel-${String(i)}`} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis, by_gender, by_series, by_tier, by_channel } = data;

  const sortedTier = TIER_ORDER.map(
    (t) => by_tier.find((d) => d.tier === t) || { tier: t, qty: 0, articles: 0 }
  );



  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total SKUs" value={fmt(kpis.total_skus)} subtitle="Distinct kode_besar" />
        <KPICard title="Stok Global" value={fmt(kpis.total_stok_global)} subtitle="All channels" />
        <KPICard title="Stok Toko" value={fmt(kpis.total_stok_toko)} subtitle="Retail stores" />
        <KPICard title="Stok Online" value={fmt(kpis.total_stok_online)} subtitle="E-commerce" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
            Stock by Gender
          </h3>
          <div className="relative flex flex-col items-center" style={{ height: 220 }}>
            <Doughnut
              data={{
                labels: by_gender.map((g) => g.gender),
                datasets: [{
                  data: by_gender.map((g) => g.qty),
                  backgroundColor: by_gender.map((g) => GENDER_COLORS[g.gender] || "#999"),
                  borderWidth: 2,
                  borderColor: "#ffffff",
                  hoverOffset: 6,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { boxWidth: 10, padding: 14, font: { size: 11 }, usePointStyle: true, pointStyle: "circle" },
                  },
                  tooltip: {
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderWidth: 1,
                    titleColor: "#1A1A18",
                    bodyColor: "#1A1A18",
                    padding: 10,
                    callbacks: {
                      label: (ctx) => {
                        const total = by_gender.reduce((s, g) => s + g.qty, 0);
                        const pct = ((Number(ctx.raw) / total) * 100).toFixed(1);
                        return `${ctx.label}: ${fmt(Number(ctx.raw))} (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
              <p className="text-lg font-bold text-foreground">{fmt(kpis.total_stok_global)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">total</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
            Tier Distribution
          </h3>
          <div style={{ position: "relative", height: 220 }}>
            <Bar
              data={{
                labels: sortedTier.map((d) => `T${d.tier}`),
                datasets: [{
                  data: sortedTier.map((d) => d.qty),
                  backgroundColor: sortedTier.map((d) => TIER_COLORS[d.tier] || "#999"),
                  borderRadius: 4,
                  borderSkipped: false,
                  maxBarThickness: 40,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderWidth: 1,
                    titleColor: "#1A1A18",
                    bodyColor: "#1A1A18",
                    padding: 10,
                    callbacks: {
                      afterLabel: (ctx) => `${sortedTier[ctx.dataIndex].articles} articles`,
                      label: (ctx) => `${fmt(Number(ctx.raw))} pcs`,
                    },
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 12, weight: "bold" as const } } },
                  y: {
                    grid: { color: "rgba(0,0,0,0.04)" },
                    ticks: { callback: (v) => { const n = Number(v); return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n); } },
                  },
                },
              }}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Stock by Series
          </h3>
          <div style={{ position: "relative", height: 340 }}>
            <Chart
              type="treemap"
              data={{
                datasets: [{
                  tree: by_series.map((s) => ({ series: s.series, qty: s.qty })),
                  key: "qty",
                  groups: ["series"],
                  backgroundColor(ctx: any) {
                    if (ctx.type !== "data") return "transparent";
                    const total = by_series.reduce((s, r) => s + r.qty, 0);
                    const val = ctx.raw?.v ?? 0;
                    const ratio = total > 0 ? val / total : 0;
                    const minOpacity = 0.25;
                    const opacity = minOpacity + ratio * (1 - minOpacity) * 4;
                    return `rgba(0, 226, 115, ${Math.min(opacity, 1).toFixed(2)})`;
                  },
                  borderColor: "#ffffff",
                  borderWidth: 2,
                  spacing: 1,
                  labels: {
                    display: true,
                    align: "center" as const,
                    position: "middle" as const,
                    font: { size: 11, weight: "bold" as const },
                    color: "#1A1A18",
                    formatter: (ctx: any) => {
                      const g = ctx.raw?.g ?? "";
                      const v = ctx.raw?.v ?? 0;
                      return v > 0 ? `${g}\n${fmt(v)}` : g;
                    },
                  },
                } as any],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderWidth: 1,
                    titleColor: "#1A1A18",
                    bodyColor: "#1A1A18",
                    padding: 10,
                    callbacks: {
                      title: (items: any[]) => items[0]?.raw?.g ?? "",
                      label: (ctx: any) => {
                        const v = ctx.raw?.v ?? 0;
                        const total = by_series.reduce((s, r) => s + r.qty, 0);
                        const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                        return `${fmt(v)} pcs (${pct}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
            Stock by Channel
          </h3>
          <div style={{ position: "relative", height: 280 }}>
            <Bar
              data={{
                labels: by_channel.map((c) => c.channel),
                datasets: [{
                  data: by_channel.map((c) => c.qty),
                  backgroundColor: CHANNEL_COLORS.slice(0, by_channel.length),
                  borderRadius: 4,
                  borderSkipped: false,
                  maxBarThickness: 48,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#FFFFFF",
                    borderColor: "rgba(0,0,0,0.08)",
                    borderWidth: 1,
                    titleColor: "#1A1A18",
                    bodyColor: "#1A1A18",
                    padding: 10,
                    callbacks: {
                      label: (ctx) => `${fmt(Number(ctx.raw))} pcs`,
                    },
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  y: {
                    grid: { color: "rgba(0,0,0,0.04)" },
                    ticks: { callback: (v) => { const n = Number(v); return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n); } },
                  },
                },
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
