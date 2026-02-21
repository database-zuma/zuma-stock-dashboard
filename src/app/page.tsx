"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import KPICard, { KPISkeleton } from "@/components/KPICard";
import BranchChart, { BranchChartSkeleton } from "@/components/BranchChart";
import GenderDonut, { GenderDonutSkeleton } from "@/components/GenderDonut";
import TierBar, { TierBarSkeleton } from "@/components/TierBar";
import SeriesBar, { SeriesBarSkeleton } from "@/components/SeriesBar";
import DeadStockTable, { DeadStockSkeleton } from "@/components/DeadStockTable";
import StockTable from "@/components/StockTable";
import { fmtPairs, fmtRupiah } from "@/lib/format";

interface KPIData {
  total_pairs: number;
  unique_articles: number;
  dead_stock_pairs: number;
  est_rsp_value: number;
  snapshot_date: string;
}
interface BranchRow { branch: string; tier: string; pairs: number }
interface GenderRow { gender_group: string; pairs: number }
interface TierRow { tier: string; pairs: number; articles: number }
interface SeriesRow { series: string; pairs: number; articles: number }
interface DeadRow {
  kode_mix: string; article: string; series: string; gender_group: string;
  branch: string; tier: string; pairs: number; est_rsp_value: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [branchData, setBranchData] = useState<BranchRow[] | null>(null);
  const [genderData, setGenderData] = useState<GenderRow[] | null>(null);
  const [tierData, setTierData] = useState<TierRow[] | null>(null);
  const [seriesData, setSeriesData] = useState<SeriesRow[] | null>(null);
  const [deadStock, setDeadStock] = useState<DeadRow[] | null>(null);

  const fetchAll = useCallback(() => {
    const base = qs ? `?${qs}` : "";
    setKpis(null); setBranchData(null); setGenderData(null);
    setTierData(null); setSeriesData(null); setDeadStock(null);

    fetch(`/api/dashboard${base}`)
      .then(r => r.json())
      .then(d => {
        if (!d || d.error) return;
        if (d.kpis) setKpis(d.kpis);
        if (Array.isArray(d.by_branch)) setBranchData(d.by_branch);
        if (Array.isArray(d.by_gender)) setGenderData(d.by_gender);
        if (Array.isArray(d.by_tier)) setTierData(d.by_tier);
        if (Array.isArray(d.by_series)) setSeriesData(d.by_series);
      })
      .catch(() => {});

    fetch(`/api/dead-stock${base}`).then(r => r.json()).then(d => Array.isArray(d) && setDeadStock(d)).catch(() => {});
  }, [qs]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="min-h-screen pb-12">
      <header className="border-b border-zuma-border bg-zuma-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold gradient-text tracking-tight">
              ZUMA STOCK DASHBOARD
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-zuma-accent pulse-dot inline-block" />
              <span className="text-xs text-zuma-muted">
                Snapshot:{" "}
                {kpis?.snapshot_date
                  ? new Date(kpis.snapshot_date).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : "Loading..."}
              </span>
            </div>
          </div>
          <FilterBar />
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-6 space-y-6">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis ? (
            <>
              <KPICard
                title="Total Pairs" value={kpis.total_pairs} formatter={fmtPairs}
                subtitle="All locations" accent
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <KPICard
                title="Active Articles" value={kpis.unique_articles} formatter={fmtPairs}
                subtitle="Unique kode_mix"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
              />
              <KPICard
                title="Dead Stock" value={kpis.dead_stock_pairs} formatter={fmtPairs}
                subtitle="T4+T5 pairs"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
              />
              <KPICard
                title="Est. RSP Value" value={kpis.est_rsp_value} formatter={fmtRupiah}
                subtitle="Retail selling price"
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>}
              />
            </>
          ) : (
            [...Array(4)].map((_, i) => <KPISkeleton key={i} />)
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-xl border border-zuma-border bg-zuma-card p-4">
            <h3 className="font-semibold text-sm mb-3 text-zuma-muted uppercase tracking-wider">Stock by Branch &amp; Tier</h3>
            {branchData ? <BranchChart data={branchData} /> : <BranchChartSkeleton />}
          </div>
          <div className="lg:col-span-2 grid grid-rows-2 gap-4">
            <div className="rounded-xl border border-zuma-border bg-zuma-card p-4">
              <h3 className="font-semibold text-sm mb-2 text-zuma-muted uppercase tracking-wider">Gender Split</h3>
              {genderData ? <GenderDonut data={genderData} /> : <GenderDonutSkeleton />}
            </div>
            <div className="rounded-xl border border-zuma-border bg-zuma-card p-4">
              <h3 className="font-semibold text-sm mb-2 text-zuma-muted uppercase tracking-wider">Tier Distribution</h3>
              {tierData ? <TierBar data={tierData} /> : <TierBarSkeleton />}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zuma-border bg-zuma-card p-4">
          <h3 className="font-semibold text-sm mb-3 text-zuma-muted uppercase tracking-wider">Top 15 Series by Stock</h3>
          {seriesData ? <SeriesBar data={seriesData} /> : <SeriesBarSkeleton />}
        </section>

        {deadStock === null ? <DeadStockSkeleton /> : deadStock.length > 0 ? <section><DeadStockTable data={deadStock} /></section> : null}

        <section><StockTable /></section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-zuma-muted">Loading dashboard...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
