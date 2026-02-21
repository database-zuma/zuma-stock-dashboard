"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { TIER_COLORS } from "@/lib/format";

interface BranchRow {
  branch: string;
  tier: string;
  pairs: number;
}

const TIER_ORDER = ["1", "2", "3", "4", "5", "8", "0"];
const TIER_NAMES: Record<string, string> = {
  "1": "T1",
  "2": "T2",
  "3": "T3",
  "4": "T4",
  "5": "T5",
  "8": "T8",
  "0": "T0",
};

export default function BranchChart({ data }: { data: BranchRow[] }) {
  const branches = [...new Set(data.map((d) => d.branch))];

  const branchTotals = new Map<string, number>();
  data.forEach((d) => {
    branchTotals.set(d.branch, (branchTotals.get(d.branch) || 0) + d.pairs);
  });
  branches.sort((a, b) => (branchTotals.get(b) || 0) - (branchTotals.get(a) || 0));

  const datasets = TIER_ORDER.map((tier) => ({
    label: TIER_NAMES[tier],
    data: branches.map((b) => {
      const row = data.find((d) => d.branch === b && d.tier === tier);
      return row ? row.pairs : 0;
    }),
    backgroundColor: TIER_COLORS[tier],
    borderRadius: 3,
    borderSkipped: false as const,
  }));

  return (
    <div className="h-full w-full" style={{ minHeight: 280 }}>
      <Bar
        data={{ labels: branches, datasets }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: { boxWidth: 12, padding: 12, font: { size: 11 } },
            },
            tooltip: {
              backgroundColor: "#0A3D50",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              titleColor: "#fff",
              bodyColor: "#8CA3AD",
              padding: 10,
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString("id-ID")} pairs`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                callback: (v) => {
                  const n = Number(v);
                  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
                },
              },
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { size: 12 } },
            },
          },
        }}
      />
    </div>
  );
}

export function BranchChartSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skeleton h-6" style={{ width: `${80 - i * 8}%` }} />
      ))}
    </div>
  );
}
