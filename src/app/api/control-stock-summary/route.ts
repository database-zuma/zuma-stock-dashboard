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
    conds.push(`(kode_besar ILIKE $${i} OR kode_kecil ILIKE $${i})`);
    vals.push(`%${q}%`);
    i++;
  }

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

export async function GET(req: NextRequest) {
  const { clause, values } = buildWhere(req.nextUrl.searchParams);

  const sql = `
    WITH base AS (SELECT * FROM mart.sku_portfolio_size ${clause}),
    kpis AS (
      SELECT
        COUNT(DISTINCT kode_besar) AS total_skus,
        SUM(stok_global)          AS total_stok_global,
        SUM(wh_pusat)             AS total_wh_pusat,
        SUM(wh_bali)              AS total_wh_bali,
        SUM(wh_jkt)               AS total_wh_jkt,
        SUM(stok_toko)            AS total_stok_toko,
        SUM(stok_online)          AS total_stok_online
      FROM base
    ),
    by_gender AS (
      SELECT gender, SUM(stok_global) AS qty
      FROM base WHERE gender IS NOT NULL
      GROUP BY gender ORDER BY qty DESC
    ),
    by_series AS (
      SELECT series, SUM(stok_global) AS qty
      FROM base WHERE series IS NOT NULL
      GROUP BY series ORDER BY qty DESC
    ),
    by_tier AS (
      SELECT tier, SUM(stok_global) AS qty, COUNT(DISTINCT kode_besar) AS articles
      FROM base GROUP BY tier
    ),
    by_channel AS (
      SELECT 'WH Pusat' AS channel, SUM(wh_pusat) AS qty FROM base
      UNION ALL SELECT 'WH Bali', SUM(wh_bali) FROM base
      UNION ALL SELECT 'WH JKT', SUM(wh_jkt) FROM base
      UNION ALL SELECT 'Toko', SUM(stok_toko) FROM base
      UNION ALL SELECT 'Online', SUM(stok_online) FROM base
    )
    SELECT
      (SELECT row_to_json(k)   FROM kpis k)        AS kpis,
      (SELECT json_agg(g ORDER BY g.qty DESC)
       FROM by_gender g)                            AS by_gender,
      (SELECT json_agg(s ORDER BY s.qty DESC)
       FROM by_series s)                            AS by_series,
      (SELECT json_agg(t)      FROM by_tier t)      AS by_tier,
      (SELECT json_agg(c)      FROM by_channel c)   AS by_channel
  `;

  try {
    const { rows } = await pool.query(sql, values as string[]);
    const r = rows[0];
    const k = r.kpis as Record<string, unknown>;
    const body = {
      kpis: {
        total_skus:        Number(k?.total_skus)        || 0,
        total_stok_global: Number(k?.total_stok_global) || 0,
        total_wh_pusat:    Number(k?.total_wh_pusat)    || 0,
        total_wh_bali:     Number(k?.total_wh_bali)     || 0,
        total_wh_jkt:      Number(k?.total_wh_jkt)      || 0,
        total_stok_toko:   Number(k?.total_stok_toko)   || 0,
        total_stok_online: Number(k?.total_stok_online) || 0,
      },
      by_gender: (r.by_gender || []).map((g: Record<string, unknown>) => ({
        gender: g.gender, qty: Number(g.qty),
      })),
      by_series: (r.by_series || []).map((s: Record<string, unknown>) => ({
        series: s.series, qty: Number(s.qty),
      })),
      by_tier: (r.by_tier || []).map((t: Record<string, unknown>) => ({
        tier: t.tier, qty: Number(t.qty), articles: Number(t.articles),
      })),
      by_channel: (r.by_channel || []).map((c: Record<string, unknown>) => ({
        channel: c.channel, qty: Number(c.qty),
      })),
    };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (e) {
    console.error("control-stock-summary error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
