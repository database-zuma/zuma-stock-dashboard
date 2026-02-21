import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const [catRes, branchRes, gudangRes, genderRes, seriesRes, colorRes, tierRes, sizeRes] =
      await Promise.all([
        pool.query(`SELECT DISTINCT category AS val FROM core.dashboard_cache WHERE category IS NOT NULL AND category != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT branch AS val FROM core.dashboard_cache WHERE branch IS NOT NULL ORDER BY 1`),
        pool.query(`SELECT DISTINCT nama_gudang AS val FROM core.dashboard_cache WHERE nama_gudang IS NOT NULL AND nama_gudang != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT gender_group AS val FROM core.dashboard_cache WHERE gender_group IS NOT NULL ORDER BY 1`),
        pool.query(`SELECT DISTINCT series AS val FROM core.dashboard_cache WHERE series IS NOT NULL AND series != '' ORDER BY 1`),
        pool.query(`SELECT DISTINCT group_warna AS val FROM core.dashboard_cache WHERE group_warna IS NOT NULL AND group_warna != '' AND group_warna != 'OTHER' ORDER BY 1`),
        pool.query(`SELECT DISTINCT tier AS val FROM core.dashboard_cache WHERE tier IS NOT NULL ORDER BY 1`),
        pool.query(`SELECT DISTINCT ukuran AS val FROM core.dashboard_cache WHERE ukuran IS NOT NULL AND ukuran != '' ORDER BY val`),
      ]);

    return NextResponse.json({
      categories: catRes.rows.map((r) => r.val),
      branches:   branchRes.rows.map((r) => r.val),
      gudangs:    gudangRes.rows.map((r) => r.val),
      genders:    genderRes.rows.map((r) => r.val),
      series:     seriesRes.rows.map((r) => r.val),
      colors:     colorRes.rows.map((r) => r.val),
      tiers:      tierRes.rows.map((r) => r.val),
      sizes:      sizeRes.rows.map((r) => r.val),
    });
  } catch (e) {
    console.error("filter-options error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
