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
  { key: "genders", col: "gender", param: "gender", nullFilter: "gender IS NOT NULL AND gender != ''", orderBy: "gender" },
  { key: "series",  col: "series", param: "series", nullFilter: "series IS NOT NULL AND series != ''", orderBy: "series" },
  { key: "colors",  col: "color",  param: "color",  nullFilter: "color IS NOT NULL AND color != ''",   orderBy: "color" },
  { key: "tipes",   col: "tipe",   param: "tipe",   nullFilter: "tipe IS NOT NULL AND tipe != ''",     orderBy: "tipe" },
  { key: "tiers",   col: "tier",   param: "tier",    nullFilter: "tier IS NOT NULL AND tier != ''",     orderBy: "tier" },
  { key: "sizes",   col: "size",   param: "size",    nullFilter: "size IS NOT NULL AND size != ''",     orderBy: "CASE WHEN size ~ '^[0-9]+$' THEN size::int WHEN size ~ '^[0-9]+/[0-9]+$' THEN split_part(size,'/',1)::int ELSE 999 END, size" },
] as const;

/**
 * Cross-filtered options for Control Stock page.
 * e.g. Series=BLACKSERIES → Gender only shows MEN.
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
          conds.push(`(kode_besar ILIKE $${i} OR kode_kecil ILIKE $${i})`);
          vals.push(`%${q}%`);
          i++;
        }

        const sql = `SELECT DISTINCT ${dim.col} AS val FROM mart.sku_portfolio_size WHERE ${conds.join(" AND ")} ORDER BY ${dim.orderBy}`;
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
    console.error("control-stock-filters error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
