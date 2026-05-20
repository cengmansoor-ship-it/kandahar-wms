import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { isFirebaseConfigured } from "../../firebase/firebase";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";
import { seedDemoItems, getDemoRequests, saveDemoRequests, setLocalItem, getLocalItem } from "../../firebase/localStore";
import { getCurrentHijriDates } from "../../utils/dateUtils";

interface TrashRecord {
  id: string;
  _collection: string;
  name?: string;
  deletedByName?: string;
  deletedAtHijriShamsi?: string;
  deleteReason?: string;
  [key: string]: any;
}

export default function TrashList() {
  const [deletedRecords, setDeletedRecords] = useState<TrashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const { user, profile } = useAuth();
  const actorName = profile?.name || user?.displayName || user?.email || "Demo User";

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    setLoading(true);
    let allDeleted: TrashRecord[] = [];

    if (!isFirebaseConfigured) {
      // Demo mode: collect soft-deleted items from localStorage
      const items = seedDemoItems().filter(i => i.isDeleted);
      const requests = getDemoRequests().filter((r: any) => r.isDeleted);
      const procurements = getLocalItem<any[]>("procurements", []).filter((p: any) => p.isDeleted);

      allDeleted = [
        ...items.map(i => ({ ...i, _collection: "اجناس" })),
        ...requests.map(r => ({ ...r, _collection: "غوښتنې", name: r.faculty })),
        ...procurements.map(p => ({ ...p, _collection: "تدارکات" })),
      ];
    } else {
      const collections = ["items", "requests", "procurements"];
      for (const col of collections) {
        try {
          const q = query(collection(db, col), where("isDeleted", "==", true));
          const snap = await getDocs(q);
          allDeleted = [...allDeleted, ...snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() } as TrashRecord))];
        } catch (e) {
          console.warn(`Failed to fetch deleted from ${col}:`, e);
        }
      }
    }

    setDeletedRecords(allDeleted);
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return deletedRecords;
    const q = search.toLowerCase();
    return deletedRecords.filter(r =>
      (r.name || r.id || "").toLowerCase().includes(q) ||
      (r._collection || "").toLowerCase().includes(q) ||
      (r.deletedByName || "").toLowerCase().includes(q) ||
      (r.deleteReason || "").toLowerCase().includes(q)
    );
  }, [deletedRecords, search]);

  const handleRestore = async (record: TrashRecord) => {
    if (!user || !profile) return;
    const reason = window.prompt("د بیا رغونې دلیل ولیکئ:");
    if (!reason) return;

    setRestoring(record.id);
    try {
      const dates = getCurrentHijriDates();

      if (!isFirebaseConfigured) {
        // Demo mode restore
        if (record._collection === "اجناس") {
          const items = seedDemoItems().map(i =>
            i.id === record.id ? { ...i, isDeleted: false } : i
          );
          setLocalItem("items", items);
        } else if (record._collection === "غوښتنې") {
          const requests = getDemoRequests().map((r: any) =>
            r.id === record.id ? { ...r, isDeleted: false } : r
          );
          saveDemoRequests(requests);
        } else {
          const list = getLocalItem<any[]>("procurements", []).map(p =>
            p.id === record.id ? { ...p, isDeleted: false } : p
          );
          setLocalItem("procurements", list);
        }
        setMsg("معلومات بریالیتوب سره بیا راوستل شول.");
      } else {
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, record._collection, record.id), {
          isDeleted: false,
          restoredAt: dates.timestamp,
          restoredBy: user.uid,
          restoredByName: actorName,
          restoreReason: reason,
        });
        setMsg("معلومات بریالیتوب سره بیا راوستل شول.");
      }

      await fetchDeleted();
      setTimeout(() => setMsg(""), 4000);
    } catch (e) {
      console.error("Restore error:", e);
      alert("د بیا رغونې پر مهال تېروتنه رامنځته شوه.");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <>
      <PageMeta title="حذف شوي معلومات | Kandahar University WMS" description="ټول حذف شوي ریکارډونه" />
      <Breadcrumb pageTitle="حذف شوي معلومات / معلومات حذفشده" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">🗑️ د کثافاتو دانۍ (Trash)</h3>
          <button
            onClick={fetchDeleted}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition"
          >
            تازه کول
          </button>
        </div>

        {msg && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
            {msg}
          </div>
        )}

        {/* Search */}
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
          {search && <p className="mt-1 text-xs text-gray-400">{filteredRecords.length} پایله</p>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">ډول</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">نوم / لیبل</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">حذف کوونکی</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">د حذف نیټه</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">دلیل</th>
                <th className="px-4 py-3 border border-gray-200 dark:border-gray-700 font-medium text-gray-800 dark:text-white/90">عمل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">بارول...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {search ? `"${search}" لپاره هیڅ حذف شوی ریکارډ ونه موندل شو.` : "هیڅ حذف شوي معلومات نشته."}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 font-bold text-primary">{r._collection}</td>
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800">{r.name || r.id}</td>
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">{r.deletedByName || "-"}</td>
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-xs text-gray-500">{r.deletedAtHijriShamsi || "-"}</td>
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800 text-xs italic text-gray-500">{r.deleteReason || "-"}</td>
                    <td className="px-4 py-3 border border-gray-100 dark:border-gray-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(r)}
                        disabled={restoring === r.id}
                      >
                        {restoring === r.id ? "..." : "بیا راوستل"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
