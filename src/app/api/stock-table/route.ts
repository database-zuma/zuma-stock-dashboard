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
  const series   = sp.get("series");
  if (branch)   { conds.push(`branch = $${i++}`);       vals.push(branch); }
  if (gender)   { conds.push(`gender_group = $${i++}`); vals.push(gender); }
  if (tier)     { conds.push(`tier = $${i++}`);         vals.push(tier); }
  if (category) { conds.push(`category = $${i++}`);     vals.push(category); }
  if (series)   { conds.push(`series = $${i++}`);       vals.push(series); }
  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { clause, values } = buildWhere(sp);
  const page   = Math.max(1, Number(sp.get("page"))  || 1);
  const limit  = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = (page - 1) * limit;
  const i      = values.length + 1;

  const dataSql = `
    SELECT kode_mix, article, series, gender_group, tipe, tier, branch, nama_gudang,
           SUM(pairs) AS pairs, SUM(est_rsp) AS est_rsp_value
    FROM core.dashboard_cache
    ${clause}
    GROUP BY kode_mix, article, series, gender_group, tipe, tier, branch, nama_gudang
    ORDER BY pairs DESC
    LIMIT $${i} OFFSET $${i + 1}
  `;

  const countSql = `SELECT COUNT(*) AS total FROM core.dashboard_cache ${clause}`;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, [...values, limit, offset]),
      pool.query(countSql, values),
    ]);
    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kode_mix:      r.kode_mix,
        article:       r.article,
        series:        r.series,
        gender_group:  r.gender_group,
        tipe:          r.tipe,
        tier:          r.tier,
        branch:        r.branch,
        nama_gudang:   r.nama_gudang,
        pairs:         Number(r.pairs),
        est_rsp_value: Number(r.est_rsp_value),
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    });
  } catch (e) {
    console.error("stock-table error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit });
  }
}
