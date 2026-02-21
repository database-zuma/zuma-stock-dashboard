"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { TIER_COLORS, fmtPairs } from "@/lib/format";

interface TierRow {
  tier: string;
  pairs: number;
  articles: number;
}

const TIER_ORDER = ["1", "2", "3", "4", "5", "8"];

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
              backgroundColor: sorted.map((d) => TIER_COLORS[d.tier] || "#8CA3AD"),
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
              backgroundColor: "#0A3D50",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              titleColor: "#fff",
              bodyColor: "#8CA3AD",
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
              grid: { color: "rgba(255,255,255,0.04)" },
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
        <div key={i} className="skeleton flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
