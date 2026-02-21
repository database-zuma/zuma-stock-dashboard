import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause, nextParamIndex } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters = parseFilters(sp);
  const { clause, values } = buildWhereClause(filters);

  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = (page - 1) * limit;

  let idx = nextParamIndex(filters);
  const limitParam = `$${idx}`;
  idx++;
  const offsetParam = `$${idx}`;

  const dataSql = `
    SELECT
      kode_mix,
      COALESCE(article, '') AS article,
      series,
      CASE WHEN UPPER(gender) IN ('BABY','BOYS','GIRLS','JUNIOR','KIDS') THEN 'Baby & Kids'
           WHEN UPPER(gender) = 'MEN' THEN 'Men'
           WHEN UPPER(gender) = 'LADIES' THEN 'Ladies'
           ELSE COALESCE(gender, 'Unknown') END AS gender_group,
      tipe,
      COALESCE(tier, '3') AS tier,
      COALESCE(gudang_branch, 'Warehouse') AS branch,
      nama_gudang,
      SUM(quantity) AS pairs,
      SUM(quantity * COALESCE(rsp, 0)) AS est_rsp_value
    FROM core.stock_with_product
    ${clause}
    GROUP BY kode_mix, article, series, gender, tipe, tier, gudang_branch, nama_gudang
    ORDER BY SUM(quantity) DESC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  // Use a lightweight count: count distinct (kode_mix, tipe, tier, gudang_branch) combos
  // This is much faster than subquery GROUP BY on all columns
  const countSql = `
    SELECT COUNT(DISTINCT (kode_mix, COALESCE(tipe,''), COALESCE(tier,''), COALESCE(gudang_branch,''))) AS total
    FROM core.stock_with_product
    ${clause}
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, [...values, limit, offset]),
      pool.query(countSql, values),
    ]);

    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kode_mix: r.kode_mix,
        article: r.article,
        series: r.series,
        gender_group: r.gender_group,
        tipe: r.tipe,
        tier: r.tier,
        branch: r.branch,
        nama_gudang: r.nama_gudang,
        pairs: Number(r.pairs),
        est_rsp_value: Number(r.est_rsp_value),
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    });
  } catch (e) {
    console.error("stock-table error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit }, { status: 200 });
  }
}
