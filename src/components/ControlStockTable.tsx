"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import type { CSFilters } from "./ControlStockFilterBar";
import { fetcher } from "@/lib/fetcher";
import TierBadge from "./TierBadge";
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

interface CSRow {
  kode_besar: string;
  kode_kecil: string;
  kodemix: string;
  gender: string;
  series: string;
  color: string;
  tipe: string;
  tier: string;
  size: string;
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
  rows: CSRow[];
  total: number;
  page: number;
  limit: number;
}

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function fmtTo(n: number | null) {
  if (n == null) return "—";
  return n.toFixed(1) + "x";
}
function fmtAvg(n: number) {
  return n > 0 ? n.toFixed(1) : "—";
}

const filterKey = (f: CSFilters) => JSON.stringify(f);

export default function ControlStockTable({ filters }: { filters: CSFilters }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const fKey = filterKey(filters);

  useEffect(() => { setPage(1); }, [fKey]);

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
    return `/api/control-stock?${params}`;
  }, [filters, page, limit]);

  const { data, isLoading } = useSWR<TableData>(swrUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Control Stock</h3>
        <p className="text-xs text-muted-foreground">
          {data ? `${fmt(data.total)} total rows — sumber: mart.sku_portfolio_size` : "Loading..."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Kode Besar</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Kode Kecil</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Gender</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Series</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Color</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Tipe</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Tier</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Size</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Stok Global</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">WH Pusat</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">WH Bali</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">WH JKT</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Toko</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Online</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Avg 3M</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">TO WH</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">TO Total</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">YTD Sales</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">LY Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`cs-skel-${i}`} className="border-b border-border/50">
                  {Array.from({ length: 19 }).map((_, j) => (
                    <TableCell key={`cs-skel-c-${j}`} className="px-4 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              (data?.rows || []).map((row) => (
                <TableRow
                  key={`${row.kode_besar}|${row.kodemix}|${row.size}`}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.kode_besar || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.kode_kecil || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.gender || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.series || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[120px]">{row.color || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.tipe || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <TierBadge tier={row.tier} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{row.size || "—"}</TableCell>
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
