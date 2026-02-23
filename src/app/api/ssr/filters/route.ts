import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

const DIMS = [
  { key: "branches",        col: "branch",         param: "branch",         nullFilter: "branch IS NOT NULL AND branch != ''" },
  { key: "store_categories", col: "store_category", param: "store_category", nullFilter: "store_category IS NOT NULL AND store_category != ''" },
  { key: "stores",          col: "nama_gudang",     param: "nama_gudang",    nullFilter: "nama_gudang IS NOT NULL AND nama_gudang != ''" },
  { key: "genders",         col: "gender",          param: "gender",         nullFilter: "gender IS NOT NULL AND gender != ''" },
  { key: "series",          col: "series",          param: "series",         nullFilter: "series IS NOT NULL AND series != ''" },
  { key: "tipes",           col: "tipe",            param: "tipe",           nullFilter: "tipe IS NOT NULL AND tipe != ''" },
  { key: "tiers",           col: "tier",            param: "tier",           nullFilter: "tier IS NOT NULL AND tier != ''" },
  { key: "colors",          col: "color",           param: "color",          nullFilter: "color IS NOT NULL AND color != ''" },
] as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

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

        const sql = `SELECT DISTINCT ${dim.col} AS val FROM mart.sales_stock_ratio WHERE ${conds.join(" AND ")} ORDER BY val`;
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
    console.error("ssr-filters error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
