import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function StockMovementReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const trans = await getFullCollection("stock_transactions");
    setData(trans);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(t => ({
      'جنس': t.itemName,
      'نوعیت': t.type,
      'مقدار': t.quantity,
      'واحد': t.unit,
      'مخکې': t.stockBefore,
      'وروسته': t.stockAfter,
      'علت': t.reason,
      'نیټه': t.createdAtHijriShamsi,
      'اجرا کوونکی': t.performedByName
    }));
    exportToCSV(exportData, "stock_movement_report");
  };

  return (
    <>
      <PageMeta title="د اجناسو حرکت راپور | Kandahar University WMS" description="د ګودام د ټولو راکړو ورکړو تاریخچه او د اجناسو وتل او ننوتل." />
      <Breadcrumb pageTitle="د اجناسو حرکت راپور / گزارش حرکت اجناس" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د ګودام د راکړې ورکړې تاریخچه</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>📊 اکسل</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">نیټه</th>
                <th className="px-4 py-3 border">جنس</th>
                <th className="px-4 py-3 border">نوعیت</th>
                <th className="px-4 py-3 border">مقدار</th>
                <th className="px-4 py-3 border">مخکې</th>
                <th className="px-4 py-3 border">وروسته</th>
                <th className="px-4 py-3 border">علت</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((t, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border text-xs">{t.createdAtHijriShamsi}</td>
                  <td className="px-4 py-2 border font-bold">{t.itemName}</td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'IN' ? 'داخلول' : 'ایستل'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border font-bold">{t.quantity}</td>
                  <td className="px-4 py-2 border">{t.stockBefore}</td>
                  <td className="px-4 py-2 border font-bold">{t.stockAfter}</td>
                  <td className="px-4 py-2 border text-xs">{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
