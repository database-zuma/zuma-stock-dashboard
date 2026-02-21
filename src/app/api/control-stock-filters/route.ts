import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  try {
    const [genderRes, seriesRes, colorRes, tipeRes, tierRes, sizeRes] =
      await Promise.all([
        pool.query(`SELECT DISTINCT gender AS val FROM mart.sku_portfolio_size WHERE gender IS NOT NULL AND gender != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT series AS val FROM mart.sku_portfolio_size WHERE series IS NOT NULL AND series != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT color  AS val FROM mart.sku_portfolio_size WHERE color  IS NOT NULL AND color  != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT tipe   AS val FROM mart.sku_portfolio_size WHERE tipe   IS NOT NULL AND tipe   != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT tier   AS val FROM mart.sku_portfolio_size WHERE tier   IS NOT NULL AND tier   != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT size   AS val FROM mart.sku_portfolio_size WHERE size   IS NOT NULL AND size   != '' ORDER BY
          CASE WHEN size ~ '^[0-9]+$' THEN size::int
               WHEN size ~ '^[0-9]+/[0-9]+$' THEN split_part(size,'/',1)::int
               ELSE 999 END ASC, size ASC`),
      ]);

    return NextResponse.json({
      genders: genderRes.rows.map((r) => r.val),
      series:  seriesRes.rows.map((r) => r.val),
      colors:  colorRes.rows.map((r) => r.val),
      tipes:   tipeRes.rows.map((r) => r.val),
      tiers:   tierRes.rows.map((r) => r.val),
      sizes:   sizeRes.rows.map((r) => r.val),
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (e) {
    console.error("control-stock-filters error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
