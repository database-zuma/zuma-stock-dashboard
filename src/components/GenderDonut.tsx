"use client";

import "./ChartSetup";
import { Doughnut } from "react-chartjs-2";
import { fmtPairs } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

interface GenderRow {
  gender_group: string;
  pairs: number;
}

const GENDER_MONO: Record<string, string> = {
  Men: "#00E273",
  Ladies: "#1A1A18",
  "Baby & Kids": "#5D625A",
  Unknown: "#A9A69F",
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
                (d) => GENDER_MONO[d.gender_group] || "#999999"
              ),
              borderWidth: 2,
              borderColor: "#ffffff",
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
              backgroundColor: "#FFFFFF",
              borderColor: "rgba(0,0,0,0.08)",
              borderWidth: 1,
              titleColor: "#1A1A18",
              bodyColor: "#1A1A18",
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
        <p className="text-lg font-bold text-foreground">{fmtPairs(total)}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">pairs</p>
      </div>
    </div>
  );
}

export function GenderDonutSkeleton() {
  return (
    <div className="flex items-center justify-center" style={{ height: 220 }}>
      <Skeleton className="w-36 h-36 rounded-full" />
    </div>
  );
}
