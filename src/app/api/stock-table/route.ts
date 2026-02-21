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
  const q        = sp.get("q");

  if (category) { conds.push(`category = $${i++}`);      vals.push(category); }
  if (branch)   { conds.push(`branch = $${i++}`);        vals.push(branch); }
  if (gudang)   { conds.push(`nama_gudang = $${i++}`);   vals.push(gudang); }
  if (gender)   {
    if (gender === "Baby & Kids") {
      conds.push(`gender_group = 'Baby & Kids'`);
    } else {
      conds.push(`gender_group = $${i++}`);
      vals.push(gender);
    }
  }
  if (series)   { conds.push(`series = $${i++}`);        vals.push(series); }
  if (color)    { conds.push(`group_warna = $${i++}`);   vals.push(color); }
  if (tier)     { conds.push(`tier = $${i++}`);          vals.push(tier); }
  if (size)     { conds.push(`ukuran = $${i++}`);        vals.push(size); }
  if (q) {
    const like = `%${q}%`;
    conds.push(`(kode_besar ILIKE $${i} OR kode ILIKE $${i} OR article ILIKE $${i})`);
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
      kode_besar, kode, article, series, gender_group, tipe, tier,
      branch, nama_gudang, group_warna, ukuran,
      SUM(pairs)    AS pairs,
      SUM(est_rsp)  AS est_rsp_value
    FROM core.dashboard_cache
    ${clause}
    GROUP BY kode_besar, kode, article, series, gender_group, tipe, tier,
             branch, nama_gudang, group_warna, ukuran
    ORDER BY pairs DESC
    LIMIT $${n} OFFSET $${n + 1}
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 1 FROM core.dashboard_cache
      ${clause}
      GROUP BY kode_besar, kode, article, series, gender_group, tipe, tier,
               branch, nama_gudang, group_warna, ukuran
    ) sub
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, [...values, limit, offset]),
      pool.query(countSql, values),
    ]);
    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kode_besar:    r.kode_besar,
        kode:          r.kode,
        article:       r.article,
        series:        r.series,
        gender_group:  r.gender_group,
        tipe:          r.tipe,
        tier:          r.tier,
        branch:        r.branch,
        nama_gudang:   r.nama_gudang,
        group_warna:   r.group_warna,
        ukuran:        r.ukuran,
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
