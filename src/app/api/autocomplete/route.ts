import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json([]);

  const like = `%${q}%`;
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT kode, article
       FROM core.dashboard_cache
       WHERE (kode ILIKE $1 OR article ILIKE $1)
         AND kode IS NOT NULL AND article IS NOT NULL
         AND kode != '' AND article != ''
       ORDER BY kode
       LIMIT 20`,
      [like]
    );
    return NextResponse.json(
      rows.map((r) => ({ kode: r.kode as string, article: r.article as string })),
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } }
    );
  } catch (e) {
    console.error("autocomplete error:", e);
    return NextResponse.json([]);
  }
}
