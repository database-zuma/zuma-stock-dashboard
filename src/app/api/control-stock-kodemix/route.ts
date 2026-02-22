import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

const SORT_WHITELIST: Record<string, string> = {
  kodemix: "kodemix",
  gender: "gender",
  series: "series",
  color: "color",
  tipe: "tipe",
  tier: "tier",
  stok_global: "stok_global",
  wh_pusat: "wh_pusat",
  wh_bali: "wh_bali",
  wh_jkt: "wh_jkt",
  stok_toko: "stok_toko",
  stok_online: "stok_online",
  avg_last_3_months: "avg_last_3_months",
  to_wh: "to_wh",
  to_total: "to_total",
  current_year_qty: "current_year_qty",
  last_year_qty: "last_year_qty",
};

function buildWhere(sp: URLSearchParams): { clause: string; values: unknown[] } {
  const conds: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  // Exclude non-product items (shopbag, paperbag, GWP, hanger)
  conds.push("kode_besar !~ '^(gwp|hanger|paperbag|shopbag)'");

  const addFilter = (col: string, values: string[]) => {
    if (values.length === 0) return;
    if (values.length === 1) {
      conds.push(`${col} = $${i++}`);
      vals.push(values[0]);
    } else {
      const phs = values.map(() => `$${i++}`).join(", ");
      conds.push(`${col} IN (${phs})`);
      vals.push(...values);
    }
  };

  addFilter("gender", parseMulti(sp, "gender"));
  addFilter("series", parseMulti(sp, "series"));
  addFilter("color",  parseMulti(sp, "color"));
  addFilter("tipe",   parseMulti(sp, "tipe"));
  addFilter("tier",   parseMulti(sp, "tier"));
  addFilter("size",   parseMulti(sp, "size"));

  const q = sp.get("q");
  if (q) {
    conds.push(`(kode_besar ILIKE $${i} OR kodemix ILIKE $${i})`);
    vals.push(`%${q}%`);
    i++;
  }

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

function getSort(sp: URLSearchParams): string {
  const sort = sp.get("sort") || "avg_last_3_months";
  const dir = sp.get("dir") === "asc" ? "ASC" : "DESC";
  const col = SORT_WHITELIST[sort];
  if (!col) return "avg_last_3_months DESC NULLS LAST";
  return `${col} ${dir} NULLS LAST`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { clause, values } = buildWhere(sp);
  const orderBy = getSort(sp);
  const isExport = sp.get("export") === "all";
  const page   = Math.max(1, Number(sp.get("page"))  || 1);
  const limit  = isExport ? 50000 : Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = isExport ? 0 : (page - 1) * limit;
  const n      = values.length + 1;

  const dataSql = `
    SELECT
      kodemix,
      gender,
      series,
      color,
      tipe,
      tier,
      SUM(stok_global)::int        AS stok_global,
      SUM(wh_pusat)::int           AS wh_pusat,
      SUM(wh_bali)::int            AS wh_bali,
      SUM(wh_jkt)::int             AS wh_jkt,
      SUM(stok_toko)::int          AS stok_toko,
      SUM(stok_online)::int        AS stok_online,
      SUM(avg_last_3_months)       AS avg_last_3_months,
      AVG(to_wh)                   AS to_wh,
      AVG(to_total)                AS to_total,
      SUM(current_year_qty)::int   AS current_year_qty,
      SUM(last_year_qty)::int      AS last_year_qty
    FROM mart.sku_portfolio_size
    ${clause}
    GROUP BY kodemix, gender, series, color, tipe, tier
    ORDER BY ${orderBy}
    ${isExport ? '' : `LIMIT $${n} OFFSET $${n + 1}`}
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 1 FROM mart.sku_portfolio_size ${clause}
      GROUP BY kodemix, gender, series, color, tipe, tier
    ) sub
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, isExport ? (values as string[]) : [...(values as string[]), limit, offset]),
      pool.query(countSql, values as string[]),
    ]);
    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kodemix:           r.kodemix,
        gender:            r.gender,
        series:            r.series,
        color:             r.color,
        tipe:              r.tipe,
        tier:              r.tier,
        stok_global:       Number(r.stok_global)       || 0,
        wh_pusat:          Number(r.wh_pusat)          || 0,
        wh_bali:           Number(r.wh_bali)           || 0,
        wh_jkt:            Number(r.wh_jkt)            || 0,
        stok_toko:         Number(r.stok_toko)         || 0,
        stok_online:       Number(r.stok_online)       || 0,
        avg_last_3_months: Number(r.avg_last_3_months) || 0,
        to_wh:             r.to_wh    != null ? Number(r.to_wh)    : null,
        to_total:          r.to_total != null ? Number(r.to_total) : null,
        current_year_qty:  Number(r.current_year_qty)  || 0,
        last_year_qty:     Number(r.last_year_qty)     || 0,
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (e) {
    console.error("control-stock-kodemix error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit });
  }
}
