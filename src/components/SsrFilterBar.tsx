"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import useSWR from "swr";
import { X, ChevronDown, Check } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface SsrOptions {
  branches: string[];
  store_categories: string[];
  stores: string[];
  genders: string[];
  series: string[];
  tipes: string[];
  tiers: string[];
  colors: string[];
  versions: string[];
}

export interface SsrFilters {
  date_from: string;
  date_to: string;
  group_by: string;
  branch: string[];
  store_category: string[];
  nama_gudang: string[];
  gender: string[];
  series: string[];
  tipe: string[];
  tier: string[];
  color: string[];
  v: string[];
}

export function getDefaultSsrFilters(): SsrFilters {
  const today = new Date();
  const yearStart = `${today.getFullYear()}-01-01`;
  return {
    date_from: yearStart,
    date_to: today.toISOString().split("T")[0],
    group_by: "kode_besar",
    branch: [], store_category: [], nama_gudang: [],
    gender: [], series: [], tipe: [], tier: [], color: [], v: [],
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function MultiSelect({
  label, options, selected, onToggle, onClear, onSelectAll, renderOption,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
  onSelectAll: (opts: string[]) => void;
  renderOption?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options,
    [options, search],
  );

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.includes(o));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
    else setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const labelText = selected.length === 0
    ? label
    : selected.length === 1
      ? (renderOption ? renderOption(selected[0]) : selected[0])
      : `${selected.length} sel`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full inline-flex items-center justify-between gap-1 px-2 py-1.5 text-[11px] font-medium rounded-md border bg-card text-card-foreground hover:bg-muted transition-colors
          ${selected.length > 0 ? "border-[#00E273]" : "border-border"}`}
      >
        <span className="truncate">{labelText}</span>
        <ChevronDown className={`size-3 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] w-max max-w-[220px] rounded-md border border-border bg-card shadow-lg">
          <div className="p-1.5 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-[#00E273]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length > 0 && (
              <button type="button" onClick={() => onSelectAll(filtered)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border">
                <span className={`size-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors
                  ${allSelected ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}>
                  {allSelected && <Check className="size-2.5 text-black stroke-[3]" />}
                </span>
                <span className="text-muted-foreground">Select All</span>
              </button>
            )}
            {selected.length > 0 && (
              <button type="button" onClick={onClear}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-b border-border">
                <X className="size-3" /> Clear
              </button>
            )}
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>}
            {filtered.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => onToggle(opt)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left">
                  <span className={`size-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}>
                    {checked && <Check className="size-2.5 text-black stroke-[3]" />}
                  </span>
                  <span className="truncate">{renderOption ? renderOption(opt) : opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const GROUP_OPTIONS = [
  { value: "kode_besar", label: "Article" },
  { value: "nama_gudang", label: "Store" },
  { value: "series", label: "Series" },
  { value: "branch", label: "Branch" },
  { value: "size", label: "Size" },
];

export default function SsrFilterBar({
  filters, onChange,
}: {
  filters: SsrFilters;
  onChange: (f: SsrFilters) => void;
}) {
  const filterQs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.branch.length) p.set("branch", filters.branch.join(","));
    if (filters.store_category.length) p.set("store_category", filters.store_category.join(","));
    if (filters.nama_gudang.length) p.set("nama_gudang", filters.nama_gudang.join(","));
    if (filters.gender.length) p.set("gender", filters.gender.join(","));
    if (filters.series.length) p.set("series", filters.series.join(","));
    if (filters.tipe.length) p.set("tipe", filters.tipe.join(","));
    if (filters.tier.length) p.set("tier", filters.tier.join(","));
    if (filters.color.length) p.set("color", filters.color.join(","));
    if (filters.v.length) p.set("v", filters.v.join(","));
    return p.toString();
  }, [filters]);

  const { data: opts } = useSWR<SsrOptions>(
    `/api/ssr/filters${filterQs ? `?${filterQs}` : ""}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000, keepPreviousData: true },
  );

  const toggle = (key: keyof SsrFilters, val: string) => {
    const cur = filters[key] as string[];
    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    onChange({ ...filters, [key]: next });
  };
  const clear = (key: keyof SsrFilters) => onChange({ ...filters, [key]: [] });
  const selectAll = (key: keyof SsrFilters, opts: string[]) => {
    const cur = filters[key] as string[];
    const all = opts.every((o) => cur.includes(o));
    onChange({ ...filters, [key]: all ? [] : [...new Set([...cur, ...opts])] });
  };

  const hasFilters = filters.branch.length > 0 || filters.store_category.length > 0 ||
    filters.nama_gudang.length > 0 || filters.gender.length > 0 || filters.series.length > 0 ||
    filters.tipe.length > 0 || filters.tier.length > 0 || filters.color.length > 0 || filters.v.length > 0;

  const resetAll = () => onChange({ ...getDefaultSsrFilters(), date_from: filters.date_from, date_to: filters.date_to, group_by: filters.group_by });

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Row 1: Date range + Group by */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
            className="px-2 py-1.5 text-[11px] rounded-md border border-border bg-card text-card-foreground outline-none focus:border-[#00E273]"
          />
          <span className="text-muted-foreground text-[11px]">—</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
            className="px-2 py-1.5 text-[11px] rounded-md border border-border bg-card text-card-foreground outline-none focus:border-[#00E273]"
          />
        </div>
        <select
          value={filters.group_by}
          onChange={(e) => onChange({ ...filters, group_by: e.target.value })}
          className="px-2 py-1.5 text-[11px] font-medium rounded-md border border-border bg-card text-card-foreground outline-none focus:border-[#00E273]"
        >
          {GROUP_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>Group: {g.label}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Dimension filters */}
      <div className="flex gap-1.5 items-center flex-wrap">
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="BRANCH" options={opts?.branches || []} selected={filters.branch}
            onToggle={(v) => toggle("branch", v)} onClear={() => clear("branch")} onSelectAll={(o) => selectAll("branch", o)} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="CATEGORY" options={opts?.store_categories || []} selected={filters.store_category}
            onToggle={(v) => toggle("store_category", v)} onClear={() => clear("store_category")} onSelectAll={(o) => selectAll("store_category", o)} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="STORE" options={opts?.stores || []} selected={filters.nama_gudang}
            onToggle={(v) => toggle("nama_gudang", v)} onClear={() => clear("nama_gudang")} onSelectAll={(o) => selectAll("nama_gudang", o)}
            renderOption={titleCase} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="GENDER" options={opts?.genders || []} selected={filters.gender}
            onToggle={(v) => toggle("gender", v)} onClear={() => clear("gender")} onSelectAll={(o) => selectAll("gender", o)} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="SERIES" options={opts?.series || []} selected={filters.series}
            onToggle={(v) => toggle("series", v)} onClear={() => clear("series")} onSelectAll={(o) => selectAll("series", o)} />
        </div>
        <div className="flex-1 min-w-[70px]">
          <MultiSelect label="TIPE" options={opts?.tipes || []} selected={filters.tipe}
            onToggle={(v) => toggle("tipe", v)} onClear={() => clear("tipe")} onSelectAll={(o) => selectAll("tipe", o)} />
        </div>
        <div className="flex-1 min-w-[70px]">
          <MultiSelect label="TIER" options={opts?.tiers || []} selected={filters.tier}
            onToggle={(v) => toggle("tier", v)} onClear={() => clear("tier")} onSelectAll={(o) => selectAll("tier", o)}
            renderOption={(t) => `T${t}`} />
        </div>
        <div className="flex-1 min-w-[70px]">
          <MultiSelect label="COLOR" options={opts?.colors || []} selected={filters.color}
            onToggle={(v) => toggle("color", v)} onClear={() => clear("color")} onSelectAll={(o) => selectAll("color", o)} />
        </div>
        <div className="flex-1 min-w-[70px]">
          <MultiSelect label="VERSION" options={opts?.versions || []} selected={filters.v}
            onToggle={(v) => toggle("v", v)} onClear={() => clear("v")} onSelectAll={(o) => selectAll("v", o)} />
        </div>
        {hasFilters && (
          <button type="button" onClick={resetAll}
            className="flex-shrink-0 px-2 py-1.5 text-[11px] font-medium rounded-md bg-secondary text-secondary-foreground border border-border hover:bg-muted transition-colors flex items-center gap-1">
            <X className="size-3" /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
