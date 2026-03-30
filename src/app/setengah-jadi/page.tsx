"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getSetengahJadiData, koreksiSetengahJadi, SetengahJadi } from "@/lib/api";
import UserPicker from "@/components/UserPicker";
import Toast, { useToast } from "@/components/Toast";

export default function SetengahJadiPage() {
  const [items, setItems] = useState<SetengahJadi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [deltas, setDeltas] = useState<Record<string, string>>({});
  const { toasts, addToast, removeToast } = useToast();

  const fetchData = () => {
    setLoading(true);
    return getSetengahJadiData()
      .then((d) => setItems(d.setengah_jadi))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filledItems = items.filter(
    (item) =>
      deltas[item.id_setengah_jadi] !== undefined &&
      deltas[item.id_setengah_jadi] !== "" &&
      Number(deltas[item.id_setengah_jadi]) !== 0
  );

  const canSave = user && filledItems.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = filledItems.map((item) => ({
        id: item.id_setengah_jadi,
        delta: Number(deltas[item.id_setengah_jadi]),
      }));

      const result = await koreksiSetengahJadi(user, payload);
      addToast("success", `${payload.length} koreksi berhasil disimpan`, result.ref_no);
      setDeltas({});
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
        <h1 className="text-2xl font-bold text-stone-800">Stok Setengah Jadi</h1>
        <p className="text-stone-500 text-sm mt-1">
          Masukkan delta (+/-) untuk koreksi stok setengah jadi. Nilai positif menambah, negatif mengurangi.
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
                  <th className="text-left px-4 py-3 font-semibold">Nama Produk</th>
                  <th className="text-right px-4 py-3 font-semibold">Stok Saat Ini</th>
                  <th className="text-right px-4 py-3 font-semibold w-36">Delta (+/-)</th>
                  <th className="text-right px-4 py-3 font-semibold">Setelah</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const id = item.id_setengah_jadi;
                  const val = deltas[id] ?? "";
                  const delta = val !== "" ? Number(val) : 0;
                  const afterStok = item.stok + delta;
                  const hasVal = val !== "" && delta !== 0;
                  return (
                    <tr
                      key={id}
                      className={`border-b border-stone-50 transition-colors ${
                        hasVal
                          ? delta > 0
                            ? "bg-emerald-50/50"
                            : "bg-red-50/40"
                          : i % 2 === 1
                          ? "bg-stone-50/40 hover:bg-stone-50"
                          : "hover:bg-stone-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">{item.nama}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-stone-700">
                        {item.stok.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          placeholder="0"
                          value={val}
                          onChange={(e) =>
                            setDeltas((prev) => ({ ...prev, [id]: e.target.value }))
                          }
                          className={`input-number ${
                            delta > 0
                              ? "border-emerald-300 text-emerald-700 focus:ring-emerald-400"
                              : delta < 0
                              ? "border-red-300 text-red-700 focus:ring-red-400"
                              : ""
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {hasVal ? (
                          <span
                            className={`font-bold text-sm ${
                              afterStok < 0
                                ? "text-red-600"
                                : delta > 0
                                ? "text-emerald-600"
                                : "text-stone-700"
                            }`}
                          >
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
