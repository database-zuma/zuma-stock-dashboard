import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const sql = `
    SELECT
      COALESCE(series, 'Unknown') AS series,
      SUM(quantity) AS pairs,
      COUNT(DISTINCT kode_mix) AS articles
    FROM core.stock_with_product
    ${clause}
    GROUP BY series
    ORDER BY SUM(quantity) DESC
    LIMIT 15
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(
      rows.map((r) => ({
        series: r.series,
        pairs: Number(r.pairs),
        articles: Number(r.articles),
      }))
    );
  } catch (e) {
    console.error("by-series error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
