"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, koreksiStok as apiKoreksiStok, Bahan, Resep } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

type Tab = "bahan" | "resep";

export default function KoreksiPage() {
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [resep, setResep] = useState<Resep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [tab, setTab] = useState<Tab>("bahan");
  const [deltas, setDeltas] = useState<Record<string, string>>({});
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    getMasterData()
      .then((d) => {
        setBahan(d.bahan);
        setResep(d.resep);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setDeltas({});
  };

  const filledItems =
    tab === "bahan"
      ? bahan.filter((b) => deltas[b.id_bahan] !== undefined && deltas[b.id_bahan] !== "" && Number(deltas[b.id_bahan]) !== 0)
      : resep.filter((r) => deltas[r.id_resep] !== undefined && deltas[r.id_resep] !== "" && Number(deltas[r.id_resep]) !== 0);

  const canSave = user && filledItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const tipe = tab === "bahan" ? "koreksi_bahan" : "koreksi_resep";
      const items =
        tab === "bahan"
          ? bahan
              .filter((b) => deltas[b.id_bahan] !== undefined && deltas[b.id_bahan] !== "" && Number(deltas[b.id_bahan]) !== 0)
              .map((b) => ({ id: b.id_bahan, delta: Number(deltas[b.id_bahan]) }))
          : resep
              .filter((r) => deltas[r.id_resep] !== undefined && deltas[r.id_resep] !== "" && Number(deltas[r.id_resep]) !== 0)
              .map((r) => ({ id: r.id_resep, delta: Number(deltas[r.id_resep]) }));

      const result = await apiKoreksiStok(user, tipe, items);
      addToast("success", `${items.length} koreksi berhasil disimpan`, result.ref_no);
      setDeltas({});
      const fresh = await getMasterData();
      setBahan(fresh.bahan);
      setResep(fresh.resep);
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
          Masukkan delta (+/-) untuk koreksi stok. Nilai positif menambah, negatif mengurangi.
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

      {/* Tab Switcher */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => handleTabChange("bahan")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "bahan"
                ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Koreksi Bahan
          </button>
          <button
            onClick={() => handleTabChange("resep")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "resep"
                ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Koreksi Resepan
          </button>
        </div>

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
                  <th className="text-left px-4 py-3 font-semibold">
                    {tab === "bahan" ? "Nama Bahan" : "Nama Resep"}
                  </th>
                  {tab === "bahan" && (
                    <th className="text-center px-4 py-3 font-semibold">Satuan</th>
                  )}
                  <th className="text-right px-4 py-3 font-semibold">Stok Saat Ini</th>
                  <th className="text-right px-4 py-3 font-semibold w-36">Delta (+/-)</th>
                  <th className="text-right px-4 py-3 font-semibold">Setelah</th>
                </tr>
              </thead>
              <tbody>
                {tab === "bahan"
                  ? bahan.map((item, i) => {
                      const id = item.id_bahan;
                      const val = deltas[id] ?? "";
                      const delta = val !== "" ? Number(val) : 0;
                      const afterStok = item.stok_gudang + delta;
                      const hasVal = val !== "" && delta !== 0;
                      return (
                        <tr
                          key={id}
                          className={`border-b border-stone-50 transition-colors ${
                            hasVal
                              ? delta > 0 ? "bg-emerald-50/50" : "bg-red-50/40"
                              : i % 2 === 1 ? "bg-stone-50/40 hover:bg-stone-50" : "hover:bg-stone-50/60"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-stone-800">{item.nama_bahan}</td>
                          <td className="px-4 py-3 text-center text-stone-500">{item.satuan}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-stone-700">
                            {item.stok_gudang.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              placeholder="0"
                              value={val}
                              onChange={(e) => setDeltas((prev) => ({ ...prev, [id]: e.target.value }))}
                              className={`input-number ${
                                delta > 0 ? "border-emerald-300 text-emerald-700 focus:ring-emerald-400"
                                : delta < 0 ? "border-red-300 text-red-700 focus:ring-red-400" : ""
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {hasVal ? (
                              <span className={`font-bold text-sm ${
                                afterStok < 0 ? "text-red-600" : delta > 0 ? "text-emerald-600" : "text-stone-700"
                              }`}>
                                {afterStok.toLocaleString("id-ID")}
                              </span>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  : resep.map((item, i) => {
                      const id = item.id_resep;
                      const val = deltas[id] ?? "";
                      const delta = val !== "" ? Number(val) : 0;
                      const afterStok = item.stok_resepan + delta;
                      const hasVal = val !== "" && delta !== 0;
                      return (
                        <tr
                          key={id}
                          className={`border-b border-stone-50 transition-colors ${
                            hasVal
                              ? delta > 0 ? "bg-emerald-50/50" : "bg-red-50/40"
                              : i % 2 === 1 ? "bg-stone-50/40 hover:bg-stone-50" : "hover:bg-stone-50/60"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-stone-800">{item.nama_resep}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-stone-700">
                            {item.stok_resepan.toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              placeholder="0"
                              value={val}
                              onChange={(e) => setDeltas((prev) => ({ ...prev, [id]: e.target.value }))}
                              className={`input-number ${
                                delta > 0 ? "border-emerald-300 text-emerald-700 focus:ring-emerald-400"
                                : delta < 0 ? "border-red-300 text-red-700 focus:ring-red-400" : ""
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {hasVal ? (
                              <span className={`font-bold text-sm ${
                                afterStok < 0 ? "text-red-600" : delta > 0 ? "text-emerald-600" : "text-stone-700"
                              }`}>
                                {afterStok.toLocaleString("id-ID")}
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