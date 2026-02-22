"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  onSelectAll,
  renderOption,
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
  const [dropdownSearch, setDropdownSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(
    () =>
      dropdownSearch
        ? options.filter((o) =>
            o.toLowerCase().includes(dropdownSearch.toLowerCase())
          )
        : options,
    [options, dropdownSearch]
  );

  const allSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((o) => selected.includes(o));

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);


  useEffect(() => {
    if (!open) {
      setDropdownSearch("");
    } else {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const labelText =
    selected.length === 0
      ? label
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

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] w-max max-w-[240px] rounded-md border border-border bg-card shadow-lg">
          {/* in-dropdown search */}
          <div className="p-1.5 border-b border-border">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={dropdownSearch}
              onChange={(e) => setDropdownSearch(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-[#00E273]"
            />
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectAll(filteredOptions)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors border-b border-border"
              >
                <span
                  className={`size-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors
                    ${allSelected ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}
                >
                  {allSelected && <Check className="size-2.5 text-black stroke-[3]" />}
                </span>
                <span className="text-muted-foreground">Select All</span>
              </button>
            )}
            {selected.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-b border-border"
              >
                <X className="size-3" /> Clear {label}
              </button>
            )}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No results</p>
            )}
            {filteredOptions.map((opt) => {
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


  const filterQs = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.gender.length) params.set("gender", filters.gender.join(","));
    if (filters.series.length) params.set("series", filters.series.join(","));
    if (filters.color.length)  params.set("color",  filters.color.join(","));
    if (filters.tipe.length)   params.set("tipe",   filters.tipe.join(","));
    if (filters.tier.length)   params.set("tier",   filters.tier.join(","));
    if (filters.size.length)   params.set("size",   filters.size.join(","));
    return params.toString();
  }, [filters.gender, filters.series, filters.color, filters.tipe, filters.tier, filters.size]);

  const { data: opts } = useSWR<CSOptions>(
    `/api/control-stock-filters${filterQs ? `?${filterQs}` : ""}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000, keepPreviousData: true }
  );

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const toggle = (key: keyof Omit<CSFilters, "q">, val: string) => {
    const current = filters[key];
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val];
    onChange({ ...filters, [key]: next });
  };
  const clear = (key: keyof Omit<CSFilters, "q">) => onChange({ ...filters, [key]: [] });

  const selectAll = (key: keyof Omit<CSFilters, "q">, opts: string[]) => {
    const current = filters[key];
    const allSelected = opts.every((o) => current.includes(o));
    if (allSelected) {
      onChange({ ...filters, [key]: [] });
    } else {
      onChange({ ...filters, [key]: [...new Set([...current, ...opts])] });
    }
  };

  /* FIX: read value from DOM (e.currentTarget.value) to avoid stale closure */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = e.currentTarget.value.trim();
      setSearchInput(val);
      onChange({ ...filters, q: val });
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
          <MultiSelect label="GENDER" options={opts?.genders || []} selected={filters.gender}
            onToggle={(v) => toggle("gender", v)} onClear={() => clear("gender")} onSelectAll={(o) => selectAll("gender", o)} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="SERIES" options={opts?.series || []} selected={filters.series}
            onToggle={(v) => toggle("series", v)} onClear={() => clear("series")} onSelectAll={(o) => selectAll("series", o)} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="COLOR" options={opts?.colors || []} selected={filters.color}
            onToggle={(v) => toggle("color", v)} onClear={() => clear("color")} onSelectAll={(o) => selectAll("color", o)} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="TIPE" options={opts?.tipes || []} selected={filters.tipe}
            onToggle={(v) => toggle("tipe", v)} onClear={() => clear("tipe")} onSelectAll={(o) => selectAll("tipe", o)} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="TIER" options={opts?.tiers || []} selected={filters.tier}
            onToggle={(v) => toggle("tier", v)} onClear={() => clear("tier")} onSelectAll={(o) => selectAll("tier", o)}
            renderOption={(t) => `T${t}`} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="SIZE" options={opts?.sizes || []} selected={filters.size}
            onToggle={(v) => toggle("size", v)} onClear={() => clear("size")} onSelectAll={(o) => selectAll("size", o)} />
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
