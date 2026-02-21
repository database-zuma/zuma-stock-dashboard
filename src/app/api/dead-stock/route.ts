import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function buildWhere(sp: URLSearchParams): { clause: string; values: string[] } {
  const conds: string[] = ["tier IN ('4','5')"];
  const vals: string[] = [];
  let i = 1;
  const branch   = sp.get("branch");
  const gender   = sp.get("gender");
  const category = sp.get("category");
  if (branch)   { conds.push(`branch = $${i++}`);       vals.push(branch); }
  if (gender)   { conds.push(`gender_group = $${i++}`); vals.push(gender); }
  if (category) { conds.push(`category = $${i++}`);     vals.push(category); }
  return { clause: "WHERE " + conds.join(" AND "), values: vals };
}

export async function GET(req: NextRequest) {
  const { clause, values } = buildWhere(req.nextUrl.searchParams);

  const sql = `
    SELECT kode_mix, series, gender_group, branch, tier,
           SUM(pairs) AS pairs, SUM(est_rsp) AS est_rsp_value
    FROM core.dashboard_cache
    ${clause}
    GROUP BY kode_mix, series, gender_group, branch, tier
    ORDER BY pairs DESC
    LIMIT 100
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(rows.map((r) => ({
      kode_mix:      r.kode_mix,
      article:       r.kode_mix,
      series:        r.series,
      gender_group:  r.gender_group,
      branch:        r.branch,
      tier:          r.tier,
      pairs:         Number(r.pairs),
      est_rsp_value: Number(r.est_rsp_value),
    })));
  } catch (e) {
    console.error("dead-stock error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
