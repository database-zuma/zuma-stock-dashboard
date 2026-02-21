"use client";

import { fmtPairs, fmtRupiah } from "@/lib/format";
import TierBadge from "./TierBadge";
import { useState, useMemo } from "react";

interface DeadStockRow {
  kode_mix: string;
  article: string;
  series: string;
  gender_group: string;
  branch: string;
  tier: string;
  pairs: number;
  est_rsp_value: number;
}

export default function DeadStockTable({ data }: { data: DeadStockRow[] }) {
  const [sortKey, setSortKey] = useState<"pairs" | "est_rsp_value">("pairs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...data].sort((a, b) =>
      sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );
  }, [data, sortKey, sortDir]);

  const toggleSort = (key: "pairs" | "est_rsp_value") => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (!data.length) return null;

  const totalPairs = data.reduce((s, d) => s + d.pairs, 0);
  const totalValue = data.reduce((s, d) => s + d.est_rsp_value, 0);

  return (
    <div className="rounded-xl border border-zuma-t4/30 bg-zuma-card overflow-hidden">
      <div className="px-5 py-4 border-b border-zuma-border flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <div>
          <h3 className="font-semibold text-zuma-t4">Dead & Slow Stock</h3>
          <p className="text-xs text-zuma-muted">
            {fmtPairs(totalPairs)} pairs · {fmtRupiah(totalValue)} RSP value · T4+T5 items
          </p>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zuma-muted uppercase tracking-wider border-b border-zuma-border">
              <th className="px-4 py-3">Article</th>
              <th className="px-4 py-3">Series</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Tier</th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-zuma-accent"
                onClick={() => toggleSort("pairs")}
              >
                Pairs {sortKey === "pairs" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </th>
              <th
                className="px-4 py-3 cursor-pointer hover:text-zuma-accent text-right"
                onClick={() => toggleSort("est_rsp_value")}
              >
                Est. Value{" "}
                {sortKey === "est_rsp_value" ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 50).map((row, i) => (
              <tr
                key={`${row.kode_mix}-${row.branch}-${i}`}
                className={`border-b border-zuma-border/50 transition-colors
                  ${i % 2 === 0 ? "bg-zuma-card" : "bg-zuma-card-hover/40"}`}
              >
                <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">
                  {row.article || row.kode_mix}
                </td>
                <td className="px-4 py-2.5 text-zuma-muted">{row.series || "—"}</td>
                <td className="px-4 py-2.5 text-zuma-muted">{row.gender_group}</td>
                <td className="px-4 py-2.5 text-zuma-muted">{row.branch}</td>
                <td className="px-4 py-2.5">
                  <TierBadge tier={row.tier} />
                </td>
                <td className="px-4 py-2.5 tabular-nums">{fmtPairs(row.pairs)}</td>
                <td className="px-4 py-2.5 tabular-nums text-right text-zuma-muted">
                  {fmtRupiah(row.est_rsp_value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DeadStockSkeleton() {
  return (
    <div className="rounded-xl border border-zuma-t4/30 bg-zuma-card p-4">
      <div className="skeleton h-5 w-48 mb-4" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-8 w-full mb-2" />
      ))}
    </div>
  );
}
