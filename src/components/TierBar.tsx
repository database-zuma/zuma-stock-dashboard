"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { fmtPairs } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface TierRow {
  tier: string;
  pairs: number;
  articles: number;
}

const TIER_ORDER = ["1", "2", "3", "4", "5", "8"];

const MONO_TIER: Record<string, string> = {
  "1": "#000000",
  "2": "#333333",
  "3": "#555555",
  "4": "#777777",
  "5": "#999999",
  "8": "#BBBBBB",
};

export default function TierBar({ data }: { data: TierRow[] }) {
  const sorted = TIER_ORDER.map(
    (t) => data.find((d) => d.tier === t) || { tier: t, pairs: 0, articles: 0 }
  );

  return (
    <div style={{ position: "relative", height: 220 }}>
      <Bar
        data={{
          labels: sorted.map((d) => `T${d.tier}`),
          datasets: [
            {
              data: sorted.map((d) => d.pairs),
              backgroundColor: sorted.map((d) => MONO_TIER[d.tier] || "#999999"),
              borderRadius: 4,
              borderSkipped: false,
              maxBarThickness: 40,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(255,255,255,0.95)",
              borderColor: "rgba(0,0,0,0.08)",
              borderWidth: 1,
              titleColor: "#000000",
              bodyColor: "#666666",
              padding: 10,
              callbacks: {
                afterLabel: (ctx) => {
                  const row = sorted[ctx.dataIndex];
                  return `${row.articles} articles`;
                },
                label: (ctx) => `${fmtPairs(Number(ctx.raw))} pairs`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 12, weight: "bold" as const } },
            },
            y: {
              grid: { color: "rgba(0,0,0,0.04)" },
              ticks: {
                callback: (v) => {
                  const n = Number(v);
                  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
                },
              },
            },
          },
        }}
      />
    </div>
  );
}

export function TierBarSkeleton() {
  return (
    <div className="flex items-end gap-2 p-4" style={{ height: 220 }}>
      {[60, 40, 80, 30, 20, 50].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
