import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

const GROUP_WHITELIST: Record<string, { col: string; groupBy?: string; labelExpr: string; nullFilter?: string }> = {
  kode_besar:  { col: "kode_besar",  labelExpr: "MAX(COALESCE(NULLIF(product_name,''), kode_besar))" },
  nama_gudang: { col: "nama_gudang", labelExpr: "INITCAP(nama_gudang)", nullFilter: "nama_gudang IS NOT NULL AND nama_gudang != ''" },
  series:      { col: "series",      labelExpr: "series", nullFilter: "series IS NOT NULL AND series != ''" },
  branch:      { col: "branch",      labelExpr: "branch", nullFilter: "branch IS NOT NULL AND branch != ''" },
  size:        { col: "kode_besar || '|' || COALESCE(size,'')", groupBy: "kode_besar, size", labelExpr: "MAX(COALESCE(NULLIF(product_name,''), kode_besar)) || ' – ' || COALESCE(size, '')", nullFilter: "size IS NOT NULL AND size != ''" },
};

const SORT_WHITELIST = ["stock", "sales", "ratio"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

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
  addFilter("v", parseMulti(sp, "v"));

  const groupBy = sp.get("group_by") || "kode_besar";
  const g = GROUP_WHITELIST[groupBy] || GROUP_WHITELIST.kode_besar;

  // Exclude null group values
  if (g.nullFilter) {
    conds.push(g.nullFilter);
  }

  const whereStr = conds.length ? "WHERE " + conds.join(" AND ") : "";

  const sortParam = sp.get("sort") || "stock";
  const sortCol = SORT_WHITELIST.includes(sortParam) ? sortParam : "stock";
  const sortDir = sp.get("dir") === "asc" ? "ASC" : "DESC";

  const limit = Math.min(100, Math.max(10, Number(sp.get("limit")) || 30));

  const n = vals.length;

  const sql = `
    SELECT
      ${g.col} AS group_key,
      ${g.labelExpr} AS label,
      SUM(stock_qty)::int AS stock,
      SUM(CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} THEN sales_qty ELSE 0 END)::int AS sales,
      ROUND(
        SUM(CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} THEN sales_qty ELSE 0 END)::numeric
        / NULLIF(SUM(stock_qty), 0), 4
      ) AS ratio
    FROM mart.sales_stock_ratio
    ${whereStr}
    GROUP BY ${g.groupBy ?? g.col}
    HAVING SUM(stock_qty) > 0 OR SUM(CASE WHEN transaction_date BETWEEN $${n + 1} AND $${n + 2} THEN sales_qty ELSE 0 END) > 0
    ORDER BY ${sortCol} ${sortDir} NULLS LAST
    LIMIT $${n + 3}
  `;

  try {
    const { rows } = await pool.query(sql, [...vals, dateFrom, dateTo, limit]);

    return NextResponse.json({
      rows: rows.map((r) => ({
        group_key: r.group_key,
        label: r.label || r.group_key,
        stock: Number(r.stock) || 0,
        sales: Number(r.sales) || 0,
        ratio: r.ratio != null ? Number(r.ratio) : 0,
      })),
      group_by: groupBy,
      date_from: dateFrom,
      date_to: dateTo,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("ssr-data error:", e);
    return NextResponse.json({ error: "DB error", rows: [], group_by: groupBy, date_from: dateFrom, date_to: dateTo }, { status: 500 });
  }
}
