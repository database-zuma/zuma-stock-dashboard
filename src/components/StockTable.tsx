"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { fmtPairs, fmtRupiah } from "@/lib/format";
import TierBadge from "./TierBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface StockRow {
  kode_mix: string;
  article: string;
  series: string;
  gender_group: string;
  tipe: string;
  tier: string;
  branch: string;
  nama_gudang: string;
  pairs: number;
  est_rsp_value: number;
}

interface TableData {
  rows: StockRow[];
  total: number;
  page: number;
  limit: number;
}

export default function StockTable() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  const fetchData = useCallback(
    (p: number) => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      params.set("limit", String(limit));
      fetch(`/api/stock-table?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [searchParams]
  );

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  const filtered = data?.rows?.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.article || "").toLowerCase().includes(q) ||
      (r.series || "").toLowerCase().includes(q) ||
      (r.kode_mix || "").toLowerCase().includes(q)
    );
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Inventory Detail</h3>
          <p className="text-xs text-muted-foreground">
            {data ? `${fmtPairs(data.total)} total groups` : "Loading..."}
          </p>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search article, series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pr-9"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Article</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Series</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Gender</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Type</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Tier</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Branch</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Location</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Pairs</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Est. RSP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(10)].map((_, i) => (
              <TableRow key={`skel-row-${i}`} className="border-b border-border/50">
                {[...Array(9)].map((_, j) => (
                  <TableCell key={`skel-cell-${j}`} className="px-4 py-2.5">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            (filtered || []).map((row, i) => (
              <TableRow
                key={`${row.kode_mix}-${row.nama_gudang}-${i}`}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
              >
                <TableCell className="px-4 py-2.5 font-medium truncate max-w-[180px]">
                  {row.article || row.kode_mix}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground">{row.series || "—"}</TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground">{row.gender_group}</TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground">{row.tipe || "—"}</TableCell>
                <TableCell className="px-4 py-2.5">
                  <TierBadge tier={row.tier} />
                </TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground">{row.branch}</TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground truncate max-w-[140px]">
                  {row.nama_gudang || "—"}
                </TableCell>
                <TableCell className="px-4 py-2.5 tabular-nums text-right">{fmtPairs(row.pairs)}</TableCell>
                <TableCell className="px-4 py-2.5 tabular-nums text-right text-muted-foreground">
                  {fmtRupiah(row.est_rsp_value)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {fmtPairs(totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
