"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import type { CSFilters } from "./ControlStockFilterBar";
import { fetcher } from "@/lib/fetcher";
import TierBadge from "./TierBadge";
import { toCSV, downloadCSV, downloadXLSX } from "@/lib/export";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface CSKodemixRow {
  kodemix: string;
  gender: string;
  series: string;
  color: string;
  tipe: string;
  tier: string;
  stok_global: number;
  wh_pusat: number;
  wh_bali: number;
  wh_jkt: number;
  stok_toko: number;
  stok_online: number;
  avg_last_3_months: number;
  to_wh: number | null;
  to_total: number | null;
  current_year_qty: number;
  last_year_qty: number;
}

interface TableData {
  rows: CSKodemixRow[];
  total: number;
  page: number;
  limit: number;
}

const HEADERS = ["Kodemix", "Gender", "Series", "Color", "Tipe", "Tier", "Stok Global", "WH Pusat", "WH Bali", "WH JKT", "Toko", "Online", "Avg 3M", "TO WH", "TO Total", "YTD Sales", "LY Sales"];
const KEYS = ["kodemix", "gender", "series", "color", "tipe", "tier", "stok_global", "wh_pusat", "wh_bali", "wh_jkt", "stok_toko", "stok_online", "avg_last_3_months", "to_wh", "to_total", "current_year_qty", "last_year_qty"];
const COL_COUNT = KEYS.length;

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function fmtTo(n: number | null) {
  if (n == null) return "—";
  return n.toFixed(1) + "x";
}
function fmtAvg(n: number) {
  return n > 0 ? n.toFixed(1) : "—";
}

export default function ControlStockKodemixTable({ filters }: { filters: CSFilters }) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("avg_last_3_months");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const limit = 10;
  const fKey = JSON.stringify(filters);

  useEffect(() => { setPage(1); }, [fKey]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sortBy !== key) return <span className="ml-0.5 text-[10px] text-muted-foreground/30">↕</span>;
    return <span className="ml-0.5 text-[10px] text-[#00E273]">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const swrUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.gender.length) params.set("gender", filters.gender.join(","));
    if (filters.series.length) params.set("series", filters.series.join(","));
    if (filters.color.length)  params.set("color", filters.color.join(","));
    if (filters.tipe.length)   params.set("tipe", filters.tipe.join(","));
    if (filters.tier.length)   params.set("tier", filters.tier.join(","));
    if (filters.size.length)   params.set("size", filters.size.join(","));
    if (filters.q)             params.set("q", filters.q);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sortBy);
    params.set("dir", sortDir);
    return `/api/control-stock-kodemix?${params}`;
  }, [filters, page, limit, sortBy, sortDir]);

  const { data, isLoading } = useSWR<TableData>(swrUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async (format: "csv" | "xlsx") => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.gender.length) params.set("gender", filters.gender.join(","));
      if (filters.series.length) params.set("series", filters.series.join(","));
      if (filters.color.length)  params.set("color", filters.color.join(","));
      if (filters.tipe.length)   params.set("tipe", filters.tipe.join(","));
      if (filters.tier.length)   params.set("tier", filters.tier.join(","));
      if (filters.size.length)   params.set("size", filters.size.join(","));
      if (filters.q)             params.set("q", filters.q);
      params.set("export", "all");
      params.set("sort", sortBy);
      params.set("dir", sortDir);
      const res = await fetch(`/api/control-stock-kodemix?${params}`);
      const json = await res.json();
      const rows = json.rows as Record<string, unknown>[];
      if (format === "csv") {
        downloadCSV(toCSV(HEADERS, rows, KEYS), "control-stock-kodemix.csv");
      } else {
        await downloadXLSX(HEADERS, rows, KEYS, "control-stock-kodemix.xlsx");
      }
    } finally {
      setExporting(false);
    }
  }, [filters, sortBy, sortDir]);

  const thClass = "text-xs uppercase tracking-wider text-muted-foreground px-4 cursor-pointer select-none hover:text-foreground transition-colors";
  const thRight = `${thClass} text-right`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Control Stock — Kodemix</h3>
          <p className="text-xs text-muted-foreground">
            {data ? `${fmt(data.total)} total rows — sumber: mart.sku_portfolio_size (grouped by kodemix)` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={exporting || !data} onClick={() => handleExport("csv")}>
            <Download className="size-3.5 mr-1.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" disabled={exporting || !data} onClick={() => handleExport("xlsx")}>
            <Download className="size-3.5 mr-1.5" /> XLSX
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className={thClass} onClick={() => handleSort("kodemix")}>
                <span className="inline-flex items-center">Kodemix {sortIcon("kodemix")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("gender")}>
                <span className="inline-flex items-center">Gender {sortIcon("gender")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("series")}>
                <span className="inline-flex items-center">Series {sortIcon("series")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("color")}>
                <span className="inline-flex items-center">Color {sortIcon("color")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("tipe")}>
                <span className="inline-flex items-center">Tipe {sortIcon("tipe")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("tier")}>
                <span className="inline-flex items-center">Tier {sortIcon("tier")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("stok_global")}>
                <span className="inline-flex items-center justify-end">Stok Global {sortIcon("stok_global")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("wh_pusat")}>
                <span className="inline-flex items-center justify-end">WH Pusat {sortIcon("wh_pusat")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("wh_bali")}>
                <span className="inline-flex items-center justify-end">WH Bali {sortIcon("wh_bali")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("wh_jkt")}>
                <span className="inline-flex items-center justify-end">WH JKT {sortIcon("wh_jkt")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("stok_toko")}>
                <span className="inline-flex items-center justify-end">Toko {sortIcon("stok_toko")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("stok_online")}>
                <span className="inline-flex items-center justify-end">Online {sortIcon("stok_online")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("avg_last_3_months")}>
                <span className="inline-flex items-center justify-end">Avg 3M {sortIcon("avg_last_3_months")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("to_wh")}>
                <span className="inline-flex items-center justify-end">TO WH {sortIcon("to_wh")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("to_total")}>
                <span className="inline-flex items-center justify-end">TO Total {sortIcon("to_total")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("current_year_qty")}>
                <span className="inline-flex items-center justify-end">YTD Sales {sortIcon("current_year_qty")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("last_year_qty")}>
                <span className="inline-flex items-center justify-end">LY Sales {sortIcon("last_year_qty")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`csk-skel-${String(i)}`} className="border-b border-border/50">
                  {Array.from({ length: COL_COUNT }).map((_, j) => (
                    <TableCell key={`csk-skel-c-${String(j)}`} className="px-4 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              (data?.rows || []).map((row) => (
                <TableRow
                  key={row.kodemix}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.kodemix || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.gender || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.series || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">{row.color || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.tipe || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <TierBadge tier={row.tier} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm text-right font-medium">{fmt(row.stok_global)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.wh_pusat)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.wh_bali)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.wh_jkt)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.stok_toko)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.stok_online)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmtAvg(row.avg_last_3_months)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmtTo(row.to_wh)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmtTo(row.to_total)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.current_year_qty)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-xs text-right text-muted-foreground">{fmt(row.last_year_qty)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {fmt(totalPages)} · {fmt(data?.total || 0)} rows
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ← Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
