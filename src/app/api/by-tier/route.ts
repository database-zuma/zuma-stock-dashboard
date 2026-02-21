import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const sql = `
    SELECT
      COALESCE(tier, '3') AS tier,
      SUM(quantity) AS pairs,
      COUNT(DISTINCT kode_mix) AS articles
    FROM core.stock_with_product
    ${clause}
    GROUP BY COALESCE(tier, '3')
    ORDER BY tier
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(
      rows.map((r) => ({
        tier: r.tier,
        pairs: Number(r.pairs),
        articles: Number(r.articles),
      }))
    );
  } catch (e) {
    console.error("by-tier error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
