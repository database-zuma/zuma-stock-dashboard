"use client";

import { fmtPairs, fmtRupiah } from "@/lib/format";
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
import { useState, useMemo } from "react";

const PAGE_SIZE = 25;

interface DeadStockRow {
  kode_besar: string;
  kode: string;
  article: string;
  series: string;
  gender_group: string;
  branch: string;
  nama_gudang: string;
  tier: string;
  group_warna: string;
  ukuran: string;
  pairs: number;
  est_rsp_value: number;
}

export default function DeadStockTable({ data }: { data: DeadStockRow[] }) {
  const [sortKey, setSortKey] = useState<"pairs" | "est_rsp_value">("pairs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: "pairs" | "est_rsp_value") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  if (!data.length) return null;

  const totalPairs = data.reduce((s, d) => s + d.pairs, 0);
  const totalValue = data.reduce((s, d) => s + d.est_rsp_value, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground">Dead & Slow Stock</h3>
          <p className="text-xs text-muted-foreground">
            {fmtPairs(totalPairs)} pairs · {fmtRupiah(totalValue)} RSP value · T4+T5 items
          </p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Article</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Series</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Gender</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Branch</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground px-4">Tier</TableHead>
            <TableHead
              className="text-xs uppercase tracking-wider text-muted-foreground px-4 cursor-pointer hover:text-foreground select-none"
              onClick={() => toggleSort("pairs")}
            >
              Pairs {sortKey === "pairs" ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </TableHead>
            <TableHead
              className="text-xs uppercase tracking-wider text-muted-foreground px-4 cursor-pointer hover:text-foreground text-right select-none"
              onClick={() => toggleSort("est_rsp_value")}
            >
              Est. Value{" "}
              {sortKey === "est_rsp_value" ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row, i) => (
            <TableRow
              key={`${row.kode_besar}|${row.nama_gudang}`}
              className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
            >
              <TableCell className="px-4 py-2.5 font-medium truncate max-w-[200px]">
                {row.article || row.kode_besar}
              </TableCell>
              <TableCell className="px-4 py-2.5 text-muted-foreground">{row.series || "—"}</TableCell>
              <TableCell className="px-4 py-2.5 text-muted-foreground">{row.gender_group}</TableCell>
              <TableCell className="px-4 py-2.5 text-muted-foreground">{row.branch}</TableCell>
              <TableCell className="px-4 py-2.5">
                <TierBadge tier={row.tier} />
              </TableCell>
              <TableCell className="px-4 py-2.5 tabular-nums">{fmtPairs(row.pairs)}</TableCell>
              <TableCell className="px-4 py-2.5 tabular-nums text-right text-muted-foreground">
                {fmtRupiah(row.est_rsp_value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {fmtPairs(sorted.length)} items
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

export function DeadStockSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-48 mb-4" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={`dead-skel-${i}`} className="h-8 w-full mb-2" />
      ))}
    </div>
  );
}
