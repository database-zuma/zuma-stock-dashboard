# Zuma Stock Dashboard — Troubleshooting & Diagnosis Log

Catatan troubleshooting untuk issue yang pernah terjadi di dashboard ini.
Setiap entry mencatat: gejala, root cause, fix, dan cara pencegahan.

---

## Arsitektur Data (Ringkasan)

```
raw.accurate_stock_ddd / ljbb / mbb / ubb
        ↓  (latest snapshot per tanggal)
core.fact_stock_unified          ← VIEW: UNION ALL 4 entitas
        ↓  (+ dim_product JOIN)
core.stock_with_product          ← VIEW: + kodemix + stock_capacity
        ↓  (pre-aggregated)
core.dashboard_cache             ← MATERIALIZED VIEW ← sumber utama /api/dashboard
        ↓
Next.js API → Vercel → Browser
```

**Kolom kritis:**
- `matched_kode_besar` — hasil JOIN ke `dim_product`; NULL jika kode tidak ditemukan
- `gudang_branch` — hasil JOIN ke `portal.stock_capacity`; NULL jika gudang tidak terdaftar
- `gender_group` — dihitung di MV dari kolom `gender` di `dim_product`

---

## Issue #1 — Semua Branch Hilang dari Chart (Feb 2026)

### Gejala
- Dashboard hanya menampilkan Bali, Lombok, Warehouse
- Branch Jatim, Jakarta, Batam, Sulawesi, Sumatra **hilang total**
- Data pairs untuk Bali dan Lombok = 0

### Investigasi

**Step 1 — Cek apakah masalah di web app atau DB**
```bash
curl https://zuma-stock-dashboard.vercel.app/api/dashboard
# → by_retail: hanya Bali (0 pairs) dan Lombok (0 pairs)
```

**Step 2 — Cek VIEW live vs MV**
```sql
-- VIEW live: benar
SELECT nama_gudang, SUM(quantity) FROM core.stock_with_product
WHERE nama_gudang = 'Zuma Gianyar' GROUP BY nama_gudang;
-- → 4,063 pairs ✓

-- MV (dashboard_cache): salah
SELECT nama_gudang, SUM(pairs) FROM core.dashboard_cache
WHERE nama_gudang = 'Zuma Gianyar' GROUP BY nama_gudang;
-- → 0 pairs ✗
```

**Step 3 — Cek isi MV per branch**
```sql
SELECT branch, COUNT(*) as rows, SUM(pairs) as total_pairs
FROM core.dashboard_cache
WHERE nama_gudang NOT ILIKE '%warehouse%'
GROUP BY branch ORDER BY total_pairs DESC;
-- → Bali: 91,980 rows tapi 0 pairs
-- → Jatim, Jakarta, Batam, Sulawesi, Sumatra: TIDAK ADA
```

### Root Cause

**`core.dashboard_cache` (MV) direfresh di tengah proses update raw data.**

Urutan kejadian:
1. User mulai update/insert ke `raw.accurate_stock_*`
2. Scheduler/trigger auto-refresh MV berjalan di tengah proses
3. MV ter-populate dengan data yang belum lengkap (quantity = 0 atau NULL)
4. User selesai insert data, tapi MV sudah terlanjur berisi data kosong
5. Web app query MV → dapat 0 → chart hilang

**Bukti tambahan:** MV menunjukkan `MAX(snapshot_date) = 2026-02-27` (hari ini) tapi pairs = 0 — artinya MV memang sudah direfresh dengan data hari ini, tapi saat direfresh datanya belum masuk semua.

### Fix

**Immediate fix — refresh MV secara manual:**
```sql
REFRESH MATERIALIZED VIEW core.dashboard_cache;
```

**Code fix — kurangi cache Vercel dari 30 menit ke no-store:**

File: `src/app/api/dashboard/route.ts` line 195
```diff
- headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
+ headers: { "Cache-Control": "no-store" },
```

Sebelumnya, bahkan setelah MV direfresh, Vercel CDN masih melayani response lama selama 30 menit karena cache. Dengan `no-store`, data langsung segar setelah MV direfresh.

### Verifikasi
```bash
curl "https://zuma-stock-dashboard.vercel.app/api/dashboard" | python3 -c "
import json,sys; d=json.load(sys.stdin)
from collections import defaultdict
t=defaultdict(int)
for r in d['by_retail']: t[r['branch']]+=r['pairs']
[print(f'{b}: {p:,}') for b,p in sorted(t.items(),key=lambda x:-x[1])]
"
# Hasil expected:
# Bali: 76,801
# Jatim: 22,102
# Lombok: 13,353
# Jakarta: 8,328
# Batam: 3,520
# Sulawesi: 2,991
# Sumatera: 2,959
```

### Pencegahan

> ⚠️ **WAJIB** setiap kali selesai update `raw.accurate_stock_*`:
> ```sql
> REFRESH MATERIALIZED VIEW core.dashboard_cache;
> ```
> Jangan refresh MV *sebelum* data selesai diinsert.

---

## Issue #2 — Gender "Unknown" di Dashboard (Feb 2026 — RESOLVED)

### Gejala
- Chart "Stock by Branch & Gender" menampilkan segmen **Unknown** (~3,091 pairs retail, ~157,863 total termasuk warehouse)
- Mewakili ~2.4% retail pairs

### Investigasi

**Kategori item dengan Unknown gender:**
1. **Non-produk / supplies**: `100005` = Thermal Paper (1,766 pairs), `100006` = Printer Kasir, dll
2. **Packaging / box**: `inbox001` = Box Luca Luna (10,460 pairs!), `boxbbbt002` = Box Baby Toy Story, dll
3. **Non-Zuma / data dummy**: kode numerik seperti `108602040` (BOOM HITAM MAN), `177301939` (FRIKA BROWN), `178611339` (RENO BLACK), dll

Semua item ini tidak ada di `dim_product` → JOIN miss → `gender = NULL` → tampil sebagai "Unknown".

### Root Cause
Filter lama di `core.dashboard_cache` hanya cek kolom `article` (dari kodemix). Karena item non-Zuma tidak punya entry di dim_product/kodemix, `article`-nya kosong → lolos filter → masuk sebagai Unknown.

### Fix

**Tambahkan `WHERE gender IS NOT NULL` di `core.dashboard_cache` MV:**

```sql
-- Drop dan recreate MV dengan filter tambahan
DROP MATERIALIZED VIEW IF EXISTS core.dashboard_cache;

CREATE MATERIALIZED VIEW core.dashboard_cache AS
SELECT COALESCE(gudang_branch, 'Warehouse') AS branch,
    COALESCE(tier, '3') AS tier,
    CASE
        WHEN upper(gender) = ANY (ARRAY['BABY','BOYS','GIRLS','JUNIOR','KIDS']) THEN 'Baby & Kids'
        WHEN upper(gender) = 'MEN' THEN 'Men'
        WHEN upper(gender) = 'LADIES' THEN 'Ladies'
        ELSE COALESCE(gender, 'Unknown')
    END AS gender_group,
    series, gudang_category AS category,
    kode_besar, kode, kode_mix, COALESCE(article, '') AS article,
    tipe, nama_gudang,
    COALESCE(NULLIF(TRIM(group_warna), ''), 'OTHER') AS group_warna,
    COALESCE(NULLIF(TRIM(size), ''), NULLIF(TRIM(ukuran), '')) AS ukuran,
    v, source_entity,
    sum(quantity) AS pairs,
    sum(quantity::numeric * COALESCE(rsp, 0)) AS est_rsp,
    max(snapshot_date) AS snapshot_date
FROM core.stock_with_product
WHERE gender IS NOT NULL  -- hanya tampilkan produk Zuma yg ada di dim_product
  AND upper(COALESCE(article, '')) !~~ '%SHOPPING BAG%'
  AND upper(COALESCE(article, '')) !~~ '%HANGER%'
  AND upper(COALESCE(article, '')) !~~ '%PAPER BAG%'
  AND upper(COALESCE(article, '')) !~~ '%THERMAL%'
  AND upper(COALESCE(article, '')) !~~ '%BOX LUCA%'
GROUP BY gudang_branch, tier, gender, series, gudang_category, kode_besar, kode, kode_mix,
         article, tipe, nama_gudang, group_warna, size, ukuran, v, source_entity;
```

**Kenapa `gender IS NOT NULL` aman:** Semua produk Zuma di `dim_product` memiliki gender (diverifikasi: 0 rows dengan NULL gender). Item non-Zuma tidak ada di `dim_product` → gender NULL → tereksklusi otomatis.

### Verifikasi

```sql
SELECT gender_group, SUM(pairs) as pairs
FROM core.dashboard_cache
WHERE branch NOT IN ('Warehouse', 'Online')
GROUP BY gender_group ORDER BY pairs DESC;
-- Expected: hanya Baby & Kids, Ladies, Men (no Unknown)
```

---

## Checklist Rutin Setelah Update Data

Setelah selesai update `raw.accurate_stock_*`:

```sql
-- 1. Refresh MV utama dashboard
REFRESH MATERIALIZED VIEW core.dashboard_cache;

-- 2. (Opsional) Refresh MV lainnya jika perlu
REFRESH MATERIALIZED VIEW mart.sales_stock_ratio;
REFRESH MATERIALIZED VIEW mart.mv_accurate_summary;

-- 3. Verifikasi data masuk
SELECT COUNT(*), SUM(quantity) FROM core.stock_with_product;
SELECT COUNT(*), SUM(pairs), MAX(snapshot_date) FROM core.dashboard_cache;
```

---

## Koneksi DB

```
host:     76.13.194.120:5432
database: openclaw_ops
user:     openclaw_app
password: (lihat .env.local)
```

SSH untuk operasi postgres-owner:
```bash
ssh root@76.13.194.120 "sudo -u postgres psql -d openclaw_ops -c 'SQL_DISINI'"
```

---

## Deploy

```bash
# Deploy ke Vercel production
cd /Users/database-zuma/zuma-stock-dashboard
npx vercel --prod --yes --token=<TOKEN>

# Live URL
# https://zuma-stock-dashboard.vercel.app
```

---

*Last updated: 2026-02-27 — Issue #1 (Branch hilang) + Issue #2 (Gender Unknown) keduanya RESOLVED*
