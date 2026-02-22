"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";

interface CSOptions {
  genders: string[];
  series: string[];
  colors: string[];
  tipes: string[];
  tiers: string[];
  sizes: string[];
}

export interface CSFilters {
  gender: string[];
  series: string[];
  color: string[];
  tipe: string[];
  tier: string[];
  size: string[];
  q: string;
}

function MultiSelect({
  label,
  options,
  selected,
  onToggle,
  onClear,
  renderOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  renderOption?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const labelText =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
      ? (renderOption ? renderOption(selected[0]) : selected[0])
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border bg-card text-card-foreground hover:bg-muted transition-colors
          ${selected.length > 0 ? "border-[#00E273]" : "border-border"}`}
      >
        <span className="truncate">{labelText}</span>
        <ChevronDown className={`size-3.5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] w-max max-w-[240px] max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-b border-border"
            >
              <X className="size-3" /> Clear {label}
            </button>
          )}
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              >
                <span className={`size-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}>
                  {checked && <Check className="size-2.5 text-black stroke-[3]" />}
                </span>
                <span className="truncate">{renderOption ? renderOption(opt) : opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ControlStockFilterBar({
  filters,
  onChange,
}: {
  filters: CSFilters;
  onChange: (f: CSFilters) => void;
}) {
  const [searchInput, setSearchInput] = useState(filters.q);

  const { data: opts } = useSWR<CSOptions>("/api/control-stock-filters", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const toggle = (key: keyof Omit<CSFilters, "q">, val: string) => {
    const current = filters[key];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onChange({ ...filters, [key]: next });
  };
  const clear = (key: keyof Omit<CSFilters, "q">) => onChange({ ...filters, [key]: [] });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onChange({ ...filters, q: searchInput.trim() });
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    onChange({ ...filters, q: "" });
  };

  const resetAll = () => {
    setSearchInput("");
    onChange({ gender: [], series: [], color: [], tipe: [], tier: [], size: [], q: "" });
  };

  const hasFilters =
    Object.values(filters).some((v) => (Array.isArray(v) ? v.length > 0 : v !== ""));

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-1.5 items-center w-full">
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Gender" options={opts?.genders || []} selected={filters.gender}
            onToggle={(v) => toggle("gender", v)} onClear={() => clear("gender")} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Series" options={opts?.series || []} selected={filters.series}
            onToggle={(v) => toggle("series", v)} onClear={() => clear("series")} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Color" options={opts?.colors || []} selected={filters.color}
            onToggle={(v) => toggle("color", v)} onClear={() => clear("color")} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Tipe" options={opts?.tipes || []} selected={filters.tipe}
            onToggle={(v) => toggle("tipe", v)} onClear={() => clear("tipe")} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="Tier" options={opts?.tiers || []} selected={filters.tier}
            onToggle={(v) => toggle("tier", v)} onClear={() => clear("tier")}
            renderOption={(t) => `T${t}`} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="Size" options={opts?.sizes || []} selected={filters.size}
            onToggle={(v) => toggle("size", v)} onClear={() => clear("size")} />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md
              bg-secondary text-secondary-foreground border border-border
              hover:bg-muted transition-colors flex items-center gap-1"
          >
            <X className="size-3" /> Reset
          </button>
        )}
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search kode besar... (Enter to search)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 h-8 text-xs bg-card w-full"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}
