"use client";

import { TIER_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export default function TierBadge({ tier }: { tier: string }) {
  const label = TIER_LABELS[tier] || `T${tier}`;

  return (
    <Badge variant="outline" className="text-[10px] font-medium tracking-tight">
      {label}
    </Badge>
  );
}
