import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

/* ── Dimension definitions for cross-filtering ── */
const DIMS = [
  { key: "categories", col: "category",     param: "category", nullFilter: "category IS NOT NULL AND category != ''",                                  orderBy: "category" },
  { key: "branches",   col: "branch",       param: "branch",   nullFilter: "branch IS NOT NULL",                                                      orderBy: "branch" },
  { key: "gudangs",    col: "nama_gudang",  param: "gudang",   nullFilter: "nama_gudang IS NOT NULL AND nama_gudang != ''",                           orderBy: "nama_gudang" },
  { key: "genders",    col: "gender_group", param: "gender",   nullFilter: "gender_group IS NOT NULL",                                                orderBy: "gender_group" },
  { key: "series",     col: "series",       param: "series",   nullFilter: "series IS NOT NULL AND series != ''",                                      orderBy: "series" },
  { key: "colors",     col: "group_warna",  param: "color",    nullFilter: "group_warna IS NOT NULL AND group_warna != '' AND group_warna != 'OTHER'", orderBy: "group_warna" },
  { key: "tiers",      col: "tier",         param: "tier",     nullFilter: "tier IS NOT NULL",                                                        orderBy: "tier" },
  { key: "sizes",      col: "ukuran",       param: "size",     nullFilter: "ukuran IS NOT NULL AND ukuran != ''",                                      orderBy: "CASE WHEN ukuran ~ '^[0-9]+$' THEN ukuran::int WHEN ukuran ~ '^[0-9]+/[0-9]+$' THEN split_part(ukuran,'/',1)::int ELSE 999 END, ukuran" },
] as const;

/**
 * Cross-filtered options: for each dimension, apply ALL OTHER active filters
 * so dropdown options stay contextually relevant.
 * e.g. Branch=Jatim → Gudang only shows Jatim stores.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");

  try {
    const results = await Promise.all(
      DIMS.map(async (dim) => {
        const conds: string[] = [dim.nullFilter];
        const vals: unknown[] = [];
        let i = 1;

        for (const other of DIMS) {
          if (other.param === dim.param) continue;
          const fv = parseMulti(sp, other.param);
          if (fv.length === 0) continue;
          if (fv.length === 1) {
            conds.push(`${other.col} = $${i++}`);
            vals.push(fv[0]);
          } else {
            const phs = fv.map(() => `$${i++}`).join(", ");
            conds.push(`${other.col} IN (${phs})`);
            vals.push(...fv);
          }
        }

        if (q) {
          conds.push(`(kode_besar ILIKE $${i} OR kode ILIKE $${i})`);
          vals.push(`%${q}%`);
          i++;
        }

        const sql = `SELECT DISTINCT ${dim.col} AS val FROM core.dashboard_cache WHERE ${conds.join(" AND ")} ORDER BY ${dim.orderBy}`;
        const res = await pool.query(sql, vals);
        return { key: dim.key, values: res.rows.map((r: Record<string, unknown>) => r.val).filter(Boolean) };
      })
    );

    const body: Record<string, unknown[]> = {};
    for (const r of results) body[r.key] = r.values;

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("filter-options error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
