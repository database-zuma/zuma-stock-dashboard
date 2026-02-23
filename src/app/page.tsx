"use client";


import { Suspense, useState, useMemo } from "react";
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
import ControlStockCharts from "@/components/ControlStockCharts";
import ControlStockKodemixTable from "@/components/ControlStockKodemixTable";
import SsrFilterBar, { type SsrFilters, getDefaultSsrFilters } from "@/components/SsrFilterBar";
import PyramidChart, { PyramidChartSkeleton } from "@/components/PyramidChart";
import WarehouseTreemap, { WarehouseTreemapSkeleton } from "@/components/WarehouseTreemap";
import "@/components/ChartSetup";
import { fmtPairs, fmtRupiah } from "@/lib/format";
import { fetcher } from "@/lib/fetcher";
import { LayoutDashboard, Table2, BarChart3, Menu, ChevronsLeft } from "lucide-react";

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

type Page = "dashboard" | "control" | "ssr";
type Tab = "overview" | "stock";
type ControlTab = "charts" | "table" | "table-kodemix";

const DEFAULT_CS: CSFilters = {
  gender: [], series: [], color: [], tipe: [], tier: [], size: [], v: [], q: "",
};

const NAV_ITEMS: { id: Page; label: string; source: string }[] = [
  { id: "dashboard", label: "Accurate Stock",     source: "core.dashboard_cache" },
  { id: "control",   label: "Control Stock",       source: "mart.sku_portfolio_size" },
  { id: "ssr",       label: "Sales Stock Ratio",   source: "mart.sales_stock_ratio" },
];


/* ── SSR Page sub-component ───────────────────────────── */
interface SsrSummary {
  total_stock: number;
  total_sales: number;
  total_sales_amount: number;
  ratio: number;
  stocked_articles: number;
  sold_articles: number;
  date_from: string;
  date_to: string;
}
interface SsrDataRow { group_key: string; label: string; stock: number; sales: number; ratio: number }
interface SsrDataResp { rows: SsrDataRow[]; group_by: string; date_from: string; date_to: string }

function SsrPage({ filters }: { filters: SsrFilters }) {
  const ssrQs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("date_from", filters.date_from);
    p.set("date_to", filters.date_to);
    p.set("group_by", filters.group_by);
    if (filters.branch.length) p.set("branch", filters.branch.join(","));
    if (filters.store_category.length) p.set("store_category", filters.store_category.join(","));
    if (filters.nama_gudang.length) p.set("nama_gudang", filters.nama_gudang.join(","));
    if (filters.gender.length) p.set("gender", filters.gender.join(","));
    if (filters.series.length) p.set("series", filters.series.join(","));
    if (filters.tipe.length) p.set("tipe", filters.tipe.join(","));
    if (filters.tier.length) p.set("tier", filters.tier.join(","));
    if (filters.color.length) p.set("color", filters.color.join(","));
    if (filters.v.length) p.set("v", filters.v.join(","));
    return p.toString();
  }, [filters]);

  const { data: summary, error: summaryError } = useSWR<SsrSummary>(
    `/api/ssr/summary?${ssrQs}`, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true },
  );
  const { data: chartResp, error: chartError } = useSWR<SsrDataResp>(
    `/api/ssr/data?${ssrQs}`, fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000, keepPreviousData: true },
  );

  const groupLabel = filters.group_by === "kode_besar" ? "Article" : filters.group_by === "nama_gudang" ? "Store" : filters.group_by === "series" ? "Series" : "Branch";

  return (
    <div className="space-y-6">
      {/* Error state */}
      {(summaryError || chartError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load data. Please try again or adjust your filters.
        </div>
      )}
      {/* KPI cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary ? (
          <>
            <KPICard
              title="Current Stock" value={summary.total_stock} formatter={fmtPairs}
              subtitle="All filtered locations" accent
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
            <KPICard
              title="Period Sales" value={summary.total_sales} formatter={fmtPairs}
              subtitle={`${summary.date_from} — ${summary.date_to}`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <KPICard
              title="S/S Ratio" value={Math.round((summary.ratio ?? 0) * 1000) / 10} formatter={(v) => v.toFixed(1) + "%"}
              subtitle="Sales ÷ Stock"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" />
                </svg>
              }
            />
            <KPICard
              title="Stocked Articles" value={summary.stocked_articles} formatter={fmtPairs}
              subtitle={`${summary.sold_articles?.toLocaleString() ?? 0} with sales`}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              }
            />
          </>
        ) : summaryError ? (
          Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={`ssr-skel-${i}`} />)
        ) : (
          Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={`ssr-skel-${i}`} />)
        )}
      </section>
      {/* Pyramid chart */}
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
          Stock vs Sales — by {groupLabel}
        </h3>
        {chartError ? (
          <div className="w-full h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Failed to load chart data
          </div>
        ) : chartResp?.rows ? (
          <PyramidChart data={chartResp.rows} />
        ) : (
          <PyramidChartSkeleton />
        )}
      </section>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [csFilters, setCsFilters] = useState<CSFilters>(DEFAULT_CS);
  const [controlTab, setControlTab] = useState<ControlTab>("charts");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [ssrFilters, setSsrFilters] = useState<SsrFilters>(getDefaultSsrFilters);

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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex-shrink-0
          border-r border-border bg-card flex flex-col
          transition-all duration-200 lg:translate-x-0
          ${sidebarHidden ? "lg:w-14 lg:min-w-[3.5rem]" : "w-56"}
          ${mobileNav ? "translate-x-0 w-56" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`px-5 py-5 border-b border-border ${sidebarHidden ? "lg:px-2 lg:py-4 lg:flex lg:justify-center" : ""}`}>
          {sidebarHidden ? (
            <img src="/zuma-logo.png" alt="Zuma" className="hidden lg:block h-7 w-auto" />
          ) : (
            <div className="flex items-center gap-2.5">
              <img src="/zuma-logo.png" alt="Zuma" className="h-7 w-auto" />
              <div>
                <h1 className="text-[13px] font-bold tracking-widest uppercase">Stock Dashboard</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Zuma Indonesia</p>
              </div>
            </div>
          )}
          {/* Mobile: always show full header when sidebar is collapsed on desktop */}
          {sidebarHidden && (
            <div className="lg:hidden flex items-center gap-2.5">
              <img src="/zuma-logo.png" alt="Zuma" className="h-7 w-auto" />
              <div>
                <h1 className="text-[13px] font-bold tracking-widest uppercase">Stock Dashboard</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Zuma Indonesia</p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActivePage(item.id); setMobileNav(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group
                ${activePage === item.id ? "bg-muted" : "hover:bg-muted/50"}`}
              title={sidebarHidden ? item.label : undefined}
            >
              <div className={`flex items-center gap-2.5 ${sidebarHidden ? "lg:justify-center" : ""}`}>
                <span
                  className={`transition-colors ${
                    activePage === item.id
                      ? "text-[#00E273]"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.id === "dashboard"
                    ? <LayoutDashboard className="size-4" />
                    : item.id === "ssr"
                    ? <BarChart3 className="size-4" />
                    : <Table2 className="size-4" />}
                </span>
                <span
                  className={`text-sm transition-colors ${sidebarHidden ? "lg:hidden" : ""}
                    ${activePage === item.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                    }`}
                >
                  {item.label}
                </span>
              </div>
              <p className={`text-[10px] font-mono text-muted-foreground mt-1 ml-[26px] truncate ${sidebarHidden ? "lg:hidden" : ""}`}>
                {item.source}
              </p>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className={`text-[10px] text-muted-foreground ${sidebarHidden ? "lg:hidden" : ""}`}>MV refreshed daily · 07:00 WIB</p>
          <button
            type="button"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            className={`hidden lg:flex items-center justify-center w-full mt-2 p-1.5 rounded-md
              text-muted-foreground hover:text-foreground hover:bg-muted transition-colors`}
            title={sidebarHidden ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft className={`size-4 transition-transform duration-200 ${sidebarHidden ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-background sticky top-0 z-30">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => sidebarHidden ? setSidebarHidden(false) : setMobileNav(true)}
                className={`${sidebarHidden ? "" : "lg:hidden"} p-1.5 rounded-md hover:bg-muted transition-colors`}
              >
                <Menu className="size-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {activePage === "dashboard" ? "Accurate Stock" : activePage === "control" ? "Control Stock" : "Sales Stock Ratio"}
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
                  ) : activePage === "control" ? (
                    "mart.sku_portfolio_size"
                  ) : (
                    "mart.sales_stock_ratio"
                  )}
                </p>
              </div>
            </div>

            {/* Filter bars — each page has its own */}
            {activePage === "dashboard" && <FilterBar />}
            {activePage === "control" && (
              <ControlStockFilterBar filters={csFilters} onChange={setCsFilters} />
            )}
            {activePage === "ssr" && (
              <SsrFilterBar filters={ssrFilters} onChange={setSsrFilters} />
            )}
          </div>

          {/* Tabs — only for Dashboard page */}
          {activePage === "dashboard" && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex gap-0">
              {([
                ["overview", "Overview"],
                ["stock",    "Stock Detail"],
              ] as [Tab, string][]).map(([t, label]) => (
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
                  {label}
                </button>
              ))}
            </div>
          )}
          {activePage === "control" && (
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex gap-0">
              {([
                ["charts",        "Charts"],
                ["table",         "Table Kode Besar"],
                ["table-kodemix", "Table Kodemix"],
              ] as [ControlTab, string][]).map(([t, label]) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setControlTab(t)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    controlTab === t
                      ? "border-[#00E273] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
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
                    Stock by Warehouse
                  </h3>
                  {warehouseData ? <WarehouseTreemap data={warehouseData} /> : <WarehouseTreemapSkeleton />}
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
          {activePage === "control" && controlTab === "charts" && <ControlStockCharts filters={csFilters} />}
          {activePage === "control" && controlTab === "table" && <ControlStockTable filters={csFilters} />}
          {activePage === "control" && controlTab === "table-kodemix" && <ControlStockKodemixTable filters={csFilters} />}
          {activePage === "ssr" && <SsrPage filters={ssrFilters} />}
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
