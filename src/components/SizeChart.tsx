"use client";

import "./ChartSetup";
import { Bar } from "react-chartjs-2";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtPairs, hexToRgba } from "@/lib/format";

interface SizeRow {
  ukuran: string;
  pairs:  number;
}

const ZUMA_GREEN = "#00E273";
const ZUMA_TEAL = "#002A3A";

export default function SizeChart({
  data,
  onSegmentClick,
  activeValue,
}: {
  data: SizeRow[];
  onSegmentClick?: (label: string) => void;
  activeValue?: string;
}) {
  // Filter out zero pairs for cleaner chart
  const filtered = data.filter((d) => d.pairs > 0);
  const labels = filtered.map((d) => d.ukuran);
  const activeIdx = activeValue ? labels.indexOf(activeValue) : -1;

  const bgColors = activeIdx >= 0
    ? labels.map((_, i) => (i === activeIdx ? ZUMA_TEAL : hexToRgba(ZUMA_GREEN, 0.4)))
    : ZUMA_GREEN;

  const handleClick = onSegmentClick
    ? (_event: unknown, elements: { index: number }[]) => {
        if (elements.length > 0) {
          onSegmentClick(labels[elements[0].index]);
        }
      }
    : undefined;

  return (
    <div style={{ position: "relative", height: 240 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: filtered.map((d) => d.pairs),
              backgroundColor: bgColors,
              borderRadius: 3,
              borderSkipped: false,
              maxBarThickness: 28,
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
                label: (ctx) => `${fmtPairs(Number(ctx.raw))} pairs`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, maxRotation: 45 },
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

export function SizeChartSkeleton() {
  return (
    <div className="flex items-end gap-1 px-4 pb-4" style={{ height: 240 }}>
      {[30, 55, 70, 85, 100, 90, 75, 60, 50, 65, 80, 95, 85, 70, 55, 40].map((h, i) => (
        <Skeleton key={`sc-${i}`} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
