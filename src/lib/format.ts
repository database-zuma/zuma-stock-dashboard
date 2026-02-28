export function toNum(v: unknown): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function fmtPairs(n: number): string {
  return n.toLocaleString("id-ID");
}

export function fmtRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n.toFixed(0)}`;
}

export const TIER_COLORS: Record<string, string> = {
  "1": "#000000",
  "2": "#333333",
  "3": "#666666",
  "4": "#999999",
  "5": "#CCCCCC",
  "8": "#444444",
  "0": "#BBBBBB",
};

export const TIER_LABELS: Record<string, string> = {
  "0": "T0 · Unassigned",
  "1": "T1 · Fast",
  "2": "T2 · Secondary",
  "3": "T3 · Mid",
  "4": "T4 · Discontinue",
  "5": "T5 · Dead",
  "8": "T8 · New Launch",
};

export function tierBg(tier: string): string {
  const c = TIER_COLORS[tier] || TIER_COLORS["3"];
  return `${c}26`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
