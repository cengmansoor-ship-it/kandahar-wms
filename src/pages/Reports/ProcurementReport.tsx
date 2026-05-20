import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function ProcurementReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const procs = await getFullCollection("procurements") as any[];
    const comparison = await getFullCollection("comparison_records") as any[];
    
    // Merge winner info
    const merged = procs.map(p => {
      const comp = comparison.find((c: any) => c.procurementId === p.id);
      return { ...p, winner: comp?.winnerVendorName || "نشته", winnerPrice: comp?.winnerTotalPrice || 0 };
    });

    setData(merged);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(p => ({
      'غوښتونکی': p.requesterName,
      'حالت': p.status,
      'ګټونکی شرکت': p.winner || 'نشته',
      'قیمت': p.winnerPrice || 0,
      'پرمختګ': p.progress
    }));
    exportToCSV(exportData, "procurement_report");
  };

  return (
    <>
      <PageMeta title="د تدارکاتو راپور | Kandahar University WMS" description="د تدارکاتي پروسو، د نرخونو د ورکړې او د ګټونکو شرکتونو بشپړ راپور." />
      <Breadcrumb pageTitle="د تدارکاتو راپور / گزارش تدارکات" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د تدارکاتي پروسو تحلیلي راپور</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>📊 اکسل</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">غوښتونکی</th>
                <th className="px-4 py-3 border">حالت</th>
                <th className="px-4 py-3 border">ګټونکی شرکت</th>
                <th className="px-4 py-3 border">قیمت</th>
                <th className="px-4 py-3 border">پرمختګ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((p, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border font-bold">{p.requesterName}</td>
                  <td className="px-4 py-2 border text-xs">{p.status}</td>
                  <td className="px-4 py-2 border text-green-600 font-bold">{p.winner || "---"}</td>
                  <td className="px-4 py-2 border font-bold text-primary">{p.winnerPrice?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2 border">
                    <span className="text-[10px] font-bold">{p.progress}%</span>
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
