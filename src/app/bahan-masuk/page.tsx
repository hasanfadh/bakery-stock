"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, bahanMasuk as apiBahanMasuk, Bahan } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

export default function BahanMasukPage() {
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    getMasterData()
      .then((d) => setBahan(d.bahan))
      .finally(() => setLoading(false));
  }, []);

  const filledItems = bahan.filter(
    (b) => qtys[b.id_bahan] && Number(qtys[b.id_bahan]) > 0
  );
  const canSave = user && filledItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const items = filledItems.map((b) => ({
        id_bahan: b.id_bahan,
        qty: Number(qtys[b.id_bahan]),
      }));
      const result = await apiBahanMasuk(user, items);
      addToast("success", `${items.length} bahan masuk berhasil disimpan`, result.ref_no);
      setQtys({});
      // Refresh data
      const fresh = await getMasterData();
      setBahan(fresh.bahan);
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
        <h1 className="text-2xl font-bold text-stone-800">Bahan Masuk</h1>
        <p className="text-stone-500 text-sm mt-1">
          Isi qty untuk bahan yang masuk. Kosongkan kolom yang tidak perlu.
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
              "Simpan"
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
                  <th className="text-right px-4 py-3 font-semibold">Stok Saat Ini</th>
                  <th className="text-right px-4 py-3 font-semibold w-36">Qty Masuk</th>
                </tr>
              </thead>
              <tbody>
                {bahan.map((b, i) => {
                  const val = qtys[b.id_bahan] || "";
                  const hasVal = val !== "" && Number(val) > 0;
                  return (
                    <tr
                      key={b.id_bahan}
                      className={`border-b border-stone-50 transition-colors ${
                        hasVal
                          ? "bg-amber-50/60"
                          : i % 2 === 1
                          ? "bg-stone-50/40 hover:bg-stone-50"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {b.nama_bahan}
                        {hasVal && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">
                            +{Number(val).toLocaleString("id-ID")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-stone-500">{b.satuan}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${
                        b.stok_gudang < b.minimum_stok ? "text-red-500" : "text-stone-700"
                      }`}>
                        {b.stok_gudang.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={val}
                          onChange={(e) =>
                            setQtys((prev) => ({
                              ...prev,
                              [b.id_bahan]: e.target.value,
                            }))
                          }
                          className="input-number"
                        />
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
