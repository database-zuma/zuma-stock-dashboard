"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import useSWR from "swr";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";

interface Options {
  categories: string[];
  branches: string[];
  gudangs: string[];
  genders: string[];
  series: string[];
  colors: string[];
  tiers: string[];
  sizes: string[];
}

const FILTER_KEYS = ["category","branch","gudang","gender","series","color","tier","size","q"] as const;

function MultiSelect({
  label,
  paramKey,
  options,
  renderOption,
}: {
  label: string;
  paramKey: string;
  options: string[];
  renderOption?: (v: string) => string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    const val = searchParams.get(paramKey);
    return val ? val.split(",").map((v) => v.trim()).filter(Boolean) : [];
  }, [searchParams, paramKey]);

  const toggleOption = useCallback(
    (opt: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      if (next.length === 0) params.delete(paramKey);
      else params.set(paramKey, next.join(","));
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams, selected, paramKey]
  );

  const clearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramKey);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }, [router, searchParams, paramKey]);

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
        className={`w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border bg-card text-card-foreground hover:bg-muted transition-colors whitespace-nowrap
          ${selected.length > 0 ? "border-[#00E273]" : "border-border"}`}
      >
        <span className="truncate">{labelText}</span>
        <ChevronDown
          className={`size-3.5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] w-max max-w-[240px] max-h-64 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clearFilter}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-b border-border"
            >
              <X className="size-3" />
              Clear {label}
            </button>
          )}
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleOption(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              >
                <span
                  className={`size-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors
                    ${checked ? "bg-[#00E273] border-[#00E273]" : "border-border bg-background"}`}
                >
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

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");

  const { data: opts } = useSWR<Options>("/api/filter-options", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const applySearch = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val.trim()) params.set("q", val.trim());
      else params.delete("q");
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") applySearch(search);
    },
    [search, applySearch]
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    applySearch("");
  }, [applySearch]);

  const resetAll = useCallback(() => {
    setSearch("");
    router.push("/");
  }, [router]);

  const hasFilters = FILTER_KEYS.some((k) => searchParams.has(k));

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-1.5 items-center w-full">
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Category" paramKey="category" options={opts?.categories || []} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Branch" paramKey="branch" options={opts?.branches || []} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Gudang" paramKey="gudang" options={opts?.gudangs || []} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Gender" paramKey="gender" options={opts?.genders || []} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Series" paramKey="series" options={opts?.series || []} />
        </div>
        <div className="flex-1 min-w-[90px]">
          <MultiSelect label="Color" paramKey="color" options={opts?.colors || []} />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect
            label="Tier" paramKey="tier"
            options={opts?.tiers || []}
            renderOption={(t) => `T${t}`}
          />
        </div>
        <div className="flex-1 min-w-[80px]">
          <MultiSelect label="Size" paramKey="size" options={opts?.sizes || []} />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md
              bg-secondary text-secondary-foreground border border-border
              hover:bg-muted transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="size-3" />
            Reset
          </button>
        )}
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search kode besar... (Enter to search)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 h-8 text-xs bg-card w-full"
        />
        {search && (
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
