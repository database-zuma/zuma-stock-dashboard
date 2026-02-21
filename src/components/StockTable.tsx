"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fmtPairs, fmtRupiah } from "@/lib/format";
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

interface StockRow {
  kode_besar: string;
  kode: string;
  article: string;
  series: string;
  gender_group: string;
  tipe: string;
  tier: string;
  branch: string;
  nama_gudang: string;
  group_warna: string;
  ukuran: string;
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
  const filterKey = searchParams.toString();
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => { setPage(1); }, [filterKey]);

  const swrKey = useMemo(() => {
    const params = new URLSearchParams(filterKey);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return `/api/stock-table?${params}`;
  }, [filterKey, page, limit]);

  const { data, isLoading } = useSWR<TableData>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Inventory Detail</h3>
        <p className="text-xs text-muted-foreground">
          {data ? `${fmtPairs(data.total)} total rows` : "Loading..."}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 min-w-[160px]">Article</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Kode Besar</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Kode</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Series</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Gender</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Color</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Size</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Tier</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Branch</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 min-w-[160px]">Gudang</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Pairs</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4 text-right">Est. RSP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skel-${i}`} className="border-b border-border/50">
                  {Array.from({ length: 13 }).map((_, j) => (
                    <TableCell key={`skel-c-${j}`} className="px-4 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              (data?.rows || []).map((row) => (
                <TableRow
                  key={`${row.kode_besar}|${row.nama_gudang}|${row.ukuran}`}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="px-4 py-2.5 font-medium text-sm truncate max-w-[180px]">
                    {row.article || row.kode_besar}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.kode_besar || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.kode || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.series || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.gender_group}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.tipe || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.group_warna || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.ukuran || "—"}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <TierBadge tier={row.tier} />
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">{row.branch}</TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground truncate max-w-[160px]">
                    {row.nama_gudang || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm text-right font-medium">{fmtPairs(row.pairs)}</TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm text-right text-muted-foreground">
                    {fmtRupiah(row.est_rsp_value)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {fmtPairs(totalPages)} · {fmtPairs(data?.total || 0)} rows
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
