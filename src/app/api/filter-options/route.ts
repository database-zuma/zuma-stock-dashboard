import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const [branchRes, genderRes, tierRes, categoryRes] = await Promise.all([
      pool.query(`SELECT DISTINCT branch AS val FROM core.dashboard_cache WHERE branch IS NOT NULL ORDER BY 1`),
      pool.query(`SELECT DISTINCT gender_group AS val FROM core.dashboard_cache WHERE gender_group IS NOT NULL ORDER BY 1`),
      pool.query(`SELECT DISTINCT tier AS val FROM core.dashboard_cache ORDER BY 1`),
      pool.query(`SELECT DISTINCT category AS val FROM core.dashboard_cache WHERE category IS NOT NULL ORDER BY 1`),
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
