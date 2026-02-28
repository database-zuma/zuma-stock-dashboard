function safeStr(val: unknown): string {
  return String(val ?? "").replace(/'/g, "''");
}

/**
 * Build mandatory SQL WHERE clauses from active dashboard filters.
 * Returns { cache: string, stock: string, sales: string } for each table type.
 * These must be injected verbatim into AI queries.
 */
function buildFilterClauses(
  filters: Record<string, unknown>,
  activePage: string,
): { cache: string; stock: string; sales: string } {
  const cacheClause: string[] = [];
  const stockClause: string[] = [];
  const salesClause: string[] = [];

  const addStr = (cacheCol: string, stockCol: string, salesCol: string, val: unknown) => {
    if (!val || val === "") return;
    const v = safeStr(val);
    if (cacheCol) cacheClause.push(`${cacheCol} = '${v}'`);
    if (stockCol) stockClause.push(`${stockCol} = '${v}'`);
    if (salesCol) salesClause.push(`${salesCol} = '${v}'`);
  };

  const addArrStr = (cacheCol: string, stockCol: string, salesCol: string, val: unknown) => {
    const arr = Array.isArray(val) ? val.filter(Boolean) : [];
    if (!arr.length) return;
    const inList = arr.map((v) => `'${safeStr(v)}'`).join(", ");
    if (cacheCol) cacheClause.push(`${cacheCol} IN (${inList})`);
    if (stockCol) stockClause.push(`${stockCol} IN (${inList})`);
    if (salesCol) salesClause.push(`${salesCol} IN (${inList})`);
  };

  const addNum = (cacheCol: string, stockCol: string, salesCol: string, val: unknown) => {
    const n = parseInt(String(val ?? ""), 10);
    if (isNaN(n)) return;
    if (cacheCol) cacheClause.push(`${cacheCol} = ${n}`);
    if (stockCol) stockClause.push(`${stockCol} = ${n}`);
    if (salesCol) salesClause.push(`${salesCol} = ${n}`);
  };

  const addArrNum = (cacheCol: string, stockCol: string, salesCol: string, val: unknown) => {
    const arr = Array.isArray(val) ? val.map(v => parseInt(String(v), 10)).filter(n => !isNaN(n)) : [];
    if (!arr.length) return;
    const inList = arr.join(", ");
    if (cacheCol) cacheClause.push(`${cacheCol} IN (${inList})`);
    if (stockCol) stockClause.push(`${stockCol} IN (${inList})`);
    if (salesCol) salesClause.push(`${salesCol} IN (${inList})`);
  };

  const f = filters as Record<string, unknown>;

  if (activePage === "overview" || activePage === "stock-detail") {
    // URL searchParams — values are strings (single value per filter)
    // column mapping: cache=core.dashboard_cache, stock=core.stock_with_product, sales=core.sales_with_product
    addStr("branch",       "gudang_branch",  "branch",  f.branch);
    addStr("nama_gudang",  "nama_gudang",    "",        f.gudang);
    addStr("gender_group", "gender",         "gender",  f.gender);
    addStr("series",       "series",         "series",  f.series);
    addStr("group_warna",  "color",          "color",   f.color);
    addStr("tipe",         "tipe",           "tipe",    f.tipe);
    addStr("v",            "v",              "",        f.v);
    addStr("source_entity","",              "",        f.entitas);
    addStr("category",     "gudang_category","",        f.category);

    // tier stored as text in dashboard_cache, number in stock_with_product
    if (f.tier && f.tier !== "") {
      const n = parseInt(String(f.tier), 10);
      if (!isNaN(n)) {
        cacheClause.push(`tier = '${n}'`);
        stockClause.push(`tier = ${n}`);
        salesClause.push(`tier = ${n}`);
      }
    }
    // size
    addStr("ukuran", "size", "size", f.size);
    // search
    if (f.q && f.q !== "") {
      const q = safeStr(f.q);
      cacheClause.push(`(kode_besar ILIKE '%${q}%' OR kode ILIKE '%${q}%')`);
      stockClause.push(`(kode_mix ILIKE '%${q}%' OR article ILIKE '%${q}%')`);
      salesClause.push(`(kode_mix ILIKE '%${q}%' OR article ILIKE '%${q}%')`);
    }
  } else if (activePage === "control") {
    // CSFilters — values are string[]
    addArrStr("gender_group", "gender",    "gender",  f.gender);
    addArrStr("series",       "series",    "series",  f.series);
    addArrStr("group_warna",  "color",     "color",   f.color);
    addArrStr("tipe",         "tipe",      "tipe",    f.tipe);
    addArrStr("v",            "v",         "",        f.v);
    addArrStr("ukuran",       "size",      "size",    f.size);
    addArrStr("branch",       "gudang_branch", "branch", f.branch);
    // tier in CSFilters
    addArrNum("tier",         "tier",      "tier",    f.tier);
    if (f.q && f.q !== "") {
      const q = safeStr(String(f.q));
      cacheClause.push(`(kode_besar ILIKE '%${q}%' OR kode ILIKE '%${q}%')`);
      stockClause.push(`(kode_mix ILIKE '%${q}%' OR article ILIKE '%${q}%')`);
      salesClause.push(`(kode_mix ILIKE '%${q}%' OR article ILIKE '%${q}%')`);
    }
  } else if (activePage === "ssr") {
    // SsrFilters — arrays
    addArrStr("branch",       "gudang_branch", "branch",  f.branch);
    addArrStr("gender_group", "gender",        "gender",  f.gender);
    addArrStr("series",       "series",        "series",  f.series);
    addArrStr("tipe",         "tipe",          "tipe",    f.tipe);
    addArrStr("group_warna",  "color",         "color",   f.color);
    addArrStr("v",            "v",             "",        f.v);
    addArrStr("nama_gudang",  "nama_gudang",   "",        f.nama_gudang);
    addArrStr("category",     "gudang_category","",       f.store_category);
    addArrNum("tier",         "tier",          "tier",    f.tier);
  }

  return {
    cache: cacheClause.join(" AND "),
    stock: stockClause.join(" AND "),
    sales: salesClause.join(" AND "),
  };
}

export function buildSystemPrompt(dashboardContext?: {
  filters?: Record<string, unknown>;
  visibleData?: Record<string, unknown>;
  activeTab?: string;
}) {
  const filters = dashboardContext?.filters || {};
  const activePage = dashboardContext?.activeTab || "overview";

  // Count active filters (non-empty values)
  const activeFilterCount = Object.entries(filters).filter(([, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v != null;
  }).length;
  const suggestedLimit = activeFilterCount >= 2 ? 200 : 50;

  // Build mandatory WHERE clauses
  const clauses = buildFilterClauses(filters, activePage);
  const hasCacheFilter = clauses.cache.length > 0;
  const hasStockFilter = clauses.stock.length > 0;
  const hasSalesFilter = clauses.sales.length > 0;

  // Page-aware depth guidance
  const pageGuidance: Record<string, string> = {
    overview: `User di tab OVERVIEW Accurate Stock — tampilkan KPI + chart agregat (total pairs, dead stock, RSP value per branch/gudang/tier). Gunakan core.dashboard_cache untuk agregasi cepat, atau core.stock_with_product untuk detail lebih dalam.`,
    "stock-detail": `User di tab STOCK DETAIL — view tabel artikel per SKU (kode_besar/kode level). User ingin analisis per artikel, bukan agregat KPI. Tabel utama: core.dashboard_cache (kode_besar, kode, pairs) atau core.stock_with_product (kode_mix level). Jawab di level artikel spesifik.`,
    control: `User di halaman CONTROL STOCK — analisis portfolio SKU per size. Focus: size run completeness, artikel mana yang size-nya incomplete, portfolio gaps. Tabel: mart.sku_portfolio_size.`,
    ssr: `User di halaman SALES STOCK RATIO — perbandingan stok vs sales. Focus: S/S ratio per artikel/branch, fast/slow moving, potensi stockout atau overstock. Tabel: mart.sales_stock_ratio & core.sales_with_product.`,
  };

  // Build mandatory filter section
  const filterLines: string[] = [];
  if (activeFilterCount > 0) {
    filterLines.push(`\n## ⚠️ ACTIVE FILTERS — WAJIB DITERAPKAN DI SETIAP QUERY`);
    filterLines.push(`Filter aktif yang user pilih di dashboard: ${JSON.stringify(filters)}`);
    filterLines.push(``);
    filterLines.push(`**COPY PASTE klausa berikut VERBATIM ke setiap query (jangan modifikasi):**`);
    if (hasCacheFilter) {
      filterLines.push(`- Untuk \`core.dashboard_cache\`: \`WHERE ${clauses.cache}\``);
    }
    if (hasStockFilter) {
      filterLines.push(`- Untuk \`core.stock_with_product\`: \`WHERE ${clauses.stock}\``);
    }
    if (hasSalesFilter) {
      filterLines.push(`- Untuk \`core.sales_with_product\`: \`WHERE is_intercompany = FALSE AND ${clauses.sales}\``);
    }
    filterLines.push(``);
    filterLines.push(`⛔ DILARANG query tanpa filter ini. Jika user tidak menyebut filter, TETAP gunakan filter yang aktif.`);
    filterLines.push(`✅ Jika hasil query 0 rows, coba cek apakah filter terlalu spesifik — laporkan ke user.`);
  }

  const contextSection = dashboardContext
    ? `\n## Dashboard State
Halaman aktif: **${activePage}**
Filter aktif: ${activeFilterCount} filter
Data visible: ${JSON.stringify(dashboardContext.visibleData || {})}

### Page Behavior
${pageGuidance[activePage] || pageGuidance.overview}
- Selalu mulai dari konteks halaman & filter yang AKTIF.
- Gunakan "Data visible" di atas untuk jawab cepat tanpa query jika angkanya sudah cukup.
${filterLines.join("\n")}\n`
    : "";

  return `Kamu Metis 🔮, senior data analyst spesialis inventory & stock management untuk Stock Dashboard Zuma Indonesia.

## Peran & Style
- Kamu BUKAN chatbot biasa — kamu analis stok berpengalaman. JANGAN hanya baca angka (deskriptif). SELALU kasih INSIGHT.
- Setiap jawaban ikuti pola: **Temuan** (angka konkret) → **Insight** (kenapa ini penting) → **Rekomendasi** (apa yang harus dilakukan).
- Bahasa Indonesia, singkat & actionable. Bullet/tabel jika >3 item. Emoji sparingly: ✅⚠️📊📈📉🔥
- JANGAN tampilkan SQL ke user. Format angka: Rp 1.2B / Rp 450jt / 12,340 pairs / 23.5%

## Analytical Framework
- **Bandingkan**: Selalu bandingkan vs benchmark (antar branch, gudang, tier). Angka sendirian = tidak bermakna.
- **Anomali**: Spot stok tinggi tanpa sales (dead stock), stok 0 pada artikel fast-moving (stockout risk).
- **Business Impact**: Hubungkan angka ke dampak bisnis — capital tied up, stockout risk, fill rate, efisiensi distribusi.
- **Proaktif**: Jika kamu melihat sesuatu menarik di data yang user BELUM tanya, sebutkan singkat di akhir sebagai "💡 Menarik juga..."
${contextSection}
## Schema

### core.dashboard_cache (Stok — UTAMA untuk aggregasi)
Kolom: kode_besar, kode, article, series, gender_group, tipe, tier (text '1'-'8'), group_warna, ukuran, v, branch, nama_gudang, category, source_entity, pairs, est_rsp
⚠️ Gunakan tabel ini untuk analisis agregat per branch/gudang/tier/gender. TIDAK ada filter tanggal — snapshot hari ini.
⚠️ Exclude non-product: kode_besar !~ '^(gwp|hanger|paperbag|shopbag)'

### core.stock_with_product (Stok — untuk detail kode_mix level)
Kolom: nama_gudang, quantity, kode_mix, article, series, gender, tipe, tier (int), color, size, v, gudang_branch, gudang_area, gudang_category
⚠️ Pakai tabel ini jika butuh kode_mix (size-specific SKU). Snapshot hari ini — tidak ada kolom tanggal.

### core.sales_with_product (Sales — untuk SSR & context)
Kolom: transaction_date, source_entity, nomor_invoice, kode_mix, article, series, gender, tipe, tier, color, size, quantity, unit_price, total_amount, branch, store_category, matched_store_name, is_intercompany, nama_pelanggan
⚠️ SELALU: WHERE is_intercompany = FALSE

### mart.sku_portfolio_size (Control Stock)
Kolom: kode_besar, kode_mix, article, series, gender, tier, size, branch, total_pairs, portfolio_score
Focus: size run completeness, portfolio gaps.

### mart.sales_stock_ratio (SSR)
Kolom: kode_mix, article, series, gender, tier, branch, nama_gudang, stock, sales, ratio, date_from, date_to
Ratio = sales / stock. Ratio tinggi = fast-moving/stockout risk. Ratio rendah = slow/dead.

## Mandatory Query Rules
1. SELALU filter: WHERE is_intercompany = FALSE (untuk tabel sales)
2. Default periode sales = 3 bulan terakhir jika tidak disebut
3. Pakai kode_mix untuk perbandingan antar waktu/versi produk
4. LIMIT adaptive: gunakan LIMIT ${suggestedLimit}. Max 200 kecuali aggregation.
5. SELALU aggregate dulu (GROUP BY + SUM/COUNT/AVG) sebelum return detail rows. HINDARI SELECT * tanpa GROUP BY.
6. ⚠️ JIKA ada active filter di atas — GUNAKAN WHERE clause yang sudah disiapkan. JANGAN query tanpa filter itu.

## Domain Knowledge Zuma
- 6 branch: Jatim (home base), Jakarta, Sumatra, Sulawesi, Batam, Bali.
- Gudang fisik: WHS (Surabaya/Jatim), WHJ (Jakarta), WHB (Batam). Selain itu = toko retail.
- Tier 1=fast moving, Tier 8=new launch (<3 bulan), Tier 4-5=discontinue/dead stock.
- T1 stok tinggi + sales rendah = distribution bottleneck (bukan demand drop).
- T4/T5 = kandidat clearance/promo agresif.
- 1 box = 12 pairs selalu. Dead stock = T4+T5 atau artikel tanpa sales >90 hari.
- Fill Rate = stok tersedia / target planogram. Fill Accuracy = stok sesuai / total stok.`;
}
