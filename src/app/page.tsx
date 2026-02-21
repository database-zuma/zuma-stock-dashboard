"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import FilterBar from "@/components/FilterBar";
import KPICard, { KPISkeleton } from "@/components/KPICard";
import BranchChart, { BranchChartSkeleton } from "@/components/BranchChart";
import TipeDonut, { TipeDonutSkeleton } from "@/components/GenderDonut";
import TierBar, { TierBarSkeleton } from "@/components/TierBar";
import SizeChart, { SizeChartSkeleton } from "@/components/SizeChart";
import TierCompositionChart, { TierCompositionSkeleton } from "@/components/TierCompositionChart";
import StockTable from "@/components/StockTable";
import ControlStockFilterBar, { type CSFilters } from "@/components/ControlStockFilterBar";
import ControlStockTable from "@/components/ControlStockTable";
import { fmtPairs, fmtRupiah } from "@/lib/format";
import { fetcher } from "@/lib/fetcher";
import { LayoutDashboard, Table2, Menu } from "lucide-react";

interface KPIData {
  total_pairs: number;
  unique_articles: number;
  dead_stock_pairs: number;
  est_rsp_value: number;
  snapshot_date: string;
}
interface BranchRow { branch: string; gender_group: string; pairs: number }
interface TipeRow { tipe: string; pairs: number }
interface TierRow { tier: string; pairs: number; articles: number }
interface SizeRow { ukuran: string; pairs: number }

type Page = "dashboard" | "control";
type Tab = "overview" | "stock";

const DEFAULT_CS: CSFilters = {
  gender: [], series: [], color: [], tipe: [], tier: [], size: [], q: "",
};

const NAV_ITEMS: { id: Page; label: string; source: string }[] = [
  { id: "dashboard", label: "Dashboard Cache", source: "core.dashboard_cache" },
  { id: "control",   label: "SKU Portfolio",   source: "mart.sku_portfolio_size" },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [csFilters, setCsFilters] = useState<CSFilters>(DEFAULT_CS);
  const [mobileNav, setMobileNav] = useState(false);

  /* ── SWR: dashboard data (only fetched when on dashboard page) ── */
  const { data: dash } = useSWR(
    activePage === "dashboard" ? `/api/dashboard${qs ? `?${qs}` : ""}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true },
  );

  const kpis          = (dash?.kpis         as KPIData    | undefined) ?? null;
  const retailData    = (dash?.by_retail     as BranchRow[] | undefined) ?? null;
  const warehouseData = (dash?.by_warehouse  as BranchRow[] | undefined) ?? null;
  const tipeData      = (dash?.by_tipe       as TipeRow[]   | undefined) ?? null;
  const tierData      = (dash?.by_tier       as TierRow[]   | undefined) ?? null;
  const sizeData      = (dash?.by_size       as SizeRow[]   | undefined) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Mobile overlay ────────────────────────────────────── */}
      {mobileNav && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileNav(false)}
          role="presentation"
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-56 flex-shrink-0
          border-r border-border bg-card flex flex-col
          transition-transform duration-200 lg:translate-x-0
          ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 py-5 border-b border-border">
          <h1 className="text-base font-semibold tracking-tight">Stock Dashboard</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Zuma Indonesia</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActivePage(item.id); setMobileNav(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group
                ${activePage === item.id ? "bg-muted" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`transition-colors ${
                    activePage === item.id
                      ? "text-[#00E273]"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.id === "dashboard"
                    ? <LayoutDashboard className="size-4" />
                    : <Table2 className="size-4" />}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    activePage === item.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1 ml-[26px] truncate">
                {item.source}
              </p>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">MV refreshed daily · 07:00 WIB</p>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-background sticky top-0 z-30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {activePage === "dashboard" ? "Dashboard Cache" : "Control Stock"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activePage === "dashboard" ? (
                    <>
                      Snapshot:{" "}
                      {kpis?.snapshot_date
                        ? new Date(kpis.snapshot_date).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                        : "Loading..."}
                    </>
                  ) : (
                    "mart.sku_portfolio_size"
                  )}
                </p>
              </div>
            </div>

            {/* Filter bars — each page has its own */}
            {activePage === "dashboard" && <FilterBar />}
            {activePage === "control" && (
              <ControlStockFilterBar filters={csFilters} onChange={setCsFilters} />
            )}
          </div>

          {/* Tabs — only for Dashboard page */}
          {activePage === "dashboard" && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex gap-0">
              {(["overview", "stock"] as Tab[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === t
                      ? "border-[#00E273] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "overview" ? "Overview" : "Stock Detail"}
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 mt-6 pb-12 w-full">
          {/* ── Overview ──────────────────────────────────────── */}
          {activePage === "dashboard" && activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI cards */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis ? (
                  <>
                    <KPICard
                      title="Total Pairs" value={kpis.total_pairs} formatter={fmtPairs}
                      subtitle="All locations" accent
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      }
                    />
                    <KPICard
                      title="Active Articles" value={kpis.unique_articles} formatter={fmtPairs}
                      subtitle="Distinct kode_besar with stock"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                      }
                    />
                    <KPICard
                      title="Dead Stock" value={kpis.dead_stock_pairs} formatter={fmtPairs}
                      subtitle="T4+T5 pairs"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      }
                    />
                    <KPICard
                      title="Est. RSP Value" value={kpis.est_rsp_value} formatter={fmtRupiah}
                      subtitle="Retail selling price"
                      icon={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                      }
                    />
                  </>
                ) : (
                  Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={`kpi-skel-${i}`} />)
                )}
              </section>

              {/* Retail + Warehouse charts — side by side */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
                    Stock by Branch &amp; Gender
                  </h3>
                  {retailData ? <BranchChart data={retailData} /> : <BranchChartSkeleton />}
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
                    Stock by Warehouse &amp; Gender
                  </h3>
                  {warehouseData ? <BranchChart data={warehouseData} /> : <BranchChartSkeleton />}
                </div>
              </section>

              {/* Tipe + Tier — side by side */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
                    Tipe Composition
                  </h3>
                  {tipeData ? <TipeDonut data={tipeData} /> : <TipeDonutSkeleton />}
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">
                    Tier Distribution
                  </h3>
                  {tierData ? <TierBar data={tierData} /> : <TierBarSkeleton />}
                </div>
              </section>

              {/* Size Distribution */}
              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
                  Size Distribution
                </h3>
                {sizeData ? <SizeChart data={sizeData} /> : <SizeChartSkeleton />}
              </section>

              {/* Tier Compositions % */}
              <section className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
                  Tier Compositions %
                </h3>
                {tierData ? <TierCompositionChart data={tierData} /> : <TierCompositionSkeleton />}
              </section>
            </div>
          )}

          {/* ── Stock Detail ──────────────────────────────────── */}
          {activePage === "dashboard" && activeTab === "stock" && <StockTable />}

          {/* ── Control Stock ─────────────────────────────────── */}
          {activePage === "control" && <ControlStockTable filters={csFilters} />}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
