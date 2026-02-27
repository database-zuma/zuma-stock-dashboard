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

## Issue #2 — Gender "Unknown" Tinggi (Known Issue, Belum Fix)

### Gejala
- Chart "Stock by Gender" menampilkan segmen **Unknown = ~157,863 pairs**
- Ini mewakili ~30% dari total stock

### Root Cause
Kode barang di raw tables yang **tidak ada di `dim_product`** → JOIN miss → `gender = NULL` → ditampilkan sebagai "Unknown".

```sql
-- Cek unmatched kode (non-aksesoris):
SELECT kode_barang, qty FROM (
  SELECT kode_barang, SUM(kuantitas) qty
  FROM raw.accurate_stock_ddd
  WHERE snapshot_date = (SELECT MAX(snapshot_date) FROM raw.accurate_stock_ddd)
  GROUP BY kode_barang
) x LEFT JOIN dim_product d ON lower(kode_barang) = d.kode_besar
WHERE d.kode_besar IS NULL
  AND kode_barang NOT ILIKE ANY(ARRAY['%shopbag%','%hanger%','%paperbag%','%box%','%gwp%'])
ORDER BY qty DESC;
```

**Sample kode yang unmatched (produk nyata, bukan aksesoris):**
| kode_barang | qty | keterangan |
|-------------|-----|------------|
| G2CA01Z29 | 210 | produk CA series |
| G2CA01Z31 | 168 | produk CA series |
| L2WS01Z40 | 96 | produk WS series |
| M2WS01Z42 | 96 | produk WS series |
| 100005 | 1,256 | produk tanpa kode standar |

### Fix (Belum Dikerjakan)
Perlu insert kode-kode ini ke `dim_product` dengan metadata yang benar (gender, series, tier, color). Butuh konfirmasi dari user soal data produk tersebut.

```sql
-- Template insert:
INSERT INTO dim_product (kode_besar, gender, series, tier, ...)
VALUES ('g2ca01z29', 'Ladies', 'CA', '1', ...);
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

*Last updated: 2026-02-27*
