"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Options {
  branches: string[];
  genders: string[];
  tiers: string[];
  categories: string[];
}

const ALL = "__all__";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opts, setOpts] = useState<Options | null>(null);

  useEffect(() => {
    fetch("/api/filter-options")
      .then((r) => r.json())
      .then(setOpts)
      .catch(() => {});
  }, []);

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

  const resetAll = useCallback(() => {
    router.push("/");
  }, [router]);

  const hasFilters =
    searchParams.has("branch") ||
    searchParams.has("gender") ||
    searchParams.has("tier") ||
    searchParams.has("category");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="Branch"
        value={current("branch")}
        options={opts?.branches || []}
        onChange={(v) => setFilter("branch", v)}
      />
      <FilterSelect
        label="Gender"
        value={current("gender")}
        options={opts?.genders || []}
        onChange={(v) => setFilter("gender", v)}
      />
      <FilterSelect
        label="Tier"
        value={current("tier")}
        options={opts?.tiers || []}
        onChange={(v) => setFilter("tier", v)}
        renderOption={(t) => `T${t}`}
      />
      <FilterSelect
        label="Category"
        value={current("category")}
        options={opts?.categories || []}
        onChange={(v) => setFilter("category", v)}
      />
      {hasFilters && (
        <button
          onClick={resetAll}
          className="px-3 py-1.5 text-xs font-medium rounded-md
            bg-secondary text-secondary-foreground border border-border
            hover:bg-accent hover:text-accent-foreground
            transition-colors cursor-pointer"
        >
          Reset
        </button>
      )}
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
      <SelectContent>
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
