"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fmtPairs, fmtRupiah } from "@/lib/format";
import TierBadge from "./TierBadge";

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

  const filtered = data?.rows.filter((r) => {
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
    <div className="rounded-xl border border-zuma-border bg-zuma-card overflow-hidden">
      <div className="px-5 py-4 border-b border-zuma-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold">Inventory Detail</h3>
          <p className="text-xs text-zuma-muted">
            {data ? `${fmtPairs(data.total)} total groups` : "Loading..."}
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search article, series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zuma-base border border-zuma-border rounded-lg px-4 py-2 pr-8 text-sm
              placeholder:text-zuma-muted/50 focus:border-zuma-accent/50 focus:outline-none w-64"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zuma-muted"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zuma-muted uppercase tracking-wider border-b border-zuma-border">
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Series</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Pairs</th>
              <th className="px-4 py-3 text-right">Est. RSP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-zuma-border/50">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-2.5">
                      <div className="skeleton h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              (filtered || []).map((row, i) => (
                <tr
                  key={`${row.kode_mix}-${row.nama_gudang}-${i}`}
                  className={`border-b border-zuma-border/50 transition-colors hover:bg-zuma-card-hover
                    ${i % 2 === 0 ? "bg-zuma-card" : "bg-zuma-card-hover/30"}`}
                >
                  <td className="px-4 py-2.5 font-medium truncate max-w-[180px]">
                    {row.article || row.kode_mix}
                  </td>
                  <td className="px-4 py-2.5 text-zuma-muted">{row.series || "—"}</td>
                  <td className="px-4 py-2.5 text-zuma-muted">{row.gender_group}</td>
                  <td className="px-4 py-2.5 text-zuma-muted">{row.tipe || "—"}</td>
                  <td className="px-4 py-2.5">
                    <TierBadge tier={row.tier} />
                  </td>
                  <td className="px-4 py-2.5 text-zuma-muted">{row.branch}</td>
                  <td className="px-4 py-2.5 text-zuma-muted truncate max-w-[140px]">
                    {row.nama_gudang || "—"}
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-right">{fmtPairs(row.pairs)}</td>
                  <td className="px-4 py-2.5 tabular-nums text-right text-zuma-muted">
                    {fmtRupiah(row.est_rsp_value)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && totalPages > 1 && (
        <div className="px-5 py-3 border-t border-zuma-border flex items-center justify-between">
          <p className="text-xs text-zuma-muted">
            Page {page} of {fmtPairs(totalPages)}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs rounded-lg bg-zuma-base border border-zuma-border
                disabled:opacity-30 hover:border-zuma-accent/40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg bg-zuma-base border border-zuma-border
                disabled:opacity-30 hover:border-zuma-accent/40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
