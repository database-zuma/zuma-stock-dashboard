import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function buildWhere(sp: URLSearchParams): { clause: string; values: string[] } {
  const conds: string[] = [];
  const vals: string[] = [];
  let i = 1;
  const branch   = sp.get("branch");
  const gender   = sp.get("gender");
  const tier     = sp.get("tier");
  const category = sp.get("category");
  if (branch)   { conds.push(`branch = $${i++}`);       vals.push(branch); }
  if (gender)   { conds.push(`gender_group = $${i++}`); vals.push(gender); }
  if (tier)     { conds.push(`tier = $${i++}`);         vals.push(tier); }
  if (category) { conds.push(`category = $${i++}`);     vals.push(category); }
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
      SELECT SUM(pairs) AS total_pairs,
             COUNT(DISTINCT kode_mix) AS unique_articles,
             SUM(CASE WHEN tier IN ('4','5') THEN pairs ELSE 0 END) AS dead_stock_pairs,
             SUM(est_rsp) AS est_rsp_value,
             MAX(snapshot_date) AS snapshot_date
      FROM base
    ),
    by_branch AS (
      SELECT branch, tier, SUM(pairs) AS pairs FROM base GROUP BY branch, tier
    ),
    by_gender AS (
      SELECT gender_group, SUM(pairs) AS pairs FROM base GROUP BY gender_group
    ),
    by_tier AS (
      SELECT tier, SUM(pairs) AS pairs, COUNT(DISTINCT kode_mix) AS articles
      FROM base GROUP BY tier
    ),
    by_series AS (
      SELECT series, SUM(pairs) AS pairs, COUNT(DISTINCT kode_mix) AS articles
      FROM base WHERE series IS NOT NULL
      GROUP BY series ORDER BY pairs DESC LIMIT 15
    )
    SELECT
      (SELECT row_to_json(k) FROM kpis k)        AS kpis,
      (SELECT json_agg(b) FROM by_branch b)      AS by_branch,
      (SELECT json_agg(g) FROM by_gender g)      AS by_gender,
      (SELECT json_agg(t) FROM by_tier t)        AS by_tier,
      (SELECT json_agg(s) FROM by_series s)      AS by_series
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
        branch: b.branch, tier: b.tier, pairs: Number(b.pairs),
      })),
      by_gender: (r.by_gender || []).map((g: Record<string, unknown>) => ({
        gender_group: g.gender_group, pairs: Number(g.pairs),
      })),
      by_tier: (r.by_tier || []).map((t: Record<string, unknown>) => ({
        tier: t.tier, pairs: Number(t.pairs), articles: Number(t.articles),
      })),
      by_series: (r.by_series || []).map((s: Record<string, unknown>) => ({
        series: s.series, pairs: Number(s.pairs), articles: Number(s.articles),
      })),
    });
  } catch (e) {
    console.error("dashboard error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
