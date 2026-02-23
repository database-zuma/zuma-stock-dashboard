import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

function buildWhere(sp: URLSearchParams): { clause: string; values: unknown[]; dateFrom: string; dateTo: string } {
  const conds: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const today = new Date();
  const d30 = new Date(today);
  d30.setDate(d30.getDate() - 30);

  const dateFrom = sp.get("date_from") || d30.toISOString().split("T")[0];
  const dateTo = sp.get("date_to") || today.toISOString().split("T")[0];

  const addFilter = (col: string, values: string[]) => {
    if (values.length === 0) return;
    if (values.length === 1) {
      conds.push(`${col} = $${i++}`);
      vals.push(values[0]);
    } else {
      const phs = values.map(() => `$${i++}`).join(", ");
      conds.push(`${col} IN (${phs})`);
      vals.push(...values);
    }
  };

  addFilter("branch", parseMulti(sp, "branch"));
  addFilter("store_category", parseMulti(sp, "store_category"));
  addFilter("nama_gudang", parseMulti(sp, "nama_gudang"));
  addFilter("gender", parseMulti(sp, "gender"));
  addFilter("series", parseMulti(sp, "series"));
  addFilter("tipe", parseMulti(sp, "tipe"));
  addFilter("tier", parseMulti(sp, "tier"));
  addFilter("color", parseMulti(sp, "color"));

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals, dateFrom, dateTo };
}

export async function GET(req: NextRequest) {
  const { clause, values, dateFrom, dateTo } = buildWhere(req.nextUrl.searchParams);
  const n = values.length;

  const sql = `
    WITH base AS (SELECT * FROM mart.sales_stock_ratio ${clause})
    SELECT
      SUM(stock_qty)                                                                           AS total_stock,
      SUM(CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} THEN sales_qty    ELSE 0 END) AS total_sales,
      SUM(CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} THEN sales_amount ELSE 0 END) AS total_sales_amount,
      COUNT(DISTINCT CASE WHEN stock_qty > 0 THEN kode_besar END)                              AS stocked_articles,
      COUNT(DISTINCT CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} AND sales_qty > 0 THEN kode_besar END) AS sold_articles
    FROM base
  `;

  try {
    const { rows } = await pool.query(sql, [...values, dateFrom, dateTo]);
    const r = rows[0];
    const totalStock = Number(r.total_stock) || 0;
    const totalSales = Number(r.total_sales) || 0;

    return NextResponse.json({
      total_stock: totalStock,
      total_sales: totalSales,
      total_sales_amount: Number(r.total_sales_amount) || 0,
      ratio: totalStock > 0 ? Math.round((totalSales / totalStock) * 10000) / 10000 : 0,
      stocked_articles: Number(r.stocked_articles) || 0,
      sold_articles: Number(r.sold_articles) || 0,
      date_from: dateFrom,
      date_to: dateTo,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("ssr-summary error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
