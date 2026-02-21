import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function buildWhere(sp: URLSearchParams): { clause: string; values: string[] } {
  const conds: string[] = ["tier IN ('4','5')"];
  const vals: string[] = [];
  let i = 1;

  const category = sp.get("category");
  const branch   = sp.get("branch");
  const gudang   = sp.get("gudang");
  const gender   = sp.get("gender");
  const series   = sp.get("series");
  const color    = sp.get("color");
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
  if (size)     { conds.push(`ukuran = $${i++}`);       vals.push(size); }

  return { clause: "WHERE " + conds.join(" AND "), values: vals };
}

export async function GET(req: NextRequest) {
  const { clause, values } = buildWhere(req.nextUrl.searchParams);

  const sql = `
    SELECT kode_besar, kode, article, series, gender_group, branch, nama_gudang, tier, group_warna, ukuran,
           SUM(pairs)   AS pairs,
           SUM(est_rsp) AS est_rsp_value
    FROM core.dashboard_cache
    ${clause}
    GROUP BY kode_besar, kode, article, series, gender_group, branch, nama_gudang, tier, group_warna, ukuran
    ORDER BY pairs DESC
    LIMIT 100
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(rows.map((r) => ({
      kode_besar:    r.kode_besar,
      kode:          r.kode,
      article:       r.article,
      series:        r.series,
      gender_group:  r.gender_group,
      branch:        r.branch,
      nama_gudang:   r.nama_gudang,
      tier:          r.tier,
      group_warna:   r.group_warna,
      ukuran:        r.ukuran,
      pairs:         Number(r.pairs),
      est_rsp_value: Number(r.est_rsp_value),
    })));
  } catch (e) {
    console.error("dead-stock error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
