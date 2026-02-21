"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Options {
  branches: string[];
  genders: string[];
  tiers: string[];
  categories: string[];
}

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
      if (val) {
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
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="Branch"
        value={current("branch")}
        options={opts?.branches || []}
        onChange={(v) => setFilter("branch", v)}
      />
      <Select
        label="Gender"
        value={current("gender")}
        options={opts?.genders || []}
        onChange={(v) => setFilter("gender", v)}
      />
      <Select
        label="Tier"
        value={current("tier")}
        options={opts?.tiers || []}
        onChange={(v) => setFilter("tier", v)}
        renderOption={(t) => `T${t}`}
      />
      <Select
        label="Category"
        value={current("category")}
        options={opts?.categories || []}
        onChange={(v) => setFilter("category", v)}
      />
      {hasFilters && (
        <button
          onClick={resetAll}
          className="px-4 py-2 text-sm font-medium rounded-lg
            bg-zuma-accent/10 text-zuma-accent border border-zuma-accent/30
            hover:bg-zuma-accent/20 transition-colors cursor-pointer"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function Select({
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-zuma-card border border-zuma-border rounded-lg
          px-4 py-2 pr-8 text-sm text-zuma-text
          hover:border-zuma-accent/40 focus:border-zuma-accent focus:outline-none
          transition-colors cursor-pointer"
      >
        <option value="">All {label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#8CA3AD" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
