import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

function buildWhere(sp: URLSearchParams): { clause: string; values: unknown[] } {
  const conds: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

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
    const like = `%${q}%`;
    conds.push(`(kode_besar ILIKE $${i} OR kode_kecil ILIKE $${i} OR kodemix ILIKE $${i})`);
    vals.push(like);
    i++;
  }

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { clause, values } = buildWhere(sp);
  const page   = Math.max(1, Number(sp.get("page"))  || 1);
  const limit  = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = (page - 1) * limit;
  const n      = values.length + 1;

  const dataSql = `
    SELECT
      kode_besar, kode_kecil, kodemix, gender, series, color, tipe, tier, size,
      stok_global, wh_pusat, wh_bali, wh_jkt, stok_toko, stok_online,
      avg_last_3_months, to_wh, to_total,
      current_year_qty, last_year_qty,
      updated_at
    FROM mart.sku_portfolio_size
    ${clause}
    ORDER BY stok_global DESC NULLS LAST
    LIMIT $${n} OFFSET $${n + 1}
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM mart.sku_portfolio_size ${clause}
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, [...(values as string[]), limit, offset]),
      pool.query(countSql, values as string[]),
    ]);
    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kode_besar:        r.kode_besar,
        kode_kecil:        r.kode_kecil,
        kodemix:           r.kodemix,
        gender:            r.gender,
        series:            r.series,
        color:             r.color,
        tipe:              r.tipe,
        tier:              r.tier,
        size:              r.size,
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
        updated_at:        r.updated_at,
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (e) {
    console.error("control-stock error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit });
  }
}
