"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { getMasterData, getSetengahJadiData, MasterData, SetengahJadi } from "@/lib/api";

type Tab = "bahan" | "resep" | "setengah_jadi";

export default function HomePage() {
  const [data, setData] = useState<MasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bahan");
  const [error, setError] = useState("");

  const [sjData, setSjData] = useState<SetengahJadi[] | null>(null);
  const [sjLoading, setSjLoading] = useState(false);
  const [sjError, setSjError] = useState("");
  const [sjLoaded, setSjLoaded] = useState(false); // supaya fetch hanya sekali

  useEffect(() => {
    getMasterData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch setengah jadi hanya saat tab diklik, dan hanya sekali
  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "setengah_jadi" && !sjLoaded) {
      setSjLoading(true);
      getSetengahJadiData()
        .then((d) => {
          setSjData(d.setengah_jadi);
          setSjLoaded(true);
        })
        .catch((e) => setSjError(e.message))
        .finally(() => setSjLoading(false));
    }
  };

  const lowStockCount = data?.bahan.filter(
    (b) => b.stok_gudang < b.minimum_stok
  ).length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Cek Stok</h1>
        <p className="text-stone-500 text-sm mt-1">Status stok bahan dan resepan saat ini</p>
      </div>

      {/* Alert low stock */}
      {lowStockCount > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-red-700 text-sm font-medium">
            {lowStockCount} bahan di bawah stok minimum. Segera lakukan pengisian!
          </p>
        </div>
      )}

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
            Stok Bahan
            {data && (
              <span className="ml-2 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {data.bahan.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("resep")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "resep"
                ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Stok Resepan
            {data && (
              <span className="ml-2 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {data.resep.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("setengah_jadi")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "setengah_jadi"
                ? "text-amber-600 border-b-2 border-amber-500 bg-amber-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Setengah Jadi
            {sjData && (
              <span className="ml-2 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {sjData.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading state bahan/resep */}
        {loading && tab !== "setengah_jadi" && (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-3" />
            Memuat data…
          </div>
        )}

        {error && tab !== "setengah_jadi" && (
          <div className="p-6 text-center text-red-500 text-sm">{error}</div>
        )}

        {/* Tabel Bahan */}
        {!loading && !error && tab === "bahan" && data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Nama Bahan</th>
                  <th className="text-center px-4 py-3 font-semibold">Satuan</th>
                  <th className="text-right px-4 py-3 font-semibold">Stok Gudang</th>
                  <th className="text-right px-4 py-3 font-semibold">Min. Stok</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.bahan.map((b, i) => {
                  const isLow = b.stok_gudang < b.minimum_stok;
                  return (
                    <tr
                      key={b.id_bahan}
                      className={`border-b border-stone-50 hover:bg-amber-50/30 transition-colors ${
                        i % 2 === 1 ? "bg-stone-50/40" : ""
                      } ${isLow ? "bg-red-50/40 hover:bg-red-50/60" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-stone-800">{b.nama_bahan}</td>
                      <td className="px-4 py-3 text-center text-stone-500">{b.satuan}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${isLow ? "text-red-600" : "text-stone-800"}`}>
                        {b.stok_gudang.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-stone-400">
                        {b.minimum_stok.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="badge-low">🔴 Kurang</span>
                        ) : (
                          <span className="badge-ok">🟢 Aman</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.bahan.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                      Belum ada data bahan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabel Resep */}
        {!loading && !error && tab === "resep" && data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Nama Resep</th>
                  <th className="text-right px-4 py-3 font-semibold">Stok Resepan</th>
                </tr>
              </thead>
              <tbody>
                {data.resep.map((r, i) => (
                  <tr
                    key={r.id_resep}
                    className={`border-b border-stone-50 hover:bg-amber-50/30 transition-colors ${
                      i % 2 === 1 ? "bg-stone-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-stone-800">{r.nama_resep}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-stone-800">
                      {r.stok_resepan.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
                {data.resep.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-10 text-center text-stone-400">
                      Belum ada data resep
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabel Setengah Jadi */}
        {tab === "setengah_jadi" && (
          <>
            {sjLoading && (
              <div className="flex items-center justify-center py-16 text-stone-400">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mr-3" />
                Memuat data…
              </div>
            )}
            {sjError && (
              <div className="p-6 text-center text-red-500 text-sm">{sjError}</div>
            )}
            {!sjLoading && !sjError && sjData && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Nama Produk</th>
                      <th className="text-right px-4 py-3 font-semibold">Stok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sjData.map((item, i) => (
                      <tr
                        key={item.id_setengah_jadi}
                        className={`border-b border-stone-50 hover:bg-amber-50/30 transition-colors ${
                          i % 2 === 1 ? "bg-stone-50/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-stone-800">{item.nama}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-stone-800">
                          {item.stok.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                    {sjData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-10 text-center text-stone-400">
                          Belum ada data setengah jadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {!loading && data && (
        <p className="text-center text-xs text-stone-400 mt-4">
          Data terakhir dimuat saat halaman dibuka ·{" "}
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              getMasterData()
                .then(setData)
                .catch((e) => setError(e.message))
                .finally(() => setLoading(false));
              // Reset sj supaya re-fetch saat tab diklik lagi
              if (tab === "setengah_jadi") {
                setSjLoading(true);
                setSjLoaded(false);
                getSetengahJadiData()
                  .then((d) => { setSjData(d.setengah_jadi); setSjLoaded(true); })
                  .catch((e) => setSjError(e.message))
                  .finally(() => setSjLoading(false));
              } else {
                setSjLoaded(false);
              }
            }}
            className="text-amber-500 hover:underline"
          >
            Refresh
          </button>
        </p>
      )}
    </div>
  );
}
