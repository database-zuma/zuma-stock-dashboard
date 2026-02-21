import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const tierCondition = `COALESCE(tier, '3') IN ('4','5')`;

  const sql = `
    SELECT
      kode_mix,
      COALESCE(article, nama_gudang) AS article,
      series,
      CASE WHEN UPPER(gender) IN ('BABY','BOYS','GIRLS','JUNIOR','KIDS') THEN 'Baby & Kids'
           WHEN UPPER(gender) = 'MEN' THEN 'Men'
           WHEN UPPER(gender) = 'LADIES' THEN 'Ladies'
           ELSE COALESCE(gender, 'Unknown') END AS gender_group,
      COALESCE(gudang_branch, 'Warehouse') AS branch,
      COALESCE(tier, '3') AS tier,
      SUM(quantity) AS pairs,
      SUM(quantity * COALESCE(rsp, 0)) AS est_rsp_value
    FROM core.stock_with_product
    ${clause}
      AND ${tierCondition}
    GROUP BY kode_mix, article, nama_gudang, series, gender, gudang_branch, tier
    ORDER BY pairs DESC
    LIMIT 100
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(
      rows.map((r) => ({
        kode_mix: r.kode_mix,
        article: r.article,
        series: r.series,
        gender_group: r.gender_group,
        branch: r.branch,
        tier: r.tier,
        pairs: Number(r.pairs),
        est_rsp_value: Number(r.est_rsp_value),
      }))
    );
  } catch (e) {
    console.error("dead-stock error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
