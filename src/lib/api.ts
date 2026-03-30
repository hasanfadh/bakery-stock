// ============================================================
// API Client - Google Apps Script
// Semua fungsi ini hanya dipanggil dari "use client" components
// ============================================================

function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL belum diset di .env.local");
  return url;
}

export interface Bahan {
  id_bahan: string;
  nama_bahan: string;
  satuan: string;
  stok_gudang: number;
  minimum_stok: number;
}

export interface Resep {
  id_resep: string;
  nama_resep: string;
  stok_resepan: number;
}

export interface BomItem {
  id_resep: string;
  nama_resep: string;
  id_bahan: string;
  nama_bahan: string;
  qty_per_resep: number;
}

export interface MasterData {
  bahan: Bahan[];
  resep: Resep[];
  bom: BomItem[];
}

// ✨ NEW: Setengah Jadi
export interface SetengahJadi {
  id_setengah_jadi: string;
  nama: string;
  stok: number;
}

export interface SetengahJadiData {
  setengah_jadi: SetengahJadi[];
}

// GET request — pakai query param, tidak perlu header khusus
async function apiGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// POST request — JANGAN kirim Content-Type: application/json
// karena akan trigger CORS preflight OPTIONS yang tidak dihandle GAS.
// Kirim sebagai plain text (body tetap JSON string), GAS baca via e.postData.contents.
async function apiPost(payload: object) {
  const res = await fetch(getApiUrl(), {
    method: "POST",
    // Tidak ada header Content-Type → browser kirim sebagai text/plain
    // → tidak trigger preflight → CORS aman
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function getMasterData(): Promise<MasterData> {
  return apiGet(`${getApiUrl()}?action=getMasterData`);
}

export async function bahanMasuk(user: string, items: { id_bahan: string; qty: number }[]) {
  return apiPost({ action: "bahanMasuk", user, items });
}

export async function resepMasuk(user: string, id_resep: string, batch: number) {
  return apiPost({ action: "resepMasuk", user, id_resep, batch });
}

export async function resepKeluar(user: string, items: { id_resep: string; batch: number }[]) {
  return apiPost({ action: "resepKeluar", user, items });
}

export async function koreksiStok(
  user: string,
  tipe: "koreksi_bahan" | "koreksi_resep",
  items: { id: string; delta: number }[]
) {
  return apiPost({ action: "koreksiStok", user, tipe, items });
}

export async function bahanKeluar(user: string, items: { id_bahan: string; qty: number }[]) {
  return apiPost({ action: "bahanKeluar", user, items });
}

// ✨ NEW: Setengah Jadi
export async function getSetengahJadiData(): Promise<SetengahJadiData> {
  return apiGet(`${getApiUrl()}?action=getSetengahJadi`);
}

export async function koreksiSetengahJadi(
  user: string,
  items: { id: string; delta: number }[]
) {
  return apiPost({ action: "koreksiSetengahJadi", user, items });
}
