import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function buildWhere(sp: URLSearchParams): { clause: string; values: string[] } {
  const conds: string[] = [];
  const vals: string[] = [];
  let i = 1;

  const category = sp.get("category");
  const branch   = sp.get("branch");
  const gudang   = sp.get("gudang");
  const gender   = sp.get("gender");
  const series   = sp.get("series");
  const color    = sp.get("color");
  const tier     = sp.get("tier");
  const size     = sp.get("size");

  if (category) { conds.push(`category = $${i++}`);     vals.push(category); }
  if (branch)   { conds.push(`branch = $${i++}`);       vals.push(branch); }
  if (gudang)   { conds.push(`nama_gudang = $${i++}`);  vals.push(gudang); }
  if (gender)   {
    if (gender === "Baby & Kids") {
      conds.push(`gender_group = 'Baby & Kids'`);
    } else {
      conds.push(`gender_group = $${i++}`);
      vals.push(gender);
    }
  }
  if (series)   { conds.push(`series = $${i++}`);       vals.push(series); }
  if (color)    { conds.push(`group_warna = $${i++}`);  vals.push(color); }
  if (tier)     { conds.push(`tier = $${i++}`);         vals.push(tier); }
  if (size)     { conds.push(`ukuran = $${i++}`);       vals.push(size); }

  return {
    clause: conds.length ? "WHERE " + conds.join(" AND ") : "",
    values: vals,
  };
}

export async function GET(req: NextRequest) {
  const { clause, values } = buildWhere(req.nextUrl.searchParams);

  const sql = `
    WITH base AS (SELECT * FROM core.dashboard_cache ${clause}),
    kpis AS (
      SELECT SUM(pairs)                                              AS total_pairs,
             COUNT(DISTINCT kode_mix)                               AS unique_articles,
             SUM(CASE WHEN tier IN ('4','5') THEN pairs ELSE 0 END) AS dead_stock_pairs,
             SUM(est_rsp)                                           AS est_rsp_value,
             MAX(snapshot_date)                                     AS snapshot_date
      FROM base
    ),
    by_branch AS (
      SELECT branch, gender_group, SUM(pairs) AS pairs
      FROM base GROUP BY branch, gender_group
    ),
    by_tipe AS (
      SELECT tipe, SUM(pairs) AS pairs
      FROM base WHERE tipe IS NOT NULL GROUP BY tipe
    ),
    by_tier AS (
      SELECT tier, SUM(pairs) AS pairs, COUNT(DISTINCT kode_mix) AS articles
      FROM base GROUP BY tier
    )
    SELECT
      (SELECT row_to_json(k)   FROM kpis k)      AS kpis,
      (SELECT json_agg(b)      FROM by_branch b)  AS by_branch,
      (SELECT json_agg(tp)     FROM by_tipe tp)   AS by_tipe,
      (SELECT json_agg(t)      FROM by_tier t)    AS by_tier
  `;

  try {
    const { rows } = await pool.query(sql, values);
    const r = rows[0];
    const k = r.kpis as Record<string, unknown>;
    return NextResponse.json({
      kpis: {
        total_pairs:      Number(k?.total_pairs)      || 0,
        unique_articles:  Number(k?.unique_articles)  || 0,
        dead_stock_pairs: Number(k?.dead_stock_pairs) || 0,
        est_rsp_value:    Number(k?.est_rsp_value)    || 0,
        snapshot_date:    k?.snapshot_date,
      },
      by_branch: (r.by_branch || []).map((b: Record<string, unknown>) => ({
        branch: b.branch, gender_group: b.gender_group, pairs: Number(b.pairs),
      })),
      by_tipe: (r.by_tipe || []).map((tp: Record<string, unknown>) => ({
        tipe: tp.tipe, pairs: Number(tp.pairs),
      })),
      by_tier: (r.by_tier || []).map((t: Record<string, unknown>) => ({
        tier: t.tier, pairs: Number(t.pairs), articles: Number(t.articles),
      })),
    });
  } catch (e) {
    console.error("dashboard error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
