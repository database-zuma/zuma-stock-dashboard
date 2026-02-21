"use client";

import { TIER_COLORS, TIER_LABELS } from "@/lib/format";

export default function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] || TIER_COLORS["3"];
  const label = TIER_LABELS[tier] || `T${tier}`;

  return (
    <span
      className="tier-badge"
      style={{
        backgroundColor: `${color}26`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
