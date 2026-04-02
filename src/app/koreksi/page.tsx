"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, koreksiStok, Bahan } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

export default function KoreksiPage() {
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [aktual, setAktual] = useState<Record<string, string>>({});
  const { toasts, addToast, removeToast } = useToast();

  const fetchData = () => {
    setLoading(true);
    return getMasterData()
      .then((d) => setBahan(d.bahan))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Item dianggap diisi jika user sudah input angka (termasuk 0)
  const filledItems = bahan.filter(
    (b) =>
      aktual[b.id_bahan] !== undefined &&
      aktual[b.id_bahan] !== ""
  );

  const canSave = user && filledItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const items = filledItems.map((b) => ({
        id: b.id_bahan,
        aktual: Number(aktual[b.id_bahan]),
      }));

      const result = await koreksiStok(user, "koreksi_bahan", items);
      addToast("success", `${items.length} koreksi berhasil disimpan`, result.ref_no);
      setAktual({});
      await fetchData();
    } catch (e: unknown) {
      addToast("error", e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Koreksi Stok</h1>
        <p className="text-stone-500 text-sm mt-1">
          Masukkan stok aktual hasil hitung fisik. Selisih akan dihitung otomatis.
        </p>
      </div>

      {/* User picker & action bar */}
      <div className="card px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <UserPicker value={user} onChange={setUser} />
        <div className="flex items-center gap-3">
          {filledItems.length > 0 && (
            <span className="text-sm text-stone-500">
              <span className="font-semibold text-amber-600">{filledItems.length}</span> item
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan…
              </>
            ) : (
              "Simpan Koreksi"
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-3" />
            Memuat data…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Nama Bahan</th>
                  <th className="text-center px-4 py-3 font-semibold">Satuan</th>
                  <th className="text-right px-4 py-3 font-semibold">Stok Sistem</th>
                  <th className="text-right px-4 py-3 font-semibold w-36">Stok Aktual</th>
                  <th className="text-right px-4 py-3 font-semibold">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {bahan.map((item, i) => {
                  const id = item.id_bahan;
                  const val = aktual[id] ?? "";
                  const aktualNum = val !== "" ? Number(val) : null;
                  const delta = aktualNum !== null ? aktualNum - item.stok_gudang : null;
                  const hasVal = val !== "";
                  return (
                    <tr
                      key={id}
                      className={`border-b border-stone-50 transition-colors ${
                        hasVal && delta !== null
                          ? delta > 0
                            ? "bg-emerald-50/50"
                            : delta < 0
                            ? "bg-red-50/40"
                            : "bg-stone-50/40"
                          : i % 2 === 1
                          ? "bg-stone-50/40 hover:bg-stone-50"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">{item.nama_bahan}</td>
                      <td className="px-4 py-3 text-center text-stone-500">{item.satuan}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-stone-500">
                        {item.stok_gudang.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          placeholder={item.stok_gudang.toString()}
                          value={val}
                          onChange={(e) =>
                            setAktual((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className={`input-number ${
                            delta !== null && delta > 0
                              ? "border-emerald-300 text-emerald-700 focus:ring-emerald-400"
                              : delta !== null && delta < 0
                              ? "border-red-300 text-red-700 focus:ring-red-400"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {hasVal && delta !== null ? (
                          <span
                            className={`font-bold text-sm ${
                              delta > 0
                                ? "text-emerald-600"
                                : delta < 0
                                ? "text-red-600"
                                : "text-stone-400"
                            }`}
                          >
                            {delta > 0 ? "+" : ""}{delta.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
