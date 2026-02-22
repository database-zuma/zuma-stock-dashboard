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
  const [sortBy, setSortBy] = useState("pairs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const limit = 10;

  useEffect(() => { setPage(1); }, [filterKey]);

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

  const swrKey = useMemo(() => {
    const params = new URLSearchParams(filterKey);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", sortBy);
    params.set("dir", sortDir);
    return `/api/stock-table?${params}`;
  }, [filterKey, page, limit, sortBy, sortDir]);

  const { data, isLoading } = useSWR<TableData>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const thClass = "text-xs uppercase tracking-wider text-muted-foreground px-4 cursor-pointer select-none hover:text-foreground transition-colors";
  const thRight = `${thClass} text-right`;

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
              <TableHead className={`${thClass} min-w-[160px]`} onClick={() => handleSort("article")}>
                <span className="inline-flex items-center">Article {sortIcon("article")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("kode_besar")}>
                <span className="inline-flex items-center">Kode Besar {sortIcon("kode_besar")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("kode")}>
                <span className="inline-flex items-center">Kode {sortIcon("kode")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("series")}>
                <span className="inline-flex items-center">Series {sortIcon("series")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("gender_group")}>
                <span className="inline-flex items-center">Gender {sortIcon("gender_group")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("tipe")}>
                <span className="inline-flex items-center">Type {sortIcon("tipe")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("group_warna")}>
                <span className="inline-flex items-center">Color {sortIcon("group_warna")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("ukuran")}>
                <span className="inline-flex items-center">Size {sortIcon("ukuran")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("tier")}>
                <span className="inline-flex items-center">Tier {sortIcon("tier")}</span>
              </TableHead>
              <TableHead className={thClass} onClick={() => handleSort("branch")}>
                <span className="inline-flex items-center">Branch {sortIcon("branch")}</span>
              </TableHead>
              <TableHead className={`${thClass} min-w-[160px]`} onClick={() => handleSort("nama_gudang")}>
                <span className="inline-flex items-center">Gudang {sortIcon("nama_gudang")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("pairs")}>
                <span className="inline-flex items-center justify-end">Pairs {sortIcon("pairs")}</span>
              </TableHead>
              <TableHead className={thRight} onClick={() => handleSort("est_rsp_value")}>
                <span className="inline-flex items-center justify-end">Est. RSP {sortIcon("est_rsp_value")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skel-${String(i)}`} className="border-b border-border/50">
                  {Array.from({ length: 13 }).map((_, j) => (
                    <TableCell key={`skel-c-${String(j)}`} className="px-4 py-2.5">
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
