import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getFullCollection } from "../../firebase/reports";
import Button from "../../components/ui/button/Button";

export default function DepartmentReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const assignments = await getFullCollection("item_assignments");
    
    // Group by department
    const departments: Record<string, any> = {};
    assignments.forEach((a: any) => {
      const d = a.departmentName || "نامعلوم";
      if (!departments[d]) departments[d] = { name: d, faculty: a.facultyName, count: 0 };
      departments[d].count += Number(a.quantity || 0);
    });

    setData(Object.values(departments));
    setLoading(false);
  };

  const handlePrint = () => window.print();

  return (
    <>
      <PageMeta title="د ډیپارټمنټ راپور | Kandahar University WMS" description="د پوهنتون په ډیپارټمنټونو کې د اجناسو د ویش وضعیت." />
      <Breadcrumb pageTitle="د ډیپارټمنټ راپور / گزارش دیپارتمنت" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د ډیپارټمنټونو په کچه د اجناسو ویش</h3>
          <Button variant="outline" size="sm" onClick={handlePrint}>🖨️ چاپ</Button>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right table-auto border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-3 border">ډیپارټمنټ</th>
                <th className="px-4 py-3 border">پوهنځی</th>
                <th className="px-4 py-3 border">مجموعي اجناس</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((d, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-2 border font-bold text-gray-800 dark:text-white/90">{d.name}</td>
                  <td className="px-4 py-2 border text-xs">{d.faculty}</td>
                  <td className="px-4 py-2 border font-black text-primary">{d.count} واحد</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
