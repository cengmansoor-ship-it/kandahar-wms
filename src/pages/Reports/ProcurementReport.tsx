import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getProcurementReport, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function ProcurementReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const rows = await getProcurementReport();
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(p => ({
      'د غوښتنې کود': p.request_tracking_id || "",
      'حالت': p.status || "",
      'PO نمبر': p.po_number || "نشته",
      'ګټونکی شرکت': p.vendor_name || 'نشته',
      'مجموعي قیمت': p.total_amount || 0,
      'نیټه': p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
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
                <th className="px-4 py-3 border">د غوښتنې کود</th>
                <th className="px-4 py-3 border">حالت</th>
                <th className="px-4 py-3 border">PO نمبر</th>
                <th className="px-4 py-3 border">ګټونکی شرکت</th>
                <th className="px-4 py-3 border">مجموعي قیمت (افغاني)</th>
                <th className="px-4 py-3 border">نیټه</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((p, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border text-xs text-gray-500">{p.request_tracking_id}</td>
                  <td className="px-4 py-2 border text-xs">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{p.status}</span>
                  </td>
                  <td className="px-4 py-2 border text-xs">{p.po_number || "—"}</td>
                  <td className="px-4 py-2 border text-green-600 font-bold">{p.vendor_name || "—"}</td>
                  <td className="px-4 py-2 border font-bold text-primary">{Number(p.total_amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-2 border text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
