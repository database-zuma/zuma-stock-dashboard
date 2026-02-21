import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const sql = `
    SELECT
      CASE WHEN gender IN ('Baby','Boys','Girls','Junior') THEN 'Baby & Kids'
           ELSE COALESCE(gender, 'Unknown') END AS gender_group,
      SUM(quantity) AS pairs
    FROM core.stock_with_product
    ${clause}
    GROUP BY gender_group
    ORDER BY pairs DESC
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(
      rows.map((r) => ({
        gender_group: r.gender_group,
        pairs: Number(r.pairs),
      }))
    );
  } catch (e) {
    console.error("by-gender error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
