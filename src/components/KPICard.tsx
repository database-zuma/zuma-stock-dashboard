"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: number;
  formatter: (n: number) => string;
  subtitle?: string;
  accent?: boolean;
  icon: React.ReactNode;
}

export default function KPICard({
  title,
  value,
  formatter,
  subtitle,
  accent,
  icon,
}: KPICardProps) {
  const [display, setDisplay] = useState("—");
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (value === 0 && !animated.current) {
      setDisplay(formatter(0));
      return;
    }
    animated.current = true;
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setDisplay(formatter(Math.round(current)));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(formatter(value));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, formatter]);

  return (
    <Card
      ref={ref}
      className={`relative overflow-hidden py-0 transition-colors duration-300
        ${accent ? "border-l-2 border-l-primary" : ""}`}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 px-5 pt-5 pb-0">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {title}
        </CardTitle>
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center
            ${accent ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"}`}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-1">
        <p className="text-2xl lg:text-3xl font-bold tabular-nums text-card-foreground animate-count">
          {display}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KPISkeleton() {
  return (
    <Card className="py-0">
      <CardHeader className="px-5 pt-5 pb-0">
        <Skeleton className="h-3 w-24" />
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-2 space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}
