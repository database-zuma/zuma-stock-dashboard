import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const sql = `
    SELECT
      SUM(quantity) AS total_pairs,
      COUNT(DISTINCT kode_mix) AS unique_articles,
      SUM(CASE WHEN COALESCE(tier,'3') IN ('4','5') THEN quantity ELSE 0 END) AS dead_stock_pairs,
      SUM(quantity * COALESCE(rsp, 0)) AS est_rsp_value,
      MAX(snapshot_date) AS snapshot_date
    FROM core.stock_with_product
    ${clause}
  `;

  try {
    const { rows } = await pool.query(sql, values);
    const r = rows[0];
    return NextResponse.json({
      total_pairs: Number(r.total_pairs) || 0,
      unique_articles: Number(r.unique_articles) || 0,
      dead_stock_pairs: Number(r.dead_stock_pairs) || 0,
      est_rsp_value: Number(r.est_rsp_value) || 0,
      snapshot_date: r.snapshot_date,
    });
  } catch (e) {
    console.error("KPI query error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
