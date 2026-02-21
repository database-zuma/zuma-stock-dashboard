"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { Skeleton } from "@/components/ui/skeleton";

interface BranchRow {
  branch: string;
  gender_group: string;
  pairs: number;
}

const GENDER_ORDER = ["Men", "Ladies", "Baby & Kids", "Unknown"];

const GENDER_COLORS: Record<string, string> = {
  "Men":         "#00E273",
  "Ladies":      "#E8266A",
  "Baby & Kids": "#5D625A",
  "Unknown":     "#C8C5BE",
};

export default function BranchChart({ data }: { data: BranchRow[] }) {
  const branches = [...new Set(data.map((d) => d.branch))];

  const branchTotals = new Map<string, number>();
  data.forEach((d) => {
    branchTotals.set(d.branch, (branchTotals.get(d.branch) || 0) + d.pairs);
  });
  branches.sort((a, b) => (branchTotals.get(b) || 0) - (branchTotals.get(a) || 0));

  const allGenders = [...new Set(data.map((d) => d.gender_group))];
  const orderedGenders = [
    ...GENDER_ORDER.filter((g) => allGenders.includes(g)),
    ...allGenders.filter((g) => !GENDER_ORDER.includes(g)),
  ];

  const datasets = orderedGenders.map((gender) => ({
    label: gender,
    data: branches.map((b) => {
      const row = data.find((d) => d.branch === b && d.gender_group === gender);
      return row ? row.pairs : 0;
    }),
    backgroundColor: GENDER_COLORS[gender] || "#999999",
    borderRadius: 3,
    borderSkipped: false as const,
  }));

  const chartHeight = Math.max(320, branches.length * 42);

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
              backgroundColor: "#FFFFFF",
              borderColor: "rgba(0,0,0,0.08)",
              borderWidth: 1,
              titleColor: "#1A1A18",
              bodyColor: "#1A1A18",
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
    <div className="flex flex-col gap-3 p-4" style={{ minHeight: 320 }}>
      {[...Array(8)].map((_, i) => (
        <Skeleton key={`bcs-${i}`} className="h-6" style={{ width: `${85 - i * 7}%` }} />
      ))}
    </div>
  );
}
