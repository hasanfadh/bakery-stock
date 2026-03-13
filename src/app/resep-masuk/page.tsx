"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, resepMasuk as apiResepMasuk, Resep, BomItem, Bahan } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

export default function ResepMasukPage() {
  const [resep, setResep] = useState<Resep[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [batches, setBatches] = useState<Record<string, string>>({});
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    getMasterData()
      .then((d) => {
        setResep(d.resep);
        setBom(d.bom);
        setBahan(d.bahan);
      })
      .finally(() => setLoading(false));
  }, []);

  const filledItems = resep.filter(
    (r) => batches[r.id_resep] && Number(batches[r.id_resep]) > 0
  );
  const canSave = user && filledItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Kirim satu per satu karena tiap resepMasuk butuh BOM lookup di GAS
      const results = [];
      for (const r of filledItems) {
        const result = await apiResepMasuk(user, r.id_resep, Number(batches[r.id_resep]));
        results.push(result);
      }
      const lastRef = results[results.length - 1]?.ref_no;
      addToast("success", `${filledItems.length} resep masuk berhasil disimpan`, lastRef);
      setBatches({});
      const fresh = await getMasterData();
      setResep(fresh.resep);
      setBom(fresh.bom);
      setBahan(fresh.bahan);
    } catch (e: unknown) {
      addToast("error", e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // Hitung preview stok bahan setelah semua batch diterapkan
  const bahanPreview = (() => {
    const map: Record<string, number> = {};
    bahan.forEach((b) => (map[b.id_bahan] = b.stok_gudang));
    filledItems.forEach((r) => {
      const batch = Number(batches[r.id_resep]) || 0;
      bom
        .filter((b) => b.id_resep === r.id_resep)
        .forEach((b) => {
          map[b.id_bahan] = (map[b.id_bahan] ?? 0) - b.qty_per_resep * batch;
        });
    });
    return map;
  })();

  return (
    <div>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Resep Masuk</h1>
        <p className="text-stone-500 text-sm mt-1">
          Isi batch untuk resep yang diproduksi. Kosongkan yang tidak perlu.
        </p>
      </div>

      {/* User picker & action bar */}
      <div className="card px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <UserPicker value={user} onChange={setUser} />
        <div className="flex items-center gap-3">
          {filledItems.length > 0 && (
            <span className="text-sm text-stone-500">
              <span className="font-semibold text-amber-600">{filledItems.length}</span> resep
            </span>
          )}
          <button onClick={handleSave} disabled={!canSave} className="btn-primary flex items-center gap-2">
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

      {/* Tabel resep */}
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
                  <th className="text-left px-4 py-3 font-semibold">Nama Resep</th>
                  <th className="text-right px-4 py-3 font-semibold">Stok Resepan</th>
                  <th className="text-right px-4 py-3 font-semibold w-36">Batch Masuk</th>
                </tr>
              </thead>
              <tbody>
                {resep.map((r, i) => {
                  const val = batches[r.id_resep] || "";
                  const hasVal = val !== "" && Number(val) > 0;
                  const afterStok = r.stok_resepan + (Number(val) || 0);

                  // Cek apakah ada bahan yang tidak cukup untuk batch ini
                  const bomResep = bom.filter((b) => b.id_resep === r.id_resep);
                  const hasInsufficient = hasVal && bomResep.some(
                    (b) => bahanPreview[b.id_bahan] < 0
                  );

                  return (
                    <tr
                      key={r.id_resep}
                      className={`border-b border-stone-50 transition-colors ${
                        hasInsufficient
                          ? "bg-red-50/40"
                          : hasVal
                          ? "bg-amber-50/60"
                          : i % 2 === 1
                          ? "bg-stone-50/40 hover:bg-stone-50"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {r.nama_resep}
                        {hasVal && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">
                            +{Number(val).toLocaleString("id-ID")} batch
                          </span>
                        )}
                        {hasInsufficient && (
                          <span className="ml-2 text-xs text-red-500 font-semibold">
                            ⚠️ bahan kurang
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className="font-semibold text-stone-700">
                          {r.stok_resepan.toLocaleString("id-ID")}
                        </span>
                        {hasVal && (
                          <>
                            <span className="text-stone-300 mx-1.5">→</span>
                            <span className="font-bold text-emerald-600">
                              {afterStok.toLocaleString("id-ID")}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          placeholder="—"
                          value={val}
                          onChange={(e) =>
                            setBatches((prev) => ({
                              ...prev,
                              [r.id_resep]: e.target.value,
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

      {/* Warning bahan kurang — tampil kalau ada */}
      {filledItems.length > 0 && bahan.some((b) => bahanPreview[b.id_bahan] < b.stok_gudang) && (
        <div className="mt-4 card p-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
            Preview Pemakaian Bahan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {bahan
              .filter((b) => bahanPreview[b.id_bahan] !== b.stok_gudang)
              .map((b) => {
                const after = bahanPreview[b.id_bahan];
                const isInsufficient = after < 0;
                return (
                  <div
                    key={b.id_bahan}
                    className={`flex justify-between text-sm px-3 py-2 rounded-lg ${
                      isInsufficient ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-600"
                    }`}
                  >
                    <span>{b.nama_bahan}</span>
                    <span className="font-mono">
                      {b.stok_gudang} → <span className={`font-bold ${isInsufficient ? "text-red-600" : "text-stone-800"}`}>{after}</span>
                      <span className="ml-1 text-xs opacity-60">{b.satuan}</span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}