# 🥐 Bakery Stock — Panduan Deploy

Sistem manajemen stok dapur bakery internal.
Stack: Next.js 14 (App Router) + Tailwind CSS + Google Apps Script + Google Sheets.

---

## 📋 Struktur File

```
bakery-stock/
├── Code.gs                          ← Backend (upload ke Google Apps Script)
├── .env.local.example               ← Template environment variable
├── src/
│   ├── app/
│   │   ├── layout.tsx               ← Root layout & navbar
│   │   ├── page.tsx                 ← Halaman: Cek Stok
│   │   ├── bahan-masuk/page.tsx     ← Halaman: Bahan Masuk
│   │   ├── resep-masuk/page.tsx     ← Halaman: Resep Masuk
│   │   ├── resep-keluar/page.tsx    ← Halaman: Resep Keluar
│   │   └── koreksi/page.tsx         ← Halaman: Koreksi Stok
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── UserPicker.tsx
│   │   └── Toast.tsx
│   └── lib/
│       └── api.ts                   ← API client functions
└── ...config files
```

---

## 🗂️ Step 1 — Setup Google Sheets

Buat spreadsheet baru di Google Sheets dengan 4 sheet:

### Sheet: `Master_Bahan`
| id_bahan | nama_bahan | satuan | stok_gudang | minimum_stok |
|----------|------------|--------|-------------|--------------|
| B001 | Tepung Terigu | kg | 50 | 20 |
| B002 | Gula Pasir | kg | 30 | 10 |

### Sheet: `Master_Resep`
| id_resep | nama_resep | stok_resepan |
|----------|------------|--------------|
| R001 | Croissant | 0 |
| R002 | Pain au Chocolat | 0 |

### Sheet: `BOM_Resep`
| id_resep | nama_resep | id_bahan | nama_bahan | qty_per_resep |
|----------|------------|----------|------------|---------------|
| R001 | Croissant | B001 | Tepung Terigu | 0.5 |
| R001 | Croissant | B002 | Gula Pasir | 0.1 |

### Sheet: `Log_Transaksi`
| tanggal | tipe | id_item | qty | user | ref_no |
|---------|------|---------|-----|------|--------|
*(biarkan kosong, diisi otomatis oleh sistem)*

> ⚠️ **Penting:** Nama sheet harus **persis sama** dengan di atas (case-sensitive).

---

## ⚙️ Step 2 — Deploy Google Apps Script

1. Buka spreadsheet → klik menu **Extensions** → **Apps Script**
2. Hapus semua kode default yang ada di `Code.gs`
3. Copy-paste seluruh isi file `Code.gs` dari project ini
4. Klik **Save** (ikon floppy disk atau Ctrl+S)
5. Klik tombol **Deploy** → **New deployment**
6. Pada dialog deployment:
   - **Type**: Web app
   - **Description**: `v1` (atau bebas)
   - **Execute as**: `Me` (akun Google Anda)
   - **Who has access**: `Anyone`
7. Klik **Deploy**
8. Jika diminta izin akses → klik **Authorize access** → pilih akun → klik **Allow**
9. **Copy URL** yang muncul — format: `https://script.google.com/macros/s/XXXXX/exec`

> 💡 **Catatan:** Setiap kali mengubah `Code.gs`, buat **New deployment** lagi (jangan edit deployment lama) agar perubahan aktif.

---

## 🔧 Step 3 — Setup Frontend Lokal

```bash
# 1. Masuk ke folder project
cd bakery-stock

# 2. Install dependencies
npm install

# 3. Buat file .env.local
cp .env.local.example .env.local
```

Edit `.env.local`, isi URL Apps Script dari Step 2:
```env
NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

```bash
# 4. Jalankan development server
npm run dev
```

Buka browser ke `http://localhost:3000`

---

## 🚀 Step 4 — Deploy ke Vercel

### Cara 1: Via GitHub (Rekomendasi)

1. Push project ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/bakery-stock.git
   git push -u origin main
   ```

2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repository GitHub tadi
4. Di bagian **Environment Variables**, tambahkan:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: URL Apps Script Anda
5. Klik **Deploy**
6. Vercel akan otomatis build dan deploy. URL production akan tersedia dalam ~2 menit.

### Cara 2: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel

# Saat ditanya environment variable, masukkan NEXT_PUBLIC_API_URL
```

---

## 🔄 Update Apps Script Setelah Perubahan

Jika Anda mengubah `Code.gs`:
1. Buka Apps Script editor
2. Paste kode baru
3. **Deploy** → **New deployment** (bukan "Manage deployments")
4. Update `NEXT_PUBLIC_API_URL` di Vercel dengan URL baru
5. Redeploy Vercel (atau push commit baru ke GitHub)

---

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| "Failed to fetch" / CORS error | Pastikan deployment Apps Script sudah di-set **Who has access: Anyone** |
| Data tidak muncul | Cek nama sheet di Sheets harus persis sama dengan konstanta di `Code.gs` |
| Stok tidak berubah | Cek kolom di Sheets dimulai dari baris 1 sebagai header, data mulai baris 2 |
| ref_no tidak urut | Normal, counter dihitung dari Log_Transaksi yang ada di Sheets |
| Error setelah update Code.gs | Selalu buat **New deployment**, bukan edit yang lama |

---

## 📱 Fitur

- **Cek Stok** — Lihat stok bahan & resepan, highlight merah jika di bawah minimum
- **Bahan Masuk** — Input qty masuk untuk beberapa bahan sekaligus
- **Resep Masuk** — Pilih resep, input batch, preview pemakaian bahan otomatis
- **Resep Keluar** — Catat resepan yang keluar/terjual
- **Koreksi Stok** — Koreksi delta (+/-) untuk bahan maupun resepan
- **UserPicker** — Pilih nama staff (Roqim, Adit, atau nama lain)
- **Toast Notifikasi** — Feedback sukses/error + ref_no transaksi
- **ref_no** — Format TRX-YYYYMMDD-XXX, unik per sesi transaksi
