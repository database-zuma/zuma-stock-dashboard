import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseMulti(sp: URLSearchParams, key: string): string[] {
  const val = sp.get(key);
  if (!val) return [];
  return val.split(",").map((v) => v.trim()).filter(Boolean);
}

const SORT_WHITELIST: Record<string, string> = {
  year:        "year",
  month_num:   "month_num",
  month_name:  "month_name",
  kode_besar:  "kode_besar",
  pairs_sold:  "pairs_sold",
  revenue:     "revenue",
  series:      "series",
  gender:      "gender",
  tipe:        "tipe",
  tier:        "tier",
  branch:      "branch",
};

function buildWhere(sp: URLSearchParams): { clause: string; values: unknown[] } {
  const conds: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  // Always exclude intercompany
  conds.push("is_intercompany = FALSE");

  // Exclude non-product items
  conds.push("kode_besar !~ '^(gwp|hanger|paperbag|shopbag)'");

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

  addFilter("branch",  parseMulti(sp, "branch"));
  addFilter("gender",  parseMulti(sp, "gender"));
  addFilter("series",  parseMulti(sp, "series"));
  addFilter("group_warna", parseMulti(sp, "color"));  // FilterBar sends group_warna values as 'color' param
  addFilter("tipe",    parseMulti(sp, "tipe"));
  addFilter("tier",    parseMulti(sp, "tier"));
  addFilter("size",    parseMulti(sp, "size"));
  addFilter("v",       parseMulti(sp, "v"));

  // Date range filters
  const dateFrom = sp.get("date_from");
  const dateTo   = sp.get("date_to");
  if (dateFrom) {
    conds.push(`transaction_date >= $${i++}`);
    vals.push(dateFrom);
  }
  if (dateTo) {
    conds.push(`transaction_date <= $${i++}`);
    vals.push(dateTo);
  }

  // kode_besar search
  const q = sp.get("q");
  if (q) {
    conds.push(`kode_besar ILIKE $${i++}`);
    vals.push(`%${q}%`);
  }

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

function getSort(sp: URLSearchParams): string {
  const sort = sp.get("sort") || "year";
  const dir  = sp.get("dir") === "asc" ? "ASC" : "DESC";
  const col  = SORT_WHITELIST[sort];
  if (!col) return "year DESC, month_num DESC, pairs_sold DESC NULLS LAST";
  return `${col} ${dir} NULLS LAST`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { clause, values } = buildWhere(sp);
  const orderBy  = getSort(sp);
  const isExport = sp.get("export") === "all";
  const page     = Math.max(1, Number(sp.get("page"))  || 1);
  const limit    = isExport ? 50000 : Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset   = isExport ? 0 : (page - 1) * limit;
  const n        = values.length + 1;

  const dataSql = `
    SELECT
      DATE_PART('year',  transaction_date)::int           AS year,
      DATE_PART('month', transaction_date)::int           AS month_num,
      TRIM(TO_CHAR(transaction_date, 'Month'))            AS month_name,
      kode_besar,
      SUM(quantity)     AS pairs_sold,
      SUM(total_amount) AS revenue
    FROM core.sales_with_product
    ${clause}
    GROUP BY
      DATE_PART('year',  transaction_date),
      DATE_PART('month', transaction_date),
      TRIM(TO_CHAR(transaction_date, 'Month')),
      kode_besar
    ORDER BY ${orderBy}
    ${isExport ? "" : `LIMIT $${n} OFFSET $${n + 1}`}
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 1 FROM core.sales_with_product
      ${clause}
      GROUP BY
        DATE_PART('year',  transaction_date),
        DATE_PART('month', transaction_date),
        TRIM(TO_CHAR(transaction_date, 'Month')),
        kode_besar
    ) sub
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, isExport ? (values as string[]) : [...(values as string[]), limit, offset]),
      pool.query(countSql, values as string[]),
    ]);

    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        year:       Number(r.year),
        month_num:  Number(r.month_num),
        month_name: r.month_name as string,
        kode_besar: r.kode_besar as string,
        pairs_sold: Number(r.pairs_sold),
        revenue:    Number(r.revenue),
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("sales-monthly error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit });
  }
}
