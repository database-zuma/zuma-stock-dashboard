"use client";

import "./ChartSetup";
import { Doughnut } from "react-chartjs-2";
import { fmtPairs } from "@/lib/format";

interface GenderRow {
  gender_group: string;
  pairs: number;
}

const GENDER_COLORS: Record<string, string> = {
  Men: "#00E273",
  Ladies: "#7B6FE8",
  "Baby & Kids": "#00B5C8",
  Unknown: "#8CA3AD",
};

export default function GenderDonut({ data }: { data: GenderRow[] }) {
  const total = data.reduce((s, d) => s + d.pairs, 0);

  return (
    <div className="relative flex flex-col items-center" style={{ height: 220 }}>
      <Doughnut
        data={{
          labels: data.map((d) => d.gender_group),
          datasets: [
            {
              data: data.map((d) => d.pairs),
              backgroundColor: data.map(
                (d) => GENDER_COLORS[d.gender_group] || "#8CA3AD"
              ),
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 10,
                padding: 14,
                font: { size: 11 },
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              backgroundColor: "#0A3D50",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              titleColor: "#fff",
              bodyColor: "#8CA3AD",
              padding: 10,
              callbacks: {
                label: (ctx) => {
                  const pct = ((Number(ctx.raw) / total) * 100).toFixed(1);
                  return `${ctx.label}: ${fmtPairs(Number(ctx.raw))} (${pct}%)`;
                },
              },
            },
          },
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
        <p className="text-lg font-bold">{fmtPairs(total)}</p>
        <p className="text-[10px] text-zuma-muted uppercase tracking-wider">pairs</p>
      </div>
    </div>
  );
}

export function GenderDonutSkeleton() {
  return (
    <div className="flex items-center justify-center" style={{ height: 220 }}>
      <div className="skeleton w-36 h-36 rounded-full" />
    </div>
  );
}
