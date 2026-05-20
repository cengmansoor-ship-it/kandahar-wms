import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { getForecastForItem } from "../../firebase/reports";
import Label from "../../components/form/Label";

export default function ForecastingReport() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const snap = await getDocs(collection(db, "items"));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSelect = async (itemId: string) => {
    setSelectedItem(itemId);
    if (!itemId) {
      setForecast(null);
      return;
    }
    setLoading(true);
    const result = await getForecastForItem(itemId);
    setForecast(result);
    setLoading(false);
  };

  return (
    <>
      <PageMeta title="د وړاندوینې راپور | Kandahar University WMS" description="د اجناسو د راتلونکي اړتیاوو وړاندوینه" />
      <Breadcrumb pageTitle="د وړاندوینې راپور / گزارش پیشبینی" />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="max-w-md">
            <Label>د جنس انتخاب / انتخاب جنس:</Label>
            <select 
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-gray-700 text-right"
              onChange={(e) => handleSelect(e.target.value)}
              value={selectedItem}
            >
              <option value="">-- انتخاب کړئ --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 italic text-gray-500">تحلیل کیږي...</div>
        ) : forecast ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د میاشتني مصرف تاریخچه</h3>
                <div className="space-y-3">
                  {forecast.historical.map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{h.month}</span>
                      <span className="text-sm font-black text-primary">{h.qty}</span>
                    </div>
                  ))}
                  {forecast.historical.length === 0 && <p className="text-sm text-gray-500 text-center py-4 italic">دغه جنس تر اوسه هیڅ مصرف نه لري.</p>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د وړاندوینو پایله</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">د ۳ میاشتو اوسط (Moving Average):</p>
                    <div className="text-xl font-bold text-blue-600">{forecast.movingAverage.toFixed(2)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ایکسپوننشل سموتینګ (Exp. Smoothing):</p>
                    <div className="text-xl font-bold text-indigo-600">{forecast.expSmoothing.toFixed(2)}</div>
                  </div>
                  <div className="pt-4 border-t dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90 mb-2">د پیرودلو وړاندیز:</p>
                    <div className="p-4 bg-primary text-white rounded-xl text-center shadow-lg">
                      <div className="text-2xl font-black">{forecast.recommended}</div>
                      <div className="text-[10px] uppercase font-bold mt-1 tracking-widest">قلمه / واحد</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !selectedItem && (
          <div className="p-20 text-center text-gray-400 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            مهرباني وکړئ د تحلیل لپاره یو جنس انتخاب کړئ.
          </div>
        )}
      </div>
    </>
  );
}
