"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Options {
  categories: string[];
  branches:   string[];
  gudangs:    string[];
  genders:    string[];
  series:     string[];
  colors:     string[];
  tiers:      string[];
  sizes:      string[];
}

const ALL = "__all__";
const FILTER_KEYS = ["category", "branch", "gudang", "gender", "series", "color", "tier", "size", "q"] as const;

export default function FilterBar() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [opts, setOpts]       = useState<Options | null>(null);
  const [search, setSearch]   = useState(searchParams.get("q") || "");
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/filter-options").then((r) => r.json()).then(setOpts).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  const current = useCallback(
    (key: string) => searchParams.get(key) || "",
    [searchParams]
  );

  const setFilter = useCallback(
    (key: string, val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val && val !== ALL) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (val: string) => {
      setSearch(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (val.trim()) {
          params.set("q", val.trim());
        } else {
          params.delete("q");
        }
        params.delete("page");
        router.push(`/?${params.toString()}`);
      }, 400);
    },
    [router, searchParams]
  );

  const resetAll = useCallback(() => {
    setSearch("");
    router.push("/");
  }, [router]);

  const hasFilters = FILTER_KEYS.some((k) => searchParams.has(k));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Category"
          value={current("category")}
          options={opts?.categories || []}
          onChange={(v) => setFilter("category", v)}
        />
        <FilterSelect
          label="Branch"
          value={current("branch")}
          options={opts?.branches || []}
          onChange={(v) => setFilter("branch", v)}
        />
        <FilterSelect
          label="Gudang"
          value={current("gudang")}
          options={opts?.gudangs || []}
          onChange={(v) => setFilter("gudang", v)}
        />
        <FilterSelect
          label="Gender"
          value={current("gender")}
          options={opts?.genders || []}
          onChange={(v) => setFilter("gender", v)}
        />
        <FilterSelect
          label="Series"
          value={current("series")}
          options={opts?.series || []}
          onChange={(v) => setFilter("series", v)}
        />
        <FilterSelect
          label="Color"
          value={current("color")}
          options={opts?.colors || []}
          onChange={(v) => setFilter("color", v)}
        />
        <FilterSelect
          label="Tier"
          value={current("tier")}
          options={opts?.tiers || []}
          onChange={(v) => setFilter("tier", v)}
          renderOption={(t) => `T${t}`}
        />
        <FilterSelect
          label="Size"
          value={current("size")}
          options={opts?.sizes || []}
          onChange={(v) => setFilter("size", v)}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="px-3 py-1.5 text-xs font-medium rounded-md
              bg-secondary text-secondary-foreground border border-border
              hover:bg-muted transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="size-3" />
            Reset
          </button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search kode besar, kode kecil, or product name..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-8 text-xs bg-card"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (v: string) => string;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(v) => onChange(v === ALL ? "" : v)}
    >
      <SelectTrigger size="sm" className="min-w-[110px] bg-card text-card-foreground">
        <SelectValue placeholder={`All ${label}`} />
      </SelectTrigger>
      <SelectContent className="max-h-64 overflow-y-auto">
        <SelectItem value={ALL}>All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {renderOption ? renderOption(o) : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
