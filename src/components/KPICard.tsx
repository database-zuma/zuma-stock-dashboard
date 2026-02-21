"use client";

import { useEffect, useRef, useState } from "react";

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
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-xl p-5 border transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${
          accent
            ? "bg-zuma-card border-l-[3px] border-l-zuma-accent border-zuma-border card-glow-accent"
            : "bg-zuma-card border-zuma-border card-glow"
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-zuma-muted font-medium mb-2">
            {title}
          </p>
          <p className="text-2xl lg:text-3xl font-bold tabular-nums animate-count">
            {display}
          </p>
          {subtitle && (
            <p className="text-xs text-zuma-muted mt-1.5">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
            ${accent ? "bg-zuma-accent/15 text-zuma-accent" : "bg-white/5 text-zuma-muted"}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="rounded-xl p-5 border border-zuma-border bg-zuma-card">
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-8 w-32 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}
