import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { exportToCSV } from "../../firebase/reports";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";

export default function InventoryReport() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "items"));
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = items.map(i => ({
      'نوم': i.name,
      'کټګوري': i.category,
      'مقدار': i.currentQuantity,
      'واحد': i.unit,
      'واحد قیمت': i.unitPrice,
      'مجموعي ارزښت': (i.currentQuantity || 0) * (i.unitPrice || 0)
    }));
    exportToCSV(exportData, "inventory_report");
  };

  return (
    <>
      <PageMeta title="د موجودۍ راپور | Kandahar University WMS" description="د اجناسو لیست او ارزښت" />
      <Breadcrumb pageTitle="د موجودۍ راپور / گزارش موجودی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د اجناسو د موجودۍ راپور</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>📊 اکسل</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white/90">
                <th className="px-4 py-4 border">نوم</th>
                <th className="px-4 py-4 border">کټګوري</th>
                <th className="px-4 py-4 border">مقدار</th>
                <th className="px-4 py-4 border">واحد قیمت</th>
                <th className="px-4 py-4 border">مجموعي ارزښت</th>
                <th className="px-4 py-4 border">حالت</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">بارول...</td></tr>
              ) : items.map((item, idx) => {
                const totalValue = (item.currentQuantity || 0) * (item.unitPrice || 0);
                const isLow = (item.currentQuantity || 0) <= (item.minimumStockLevel || 0);
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    <td className="px-4 py-3 border font-bold">{item.name}</td>
                    <td className="px-4 py-3 border">{item.category}</td>
                    <td className="px-4 py-3 border font-bold">{item.currentQuantity} {item.unit}</td>
                    <td className="px-4 py-3 border">{item.unitPrice} AFN</td>
                    <td className="px-4 py-3 border font-bold">{totalValue.toLocaleString()} AFN</td>
                    <td className="px-4 py-3 border">
                      {item.currentQuantity === 0 ? (
                        <span className="text-red-600 font-bold">ختمه</span>
                      ) : isLow ? (
                        <span className="text-orange-600 font-bold">کمه</span>
                      ) : (
                        <span className="text-green-600 font-bold">عادي</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 dark:bg-gray-800 font-black">
                <td colSpan={4} className="px-4 py-4 border text-center text-gray-800 dark:text-white/90">مجموعي ارزښت:</td>
                <td colSpan={2} className="px-4 py-4 border text-primary">
                  {items.reduce((sum, i) => sum + ((i.currentQuantity || 0) * (i.unitPrice || 0)), 0).toLocaleString()} AFN
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 hidden print:block text-right border-t pt-4">
          <p className="text-sm">د کندهار پوهنتون - د ګودام مدیریت سیسټم</p>
          <p className="text-xs text-gray-500">د راپور نیټه: {new Date().toLocaleDateString('fa-AF', { calendar: 'persian' })}</p>
          <p className="text-xs text-gray-500">جوړونکی: {profile?.name} ({profile?.role})</p>
        </div>
      </div>
    </>
  );
}
