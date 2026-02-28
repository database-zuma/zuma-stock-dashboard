"use client";

import "./ChartSetup";
import { Chart } from "react-chartjs-2";
import { hexToRgba } from "@/lib/format";

interface BranchRow { branch: string; gender_group: string; pairs: number }

function fmt(n: number) { return n.toLocaleString("id-ID"); }

export function WarehouseTreemapSkeleton() {
  return <div className="h-[240px] bg-muted/40 rounded-lg animate-pulse" />;
}

const ZUMA_TEAL = "#002A3A";

export default function WarehouseTreemap({
  data,
  onSegmentClick,
  activeValue,
}: {
  data: BranchRow[];
  onSegmentClick?: (label: string) => void;
  activeValue?: string;
}) {
  const byBranch: Record<string, number> = {};
  for (const row of data) {
    byBranch[row.branch] = (byBranch[row.branch] || 0) + row.pairs;
  }
  const tree = Object.entries(byBranch).map(([branch, pairs]) => ({ branch, pairs }));
  const total = tree.reduce((s, r) => s + r.pairs, 0);

  const handleClick = onSegmentClick
    ? (_event: unknown, elements: { index: number }[]) => {
        if (elements.length > 0) {
          // For treemap, we need to extract the group label from raw data
          const chart = (elements[0] as any)?.element?.$context;
          const rawG = chart?.raw?.g;
          if (rawG) {
            onSegmentClick(rawG);
          }
        }
      }
    : undefined;

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
              const g = ctx.raw?.g ?? "";
              const val = ctx.raw?.v ?? 0;
              const ratio = total > 0 ? val / total : 0;
              const opacity = 0.25 + ratio * (1 - 0.25) * 4;
              const baseColor = `rgba(0, 226, 115, ${Math.min(opacity, 1).toFixed(2)})`;

              if (activeValue && g !== activeValue) {
                return hexToRgba("#00E273", Math.min(opacity, 1) * 0.35);
              }
              return baseColor;
            },
            borderColor(ctx: any) {
              if (ctx.type !== "data") return "#ffffff";
              const g = ctx.raw?.g ?? "";
              if (activeValue && g === activeValue) return ZUMA_TEAL;
              return "#ffffff";
            },
            borderWidth(ctx: any) {
              if (ctx.type !== "data") return 2;
              const g = ctx.raw?.g ?? "";
              if (activeValue && g === activeValue) return 3;
              return 2;
            },
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
          onClick: handleClick,
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
