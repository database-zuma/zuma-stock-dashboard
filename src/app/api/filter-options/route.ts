import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [branchRes, genderRes, tierRes, categoryRes] = await Promise.all([
      pool.query(`SELECT DISTINCT gudang_branch AS val FROM core.stock_with_product WHERE gudang_branch IS NOT NULL ORDER BY 1`),
      pool.query(`SELECT DISTINCT
        CASE WHEN UPPER(gender) IN ('BABY','BOYS','GIRLS','JUNIOR','KIDS') THEN 'Baby & Kids'
             WHEN UPPER(gender) = 'MEN' THEN 'Men'
             WHEN UPPER(gender) = 'LADIES' THEN 'Ladies'
             ELSE COALESCE(gender, 'Unknown') END AS val
        FROM core.stock_with_product ORDER BY 1`),
      pool.query(`SELECT DISTINCT COALESCE(tier, '3') AS val FROM core.stock_with_product ORDER BY 1`),
      pool.query(`SELECT DISTINCT gudang_category AS val FROM core.stock_with_product WHERE gudang_category IS NOT NULL ORDER BY 1`),
    ]);

    return NextResponse.json({
      branches: branchRes.rows.map((r) => r.val),
      genders: genderRes.rows.map((r) => r.val),
      tiers: tierRes.rows.map((r) => r.val),
      categories: categoryRes.rows.map((r) => r.val),
    });
  } catch (e) {
    console.error("filter-options error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
