"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fmtPairs, fmtRupiah } from "@/lib/format";
import { fetcher } from "@/lib/fetcher";
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

interface MonthlyRow {
  year: number;
  month_num: number;
  month_name: string;
  kode_besar: string;
  pairs_sold: number;
  revenue: number;
}

interface TableData {
  rows: MonthlyRow[];
  total: number;
  page: number;
  limit: number;
}

const EXPORT_HEADERS = ["Year", "Month Number", "Month Name", "Kode Besar", "Pairs Sold", "Revenue (IDR)"];
const EXPORT_KEYS    = ["year", "month_num", "month_name", "kode_besar", "pairs_sold", "revenue"];

export default function SalesMonthlyTable() {
  const searchParams = useSearchParams();
  const filterKey    = searchParams.toString();
  const [page, setPage]       = useState(1);
  const [sortBy, setSortBy]   = useState("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const limit = 20;

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterKey]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "year" || key === "month_num" ? "desc" : "asc");
    }
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sortBy !== key)
      return <span className="ml-0.5 text-[10px] text-muted-foreground/30">↕</span>;
    return (
      <span className="ml-0.5 text-[10px] text-[#00E273]">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const swrKey = useMemo(() => {
    const params = new URLSearchParams(filterKey);
    params.set("page",  String(page));
    params.set("limit", String(limit));
    params.set("sort",  sortBy);
    params.set("dir",   sortDir);
    return `/api/sales-monthly?${params}`;
  }, [filterKey, page, limit, sortBy, sortDir]);

  const { data, isLoading } = useSWR<TableData>(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      setExporting(true);
      try {
        const params = new URLSearchParams(filterKey);
        params.set("export", "all");
        params.set("sort",   sortBy);
        params.set("dir",    sortDir);
        const res  = await fetch(`/api/sales-monthly?${params}`);
        const json = await res.json();
        const rows = json.rows as Record<string, unknown>[];
        if (format === "csv") {
          downloadCSV(toCSV(EXPORT_HEADERS, rows, EXPORT_KEYS), "sales-monthly.csv");
        } else {
          await downloadXLSX(EXPORT_HEADERS, rows, EXPORT_KEYS, "sales-monthly.xlsx");
        }
      } finally {
        setExporting(false);
      }
    },
    [filterKey, sortBy, sortDir]
  );

  const thClass  = "text-xs uppercase tracking-wider text-muted-foreground px-4 cursor-pointer select-none hover:text-foreground transition-colors";
  const thRight  = `${thClass} text-right`;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Sales per Kode Besar — Monthly</h3>
          <p className="text-xs text-muted-foreground">
            {data
              ? `${fmtPairs(data.total)} total rows · core.sales_with_product`
              : "Loading..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || !data}
            onClick={() => handleExport("csv")}
          >
            <Download className="size-3.5 mr-1.5" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || !data}
            onClick={() => handleExport("xlsx")}
          >
            <Download className="size-3.5 mr-1.5" /> XLSX
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead
                className={thClass}
                onClick={() => handleSort("year")}
              >
                <span className="inline-flex items-center">Year {sortIcon("year")}</span>
              </TableHead>
              <TableHead
                className={thClass}
                onClick={() => handleSort("month_num")}
              >
                <span className="inline-flex items-center">Month Number {sortIcon("month_num")}</span>
              </TableHead>
              <TableHead
                className={thClass}
                onClick={() => handleSort("month_name")}
              >
                <span className="inline-flex items-center">Month Name {sortIcon("month_name")}</span>
              </TableHead>
              <TableHead
                className={`${thClass} min-w-[140px]`}
                onClick={() => handleSort("kode_besar")}
              >
                <span className="inline-flex items-center">Kode Besar {sortIcon("kode_besar")}</span>
              </TableHead>
              <TableHead
                className={thRight}
                onClick={() => handleSort("pairs_sold")}
              >
                <span className="inline-flex items-center justify-end">
                  Pairs Sold {sortIcon("pairs_sold")}
                </span>
              </TableHead>
              <TableHead
                className={thRight}
                onClick={() => handleSort("revenue")}
              >
                <span className="inline-flex items-center justify-end">
                  Revenue {sortIcon("revenue")}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && !data ? (
              Array.from({ length: 20 }).map((_, i) => (
                <TableRow key={`skel-${String(i)}`} className="border-b border-border/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={`skel-c-${String(j)}`} className="px-4 py-2.5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              (data?.rows || []).map((row, idx) => (
                <TableRow
                  key={`${row.year}-${row.month_num}-${row.kode_besar}-${String(idx)}`}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="px-4 py-2.5 text-sm font-medium tabular-nums">
                    {row.year}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm tabular-nums text-muted-foreground">
                    {String(row.month_num).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-sm text-muted-foreground">
                    {row.month_name}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.kode_besar}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm text-right font-medium">
                    {fmtPairs(row.pairs_sold)}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 tabular-nums text-sm text-right text-muted-foreground">
                    {fmtRupiah(row.revenue)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {fmtPairs(totalPages)} · {fmtPairs(data?.total || 0)} rows
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
