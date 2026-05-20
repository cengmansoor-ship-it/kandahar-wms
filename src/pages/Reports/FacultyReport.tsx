import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection, exportToCSV } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function FacultyReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const assignments = await getFullCollection("item_assignments");
    
    // Group by faculty
    const faculties: Record<string, any> = {};
    assignments.forEach((a: any) => {
      const f = a.facultyName || "نامعلوم";
      if (!faculties[f]) faculties[f] = { name: f, count: 0, items: [] };
      faculties[f].count += Number(a.quantity || 0);
      faculties[f].items.push(a.itemName);
    });

    setData(Object.values(faculties));
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(f => ({
      'پوهنځی': f.name,
      'مجموعي اجناس': f.count
    }));
    exportToCSV(exportData, "faculty_report");
  };

  return (
    <>
      <PageMeta title="د پوهنځي راپور | Kandahar University WMS" description="د پوهنتون په پوهنځیو کې د اجناسو د ویش مجموعي راپور." />
      <Breadcrumb pageTitle="د پوهنځي راپور / گزارش پوهنځی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د پوهنځیو په کچه د اجناسو ویش</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExport}>📊 اکسل</Button>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">پوهنځی</th>
                <th className="px-4 py-3 border">مجموعي سپارل شوي اجناس</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((f, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border font-bold text-gray-800 dark:text-white/90">{f.name}</td>
                  <td className="px-4 py-2 border font-black text-primary">{f.count} واحد</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
