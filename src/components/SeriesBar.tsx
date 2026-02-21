"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { fmtPairs } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface SeriesRow {
  series: string;
  pairs: number;
  articles: number;
}

export default function SeriesBar({ data }: { data: SeriesRow[] }) {
  const reversed = [...data].reverse();
  const len = reversed.length || 1;

  return (
    <div style={{ position: "relative", height: Math.max(350, data.length * 28) }}>
      <Bar
        data={{
           labels: reversed.map((d) => d.series),
           datasets: [
             {
               data: reversed.map((d) => d.pairs),
                 backgroundColor: reversed.map((_, i) => {
                    if (i === 0) return "#E8630A";
                    const warmGrays = ["#1A1A18", "#3D3D39", "#5F5F5A", "#818179", "#A3A39E", "#C5C5C0", "#E8E8E5"];
                    return warmGrays[Math.min(i - 1, warmGrays.length - 1)];
                  }),
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
               backgroundColor: "#FFFFFF",
               borderColor: "rgba(0,0,0,0.08)",
               borderWidth: 1,
               titleColor: "#1A1A18",
               bodyColor: "#1A1A18",
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
              grid: { color: "rgba(0,0,0,0.04)" },
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
        <Skeleton key={i} className="h-5" style={{ width: `${90 - i * 5}%` }} />
      ))}
    </div>
  );
}
