"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtPairs, hexToRgba } from "@/lib/format";

interface TierRow {
  tier: string;
  pairs: number;
  articles: number;
}

const TIER_ORDER = ["1", "2", "3", "4", "5", "8"];

const MONO_TIER: Record<string, string> = {
  "1": "#00E273",
  "2": "#1A1A18",
  "3": "#5D625A",
  "4": "#A9A69F",
  "5": "#E3E3DE",
  "8": "#F0EFE9",
};

const ZUMA_TEAL = "#002A3A";

export default function TierCompositionChart({
  data,
  onSegmentClick,
  activeValue,
}: {
  data: TierRow[];
  onSegmentClick?: (label: string) => void;
  activeValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.pairs, 0);

  const sorted = TIER_ORDER.map(
    (t) => data.find((d) => d.tier === t) || { tier: t, pairs: 0, articles: 0 }
  );

  const pcts = sorted.map((d) => (total > 0 ? (d.pairs / total) * 100 : 0));
  const labels = sorted.map((d) => `T${d.tier}`);
  const activeIdx = activeValue ? labels.indexOf(activeValue) : -1;

  const bgColors = sorted.map((d, i) => {
    const color = MONO_TIER[d.tier] || "#999999";
    if (activeIdx >= 0 && i !== activeIdx) return hexToRgba(color, 0.4);
    return color;
  });

  const handleClick = onSegmentClick
    ? (_event: unknown, elements: { index: number }[]) => {
        if (elements.length > 0) {
          onSegmentClick(labels[elements[0].index]);
        }
      }
    : undefined;

  return (
    <div style={{ position: "relative", height: 220 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: pcts,
              backgroundColor: bgColors,
              borderRadius: 4,
              borderSkipped: false,
              maxBarThickness: 40,
              borderWidth: sorted.map((_, i) => (activeIdx >= 0 && i === activeIdx ? 3 : 0)),
              borderColor: sorted.map((_, i) =>
                activeIdx >= 0 && i === activeIdx ? ZUMA_TEAL : "transparent"
              ),
            },
          ],
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
                label: (ctx) => {
                  const pct = Number(ctx.raw).toFixed(1);
                  const row = sorted[ctx.dataIndex];
                  return `${pct}% — ${fmtPairs(row.pairs)} pairs`;
                },
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
              min: 0,
              max: 100,
              ticks: {
                callback: (v) => `${v}%`,
              },
            },
          },
        }}
      />
    </div>
  );
}

export function TierCompositionSkeleton() {
  return (
    <div className="flex items-end gap-2 p-4" style={{ height: 220 }}>
      {[60, 40, 80, 30, 20, 50].map((h, i) => (
        <Skeleton key={`tcs-${i}`} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
