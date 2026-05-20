import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { restoreRecord } from "../../firebase/maintenance";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";

export default function TrashList() {
  const [deletedRecords, setDeletedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    setLoading(true);
    const collections = ["items", "requests", "procurements"];
    let allDeleted: any[] = [];
    
    for (const col of collections) {
      const q = query(collection(db, col), where("isDeleted", "==", true));
      const snap = await getDocs(q);
      allDeleted = [...allDeleted, ...snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }))];
    }

    setDeletedRecords(allDeleted);
    setLoading(false);
  };

  const handleRestore = async (record: any) => {
    if (!user || !profile) return;
    const reason = window.prompt("د بیا رغونې دلیل ولیکئ / دلیل بازیابی را بنویسید:");
    if (!reason) return;

    try {
      await restoreRecord(record._collection, record.id, reason, { uid: user.uid, name: profile.name, role: profile.role });
      alert("معلومات په بریالیتوب سره بېرته را وګرځول شول.");
      fetchDeleted();
    } catch (e) {
      alert("تېروتنه رامنځته شوه.");
    }
  };

  return (
    <>
      <PageMeta title="حذف شوي معلومات | Kandahar University WMS" description="د سیسټم ټول حذف شوي ریکارډونه او د هغو بېرته راګرځول." />
      <Breadcrumb pageTitle="حذف شوي معلومات / معلومات حذفشده" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-6">د کثافاتو دانۍ (Trash)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">ډول</th>
                <th className="px-4 py-3 border">نوم / لیبل</th>
                <th className="px-4 py-3 border">حذف کوونکی</th>
                <th className="px-4 py-3 border">د حذف نیټه</th>
                <th className="px-4 py-3 border">دلیل</th>
                <th className="px-4 py-3 border">عمل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">بارول...</td></tr>
              ) : deletedRecords.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">هیڅ حذف شوي معلومات نشته.</td></tr>
              ) : deletedRecords.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border font-bold text-primary">{r._collection}</td>
                  <td className="px-4 py-2 border">{r.name || r.id}</td>
                  <td className="px-4 py-2 border">{r.deletedByName}</td>
                  <td className="px-4 py-2 border text-xs">{r.deletedAtHijriShamsi}</td>
                  <td className="px-4 py-2 border text-xs italic text-gray-500">{r.deleteReason}</td>
                  <td className="px-4 py-2 border">
                    <Button variant="outline" size="sm" onClick={() => handleRestore(r)}>بېرته راګرځول</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
