import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function RequestReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const requests = await getFullCollection("requests");
    setData(requests);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(r => ({
      'غوښتونکی': r.requesterName,
      'پوهنځی': r.faculty,
      'ډیپارټمنټ': r.department,
      'حالت': r.status,
      'پرمختګ': r.progress,
      'نیټه': r.createdAtHijriShamsi
    }));
    exportToCSV(exportData, "request_report");
  };

  return (
    <>
      <PageMeta title="د غوښتنو راپور | Kandahar University WMS" description="د ټولو موجودو غوښتنو د حالت او پرمختګ عمومي لړۍ." />
      <Breadcrumb pageTitle="د غوښتنو راپور / گزارش درخواست‌ها" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د ټولو غوښتنو عمومي راپور</h3>
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
                <th className="px-4 py-3 border">غوښتونکی</th>
                <th className="px-4 py-3 border">پوهنځی</th>
                <th className="px-4 py-3 border">حالت</th>
                <th className="px-4 py-3 border">پرمختګ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10">بارول...</td></tr>
              ) : data.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border text-xs">{r.createdAtHijriShamsi}</td>
                  <td className="px-4 py-2 border font-bold">{r.requesterName}</td>
                  <td className="px-4 py-2 border text-xs">{r.faculty}</td>
                  <td className="px-4 py-2 border">
                    <span className="text-xs font-bold text-gray-600">{r.status}</span>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="w-16 bg-gray-200 rounded-full h-1 ml-auto">
                      <div className="bg-primary h-1 rounded-full" style={{ width: `${r.progress}%` }}></div>
                    </div>
                    <span className="text-[10px]">{r.progress}%</span>
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
