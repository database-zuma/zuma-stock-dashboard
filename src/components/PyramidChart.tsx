"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

interface PyramidRow {
  label: string;
  stock: number;
  sales: number;
  ratio: number;
}

export function PyramidChartSkeleton() {
  return (
    <div className="w-full h-[500px] flex items-center justify-center">
      <div className="text-muted-foreground text-sm animate-pulse">Loading chart…</div>
    </div>
  );
}

export default function PyramidChart({ data }: { data: PyramidRow[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  const chartData = [...data].reverse().map((d) => ({
    label: d.label.length > 28 ? d.label.slice(0, 25) + "…" : d.label,
    fullLabel: d.label,
    stock: -d.stock,
    sales: d.sales,
    stockAbs: d.stock,
    salesAbs: d.sales,
    ratio: d.ratio,
  }));

  const height = Math.max(360, chartData.length * 36 + 60);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        barGap={-14}
        barCategoryGap="25%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.12} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => Math.abs(v).toLocaleString()}
          tick={{ fontSize: 10, fill: "#a1a1aa" }}
          axisLine={{ stroke: "#3f3f46", strokeWidth: 0.5 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
                <p className="font-semibold mb-1.5 text-foreground">{d.fullLabel}</p>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="size-2 rounded-full bg-zinc-500" />
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="font-medium text-foreground">{d.stockAbs.toLocaleString()} prs</span>
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="size-2 rounded-full bg-[#00E273]" />
                  <span className="text-muted-foreground">Sales:</span>
                  <span className="font-medium text-foreground">{d.salesAbs.toLocaleString()} prs</span>
                </div>
                <p className="text-muted-foreground mt-1 pt-1 border-t border-border">
                  Ratio: {d.ratio != null ? (d.ratio * 100).toFixed(1) + "%" : "—"}
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine x={0} stroke="#52525b" strokeWidth={1} />
        <Bar dataKey="stock" fill="#71717a" name="Stock" radius={[4, 0, 0, 4]} barSize={14} />
        <Bar dataKey="sales" fill="#00E273" name="Sales" radius={[0, 4, 4, 0]} barSize={14} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value: string) => (
            <span className="text-muted-foreground text-xs">{value}</span>
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
