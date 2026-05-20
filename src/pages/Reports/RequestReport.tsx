import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getRequestReport, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'انتظار',
  CONFIRMED: 'تایید شوی',
  SENT_TO_PROCUREMENT: 'تدارکاتو ته',
  READY_FOR_DELIVERY: 'د تسلیم لپاره',
  DELIVERED: 'سپارل شوی',
  COMPLETED: 'بشپړ',
  REJECTED: 'رد شوی',
};

export default function RequestReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rows = await getRequestReport();
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(r => ({
      'د تعقیب کود': r.tracking_id || "",
      'غوښتونکی': r.person_name || r.requesterName || "",
      'پوهنځی': r.faculty_name || r.faculty || "",
      'ډیپارټمنټ': r.department_name || r.department || "",
      'حالت': STATUS_LABELS[r.status] || r.status || "",
      'درجه': r.request_level || "",
      'پرمختګ': r.progress_percent ?? r.progress ?? 0,
      'نیټه': r.created_at ? new Date(r.created_at).toLocaleDateString() : (r.createdAtHijriShamsi || ""),
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
                <th className="px-4 py-3 border">کود</th>
                <th className="px-4 py-3 border">غوښتونکی</th>
                <th className="px-4 py-3 border">پوهنځی</th>
                <th className="px-4 py-3 border">درجه</th>
                <th className="px-4 py-3 border">حالت</th>
                <th className="px-4 py-3 border">پرمختګ</th>
                <th className="px-4 py-3 border">نیټه</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((r, i) => {
                const progress = r.progress_percent ?? r.progress ?? 0;
                return (
                  <tr key={i} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2 border text-xs text-gray-500">{r.tracking_id}</td>
                    <td className="px-4 py-2 border font-bold">{r.person_name || r.requesterName}</td>
                    <td className="px-4 py-2 border text-xs">{r.faculty_name || r.faculty}</td>
                    <td className="px-4 py-2 border">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.request_level === 'URGENT' ? 'bg-red-100 text-red-700' : r.request_level === 'LOW' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                        {r.request_level === 'URGENT' ? 'بیړني' : r.request_level === 'LOW' ? 'ټیټ' : 'عادي'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      <span className="text-xs font-bold text-gray-600">{STATUS_LABELS[r.status] || r.status}</span>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 ml-auto">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-[10px]">{progress}%</span>
                    </td>
                    <td className="px-4 py-2 border text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : (r.createdAtHijriShamsi || "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
