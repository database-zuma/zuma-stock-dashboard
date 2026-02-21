import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { parseFilters, buildWhereClause } from "@/lib/filters";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { clause, values } = buildWhereClause(filters);

  const sql = `
    SELECT
      COALESCE(gudang_branch, 'Warehouse') AS branch,
      COALESCE(tier, '3') AS tier,
      SUM(quantity) AS pairs
    FROM core.stock_with_product
    ${clause}
    GROUP BY COALESCE(gudang_branch, 'Warehouse'), COALESCE(tier, '3')
    ORDER BY branch, tier
  `;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(
      rows.map((r) => ({
        branch: r.branch,
        tier: r.tier,
        pairs: Number(r.pairs),
      }))
    );
  } catch (e) {
    console.error("by-branch error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
