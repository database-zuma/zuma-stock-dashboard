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
  "1": "#00E273",
  "2": "#00B5C8",
  "3": "#8CA3AD",
  "4": "#FF8C42",
  "5": "#FF4D4D",
  "8": "#7B6FE8",
};

export const TIER_LABELS: Record<string, string> = {
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
