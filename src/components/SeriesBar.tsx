"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { fmtPairs } from "@/lib/format";

interface SeriesRow {
  series: string;
  pairs: number;
  articles: number;
}

export default function SeriesBar({ data }: { data: SeriesRow[] }) {
  const reversed = [...data].reverse();

  return (
    <div className="h-full w-full" style={{ minHeight: Math.max(300, data.length * 28) }}>
      <Bar
        data={{
          labels: reversed.map((d) => d.series),
          datasets: [
            {
              data: reversed.map((d) => d.pairs),
              backgroundColor: reversed.map(
                (_, i) =>
                  `rgba(0, 226, 115, ${0.35 + (i / reversed.length) * 0.65})`
              ),
              borderRadius: 3,
              borderSkipped: false,
              maxBarThickness: 24,
            },
          ],
        }}
        options={{
          indexAxis: "y",
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
                label: (ctx) => {
                  const row = reversed[ctx.dataIndex];
                  return `${fmtPairs(Number(ctx.raw))} pairs · ${row.articles} articles`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: "rgba(255,255,255,0.04)" },
              ticks: {
                callback: (v) => {
                  const n = Number(v);
                  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);
                },
              },
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}

export function SeriesBarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="skeleton h-5" style={{ width: `${90 - i * 5}%` }} />
      ))}
    </div>
  );
}
