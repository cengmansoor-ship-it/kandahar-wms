import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";

interface TrashRecord {
  id: number;
  table: string;
  type: string;
  label: string;
  deleted_at: string | null;
  deleted_by_name: string | null;
  delete_reason: string | null;
}

function daysRemaining(deletedAt: string | null): number | null {
  if (!deletedAt) return null;
  const deleted = new Date(deletedAt).getTime();
  const expiry = deleted + 30 * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
  return remaining;
}

function Daysbadge({ deletedAt }: { deletedAt: string | null }) {
  const days = daysRemaining(deletedAt);
  if (days === null) return <span className="text-gray-400 text-xs">—</span>;
  if (days <= 0) return <span className="inline-block rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs px-2 py-0.5 font-semibold">ختم</span>;
  if (days <= 7) return <span className="inline-block rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs px-2 py-0.5 font-semibold">{days} ورځې</span>;
  return <span className="inline-block rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-xs px-2 py-0.5">{days} ورځې</span>;
}

export default function TrashList() {
  const [records, setRecords] = useState<TrashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TrashRecord | null>(null);

  useEffect(() => { fetchTrash(); }, []);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trash");
      const json = await res.json();
      if (json.success) setRecords(json.data || []);
      else throw new Error(json.message);
    } catch (e: any) {
      setMsg({ text: "د ویستنې معلومات ترلاسه نشول: " + e.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleRestore = async (r: TrashRecord) => {
    const reason = window.prompt("د بیا راوستلو دلیل ولیکئ:");
    if (!reason) return;
    setActionId(`restore-${r.table}-${r.id}`);
    try {
      const res = await fetch(`/api/trash/${r.table}/${r.id}/restore`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showMsg("ریکارډ بریالیتوب سره بیا راوستل شو.", true);
      await fetchTrash();
    } catch (e: any) {
      showMsg("د بیا راوستلو پر مهال تېروتنه: " + e.message, false);
    } finally {
      setActionId(null);
    }
  };

  const handlePermanentDelete = async (r: TrashRecord) => {
    setConfirmDelete(null);
    setActionId(`del-${r.table}-${r.id}`);
    try {
      const res = await fetch(`/api/trash/${r.table}/${r.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showMsg("ریکارډ تل لپاره حذف شو.", true);
      await fetchTrash();
    } catch (e: any) {
      showMsg("د حذف پر مهال تېروتنه: " + e.message, false);
    } finally {
      setActionId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q) ||
      (r.deleted_by_name || "").toLowerCase().includes(q) ||
      (r.delete_reason || "").toLowerCase().includes(q)
    );
  }, [records, search]);

  return (
    <>
      <PageMeta title="کثافاتو دانۍ | Kandahar University WMS" description="ټول حذف شوي ریکارډونه" />
      <Breadcrumb pageTitle="کثافاتو دانۍ / Trash" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]" dir="rtl">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">🗑️ کثافاتو دانۍ</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
              د ۳۰ ورځو وروسته تل لپاره حذف کیږي
            </span>
            <button
              onClick={fetchTrash}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition"
            >
              تازه کول
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mb-4 rounded-lg border p-3 text-sm ${msg.ok
            ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="لټون..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-right text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
          {search && <p className="mt-1 text-xs text-gray-400">{filtered.length} پایله</p>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">ډول</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">نوم / لیبل</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">حذف کوونکی</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">د حذف نیټه</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">پاتې ورځې</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">دلیل</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">عمل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">بارول...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    {search ? `"${search}" لپاره هیڅ حذف شوی ریکارډ ونه موندل شو.` : "هیڅ حذف شوي معلومات نشته."}
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => {
                  const days = daysRemaining(r.deleted_at);
                  const isExpiring = days !== null && days <= 7;
                  return (
                    <tr key={i}
                      className={`border-b border-gray-100 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-white/[0.02] ${isExpiring ? "bg-orange-50/40 dark:bg-orange-900/10" : ""}`}>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800">
                        <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">{r.type}</span>
                      </td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 font-medium">{r.label}</td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs">{r.deleted_by_name || "—"}</td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-xs text-gray-500 whitespace-nowrap">
                        {r.deleted_at ? new Date(r.deleted_at).toLocaleDateString("fa-AF") : "—"}
                      </td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-center">
                        <Daysbadge deletedAt={r.deleted_at} />
                      </td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-xs italic text-gray-400 max-w-[160px] truncate">{r.delete_reason || "—"}</td>
                      <td className="px-4 py-3 border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleRestore(r)}
                            disabled={actionId === `restore-${r.table}-${r.id}`}
                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition"
                          >
                            {actionId === `restore-${r.table}-${r.id}` ? "..." : "↩ بیا راوستل"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r)}
                            disabled={actionId === `del-${r.table}-${r.id}`}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition"
                          >
                            {actionId === `del-${r.table}-${r.id}` ? "..." : "🗑 تل حذف"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {records.length > 0 && !loading && (
          <p className="mt-3 text-xs text-gray-400 text-left">
            ټول {records.length} حذف شوي ریکارډونه — د ۳۰ ورځو وروسته تل لپاره حذف کیږي
          </p>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4" dir="rtl">
            <h4 className="text-base font-bold text-gray-800 dark:text-white mb-2">⚠️ تل لپاره حذف کول</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              ایا ډاډه یاست چې <span className="font-semibold text-red-600">«{confirmDelete.label}»</span> تل لپاره حذف کړئ؟
            </p>
            <p className="text-xs text-red-500 mb-5">دا عمل د بیرته راګرځولو وړ نه دی.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 text-sm transition"
              >
                لغوه
              </button>
              <button
                onClick={() => handlePermanentDelete(confirmDelete)}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition"
              >
                هو، تل حذف کړه
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
