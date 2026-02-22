"use client";

import "./ChartSetup";
import { Chart } from "react-chartjs-2";

interface BranchRow { branch: string; gender_group: string; pairs: number }

function fmt(n: number) { return n.toLocaleString("id-ID"); }

export function WarehouseTreemapSkeleton() {
  return <div className="h-[240px] bg-muted/40 rounded-lg animate-pulse" />;
}

export default function WarehouseTreemap({ data }: { data: BranchRow[] }) {
  const byBranch: Record<string, number> = {};
  for (const row of data) {
    byBranch[row.branch] = (byBranch[row.branch] || 0) + row.pairs;
  }
  const tree = Object.entries(byBranch).map(([branch, pairs]) => ({ branch, pairs }));
  const total = tree.reduce((s, r) => s + r.pairs, 0);

  return (
    <div style={{ position: "relative", height: 240 }}>
      <Chart
        type="treemap"
        data={{
          datasets: [{
            tree,
            key: "pairs",
            groups: ["branch"],
            backgroundColor(ctx: any) {
              if (ctx.type !== "data") return "transparent";
              const val = ctx.raw?.v ?? 0;
              const ratio = total > 0 ? val / total : 0;
              const opacity = 0.25 + ratio * (1 - 0.25) * 4;
              return `rgba(0, 226, 115, ${Math.min(opacity, 1).toFixed(2)})`;
            },
            borderColor: "#ffffff",
            borderWidth: 2,
            spacing: 1,
            labels: {
              display: true,
              align: "center" as const,
              position: "middle" as const,
              font: { size: 11, weight: "bold" as const },
              color: "#1A1A18",
              formatter: (ctx: any) => {
                const g = ctx.raw?.g ?? "";
                const v = ctx.raw?.v ?? 0;
                return v > 0 ? `${g}\n${fmt(v)}` : g;
              },
            },
          } as any],
        }}
        options={{
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
                title: (items: any[]) => items[0]?.raw?.g ?? "",
                label: (ctx: any) => {
                  const v = ctx.raw?.v ?? 0;
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                  return `${fmt(v)} pairs (${pct}%)`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
