"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, bahanKeluar as apiBahanKeluar, Bahan } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

export default function BahanKeluarPage() {
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

  // Cek apakah ada item yg melebihi stok
  const overStockItems = filledItems.filter(
    (b) => Number(qtys[b.id_bahan]) > b.stok_gudang
  );

  const canSave = user && filledItems.length > 0 && overStockItems.length === 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const items = filledItems.map((b) => ({
        id_bahan: b.id_bahan,
        qty: Number(qtys[b.id_bahan]),
      }));
      const result = await apiBahanKeluar(user, items);
      addToast("success", `${items.length} bahan keluar berhasil disimpan`, result.ref_no);
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
        <h1 className="text-2xl font-bold text-stone-800">Bahan Keluar</h1>
        <p className="text-stone-500 text-sm mt-1">
          Isi qty untuk bahan yang keluar secara manual. Kosongkan kolom yang tidak perlu.
        </p>
      </div>

      {/* User picker & action bar */}
      <div className="card px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <UserPicker value={user} onChange={setUser} />
        <div className="flex items-center gap-3">
          {overStockItems.length > 0 && (
            <span className="text-sm text-red-500 font-medium">
              {overStockItems.length} item melebihi stok
            </span>
          )}
          {filledItems.length > 0 && overStockItems.length === 0 && (
            <span className="text-sm text-stone-500">
              <span className="font-semibold text-red-500">{filledItems.length}</span> item
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
                  <th className="text-right px-4 py-3 font-semibold w-36">Qty Keluar</th>
                </tr>
              </thead>
              <tbody>
                {bahan.map((b, i) => {
                  const val = qtys[b.id_bahan] || "";
                  const hasVal = val !== "" && Number(val) > 0;
                  const isOver = hasVal && Number(val) > b.stok_gudang;
                  return (
                    <tr
                      key={b.id_bahan}
                      className={`border-b border-stone-50 transition-colors ${
                        isOver
                          ? "bg-red-50/70"
                          : hasVal
                          ? "bg-orange-50/50"
                          : i % 2 === 1
                          ? "bg-stone-50/40 hover:bg-stone-50"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {b.nama_bahan}
                        {hasVal && !isOver && (
                          <span className="ml-2 text-xs text-orange-600 font-semibold">
                            −{Number(val).toLocaleString("id-ID")}
                          </span>
                        )}
                        {isOver && (
                          <span className="ml-2 text-xs text-red-600 font-semibold">
                            ⚠ melebihi stok
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-stone-500">{b.satuan}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          b.stok_gudang < b.minimum_stok ? "text-red-500" : "text-stone-700"
                        }`}
                      >
                        {b.stok_gudang.toLocaleString("id-ID")}
                        {hasVal && !isOver && (
                          <span className="ml-1 text-stone-400 font-normal">
                            → {(b.stok_gudang - Number(val)).toLocaleString("id-ID")}
                          </span>
                        )}
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
                          className={`input-number ${isOver ? "border-red-400 bg-red-50" : ""}`}
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
