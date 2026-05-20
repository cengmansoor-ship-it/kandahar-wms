import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function ReceivingDeliveryReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const deliveries = await getFullCollection("deliveries");
    setData(deliveries);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(d => ({
      'ترلاسه کوونکی': d.deliveredToName,
      'نیټه': d.deliveredAtHijriShamsi,
      'اجرا کوونکی': d.deliveredByName,
      'حالت': d.status
    }));
    exportToCSV(exportData, "receiving_report");
  };

  return (
    <>
      <PageMeta title="د ترلاسه کولو او سپارلو راپور | Kandahar University WMS" description="د اجناسو د ترلاسه کولو او هغو د ویش بشپړ لړۍ." />
      <Breadcrumb pageTitle="د ترلاسه کولو او سپارلو راپور / گزارش تحویلی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د سپارل شویو اجناسو عمومي لړۍ</h3>
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
                <th className="px-4 py-3 border">ترلاسه کوونکی</th>
                <th className="px-4 py-3 border">اجرا کوونکی</th>
                <th className="px-4 py-3 border">حالت</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((d, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border text-xs">{d.deliveredAtHijriShamsi}</td>
                  <td className="px-4 py-2 border font-bold">{d.deliveredToName}</td>
                  <td className="px-4 py-2 border text-xs">{d.deliveredByName}</td>
                  <td className="px-4 py-2 border text-green-600 font-bold">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
