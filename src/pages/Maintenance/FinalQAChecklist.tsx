import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getQAChecklist, updateQAChecklist, QAChecklistItem } from "../../firebase/maintenance";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";

export default function FinalQAChecklist() {
  const [items, setItems] = useState<QAChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    setLoading(true);
    const data = await getQAChecklist();
    setItems(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    if (!user || !profile) return;
    const nextStatus = currentStatus === 'Pending' ? 'Passed' : currentStatus === 'Passed' ? 'Failed' : 'Pending';
    const notes = window.prompt("یادښت ولیکئ / یادداشت بنویسید:");
    
    try {
      await updateQAChecklist(id, { status: nextStatus as any, notes: notes || "" }, { uid: user.uid, name: profile.name });
      fetchChecklist();
    } catch (e) {
      alert("تېروتنه رامنځته شوه.");
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <>
      <PageMeta title="وروستی بررسی | Kandahar University WMS" description="د سیسټم د بشپړېدو وروستی امنیتي او تخنیکي چک لیست." />
      <Breadcrumb pageTitle="وروستی بررسی / بررسی نهایی QA" />

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-20 italic">بارول...</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border">لا تر اوسه هیڅ د چک لیست ډاټا نشته.</div>
        ) : categories.map(cat => (
          <div key={cat} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">{cat}</h3>
            <div className="space-y-3">
              {items.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="font-bold text-gray-800 dark:text-white/90">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 italic">{item.notes || "یادښت نشته"}</p>
                    {item.checkedByName && (
                      <p className="text-[10px] text-primary mt-1 font-bold">
                        تایید شو د {item.checkedByName} لخوا په {item.checkedAtHijriShamsi}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Passed' ? 'bg-green-100 text-green-700' : 
                      item.status === 'Failed' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {item.status === 'Passed' ? 'کامیاب ✅' : item.status === 'Failed' ? 'ناکام ❌' : 'په تمه ⏳'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(item.id, item.status)}>تغیر</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
