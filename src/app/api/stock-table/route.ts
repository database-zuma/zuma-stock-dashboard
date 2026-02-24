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
  article: "article",
  kode_besar: "kode_besar",
  kode: "kode",
  series: "series",
  gender_group: "gender_group",
  tipe: "tipe",
  group_warna: "group_warna",
  ukuran: "ukuran",
  tier: "tier",
  branch: "branch",
  nama_gudang: "nama_gudang",
  pairs: "pairs",
  est_rsp_value: "est_rsp_value",
  source_entity: "source_entity",
};

function buildWhere(sp: URLSearchParams): { clause: string; values: unknown[] } {
  const conds: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  // Exclude non-product items (shopbag, paperbag, GWP, hanger)
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

  addFilter("category",     parseMulti(sp, "category"));
  addFilter("branch",       parseMulti(sp, "branch"));
  addFilter("nama_gudang",  parseMulti(sp, "gudang"));
  addFilter("gender_group", parseMulti(sp, "gender"));
  addFilter("series",       parseMulti(sp, "series"));
  addFilter("group_warna",  parseMulti(sp, "color"));
  addFilter("tier",         parseMulti(sp, "tier"));
  addFilter("ukuran",       parseMulti(sp, "size"));
  addFilter("v",              parseMulti(sp, "v"));
  addFilter("source_entity",  parseMulti(sp, "entitas"));

  const q = sp.get("q");
  if (q) {
    conds.push(`(kode_besar ILIKE $${i} OR kode ILIKE $${i})`);
    vals.push(`%${q}%`);
    i++;
  }

  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", values: vals };
}

function getSort(sp: URLSearchParams): string {
  const sort = sp.get("sort") || "pairs";
  const dir = sp.get("dir") === "asc" ? "ASC" : "DESC";
  const col = SORT_WHITELIST[sort];
  if (!col) return "pairs DESC NULLS LAST";
  return `${col} ${dir} NULLS LAST`;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const { clause, values } = buildWhere(sp);
  const orderBy = getSort(sp);
  const isExport = sp.get("export") === "all";
  const page   = Math.max(1, Number(sp.get("page"))  || 1);
  const limit  = isExport ? 50000 : Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = isExport ? 0 : (page - 1) * limit;
  const n      = values.length + 1;

  const dataSql = `
    SELECT
      kode_besar, kode, article, series, gender_group, tipe, tier,
      branch, nama_gudang, group_warna, ukuran,
      SUM(pairs)    AS pairs,
      SUM(est_rsp)  AS est_rsp_value
    FROM core.dashboard_cache
    ${clause}
    GROUP BY kode_besar, kode, article, series, gender_group, tipe, tier,
             branch, nama_gudang, group_warna, ukuran
    ORDER BY ${orderBy}
    ${isExport ? '' : `LIMIT $${n} OFFSET $${n + 1}`}
  `;

  const countSql = `
    SELECT COUNT(*) AS total FROM (
      SELECT 1 FROM core.dashboard_cache
      ${clause}
      GROUP BY kode_besar, kode, article, series, gender_group, tipe, tier,
               branch, nama_gudang, group_warna, ukuran
    ) sub
  `;

  try {
    const [dataRes, countRes] = await Promise.all([
      pool.query(dataSql, isExport ? (values as string[]) : [...(values as string[]), limit, offset]),
      pool.query(countSql, values as string[]),
    ]);
    return NextResponse.json({
      rows: dataRes.rows.map((r) => ({
        kode_besar:    r.kode_besar,
        kode:          r.kode,
        article:       r.article,
        series:        r.series,
        gender_group:  r.gender_group,
        tipe:          r.tipe,
        tier:          r.tier,
        branch:        r.branch,
        nama_gudang:   r.nama_gudang,
        group_warna:   r.group_warna,
        ukuran:        r.ukuran,
        pairs:         Number(r.pairs),
        est_rsp_value: Number(r.est_rsp_value),
      })),
      total: Number(countRes.rows[0].total),
      page,
      limit,
    }, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (e) {
    console.error("stock-table error:", e);
    return NextResponse.json({ rows: [], total: 0, page, limit });
  }
}
