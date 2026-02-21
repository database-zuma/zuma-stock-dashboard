"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { Skeleton } from "@/components/ui/skeleton";

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

const MONO_TIER: Record<string, string> = {
  "1": "#000000",
  "2": "#333333",
  "3": "#555555",
  "4": "#777777",
  "5": "#999999",
  "8": "#BBBBBB",
  "0": "#DDDDDD",
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
    backgroundColor: MONO_TIER[tier],
    borderRadius: 3,
    borderSkipped: false as const,
  }));

  const chartHeight = Math.max(280, branches.length * 40);

  return (
    <div style={{ position: "relative", height: chartHeight }}>
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
              backgroundColor: "rgba(255,255,255,0.95)",
              borderColor: "rgba(0,0,0,0.08)",
              borderWidth: 1,
              titleColor: "#000000",
              bodyColor: "#666666",
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
              grid: { color: "rgba(0,0,0,0.04)" },
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
        <Skeleton key={i} className="h-6" style={{ width: `${80 - i * 8}%` }} />
      ))}
    </div>
  );
}
