import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function AuditActivityReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const logs = await getFullCollection("audit_logs");
    setData(logs);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(l => ({
      'نیټه': l.timestampHijriShamsi,
      'کاروونکی': l.userName,
      'رول': l.userRole,
      'عمل': l.action,
      'جزیات': JSON.stringify(l.details || {})
    }));
    exportToCSV(exportData, "audit_report");
  };

  return (
    <>
      <PageMeta title="د سیسټم فعالیتونه | Kandahar University WMS" description="د سیسټم د ټولو امنیتي او کاري فعالیتونو تاریخچه (Audit Log)." />
      <Breadcrumb pageTitle="د سیسټم فعالیتونه / فعالیتهای سیستم" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د سیسټم د فعالیتونو تاریخچه (Audit Log)</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>📊 اکسل</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">نیټه</th>
                <th className="px-4 py-3 border">کاروونکی</th>
                <th className="px-4 py-3 border">رول</th>
                <th className="px-4 py-3 border">عمل</th>
                <th className="px-4 py-3 border">جزیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((l, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border whitespace-nowrap">{l.timestampHijriShamsi || l.createdAtHijriShamsi}</td>
                  <td className="px-4 py-2 border font-bold">{l.userName}</td>
                  <td className="px-4 py-2 border text-gray-500">{l.userRole}</td>
                  <td className="px-4 py-2 border font-bold text-primary">{l.action}</td>
                  <td className="px-4 py-2 border max-w-xs truncate">{JSON.stringify(l.details || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
