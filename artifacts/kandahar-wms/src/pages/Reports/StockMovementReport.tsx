import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { exportToCSV } from "../../firebase/reports";
import { apiClient } from "../../api/apiClient";
import Button from "../../components/ui/button/Button";
import { useCalendar } from "../../context/CalendarContext";
import CurrentDateBadge from "../../components/common/CurrentDateBadge";

export default function StockMovementReport() {
  const { pickDate } = useCalendar();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ transaction_type: "", from_date: "", to_date: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.transaction_type) params.append("transaction_type", filter.transaction_type);
      if (filter.from_date) params.append("from_date", filter.from_date);
      if (filter.to_date) params.append("to_date", filter.to_date);
      const qs = params.toString();
      const rows = await apiClient.get(`/reports/stock-movement${qs ? '?' + qs : ''}`);
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const exportData = data.map(t => ({
      'جنس': t.item_name || t.itemName || "",
      'کود': t.item_code || "",
      'نوعیت': t.transaction_type === 'IN' ? 'داخلول' : t.transaction_type === 'OUT' ? 'ایستل' : 'تنظیم',
      'مقدار': t.quantity || 0,
      'مخکنۍ موجودي': t.previous_stock ?? t.stockBefore ?? 0,
      'نوې موجودي': t.new_stock ?? t.stockAfter ?? 0,
      'سرچینه': t.source_type || t.reason || "",
      'نیټه': t.created_at ? pickDate(t.createdAtHijriShamsi || "", t.createdAtHijriQamari || "", new Date(t.created_at).toLocaleDateString()) : (t.createdAtHijriShamsi || ""),
    }));
    exportToCSV(exportData, "stock_movement_report");
  };

  return (
    <>
      <PageMeta title="د اجناسو حرکت راپور | Kandahar University WMS" description="د ګودام د ټولو راکړو ورکړو تاریخچه او د اجناسو وتل او ننوتل." />
      <Breadcrumb pageTitle="د اجناسو حرکت راپور / گزارش حرکت اجناس" />
      <div className="flex justify-end mb-2" dir="rtl"><CurrentDateBadge /></div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 no-print">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">د ګودام د راکړې ورکړې تاریخچه</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={filter.transaction_type}
              onChange={e => setFilter(f => ({ ...f, transaction_type: e.target.value }))}
            >
              <option value="">ټول ډولونه</option>
              <option value="IN">داخلول</option>
              <option value="OUT">ایستل</option>
              <option value="ADJUSTMENT">تنظیم</option>
            </select>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={filter.from_date}
              onChange={e => setFilter(f => ({ ...f, from_date: e.target.value }))}
            />
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={filter.to_date}
              onChange={e => setFilter(f => ({ ...f, to_date: e.target.value }))}
            />
            <Button variant="outline" size="sm" onClick={fetchData}>فلټر</Button>
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
                <th className="px-4 py-3 border">کود</th>
                <th className="px-4 py-3 border">نوعیت</th>
                <th className="px-4 py-3 border">مقدار</th>
                <th className="px-4 py-3 border">مخکنۍ موجودي</th>
                <th className="px-4 py-3 border">نوې موجودي</th>
                <th className="px-4 py-3 border">سرچینه</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10">بارول...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10">معلومات نشته.</td></tr>
              ) : data.map((t, i) => {
                const type = t.transaction_type || t.type;
                return (
                  <tr key={i} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2 border text-xs">{t.created_at ? pickDate(t.createdAtHijriShamsi || "", t.createdAtHijriQamari || "", new Date(t.created_at).toLocaleDateString()) : (t.createdAtHijriShamsi || "")}</td>
                    <td className="px-4 py-2 border font-bold">{t.item_name || t.itemName}</td>
                    <td className="px-4 py-2 border text-xs text-gray-500">{t.item_code}</td>
                    <td className="px-4 py-2 border">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${type === 'IN' ? 'bg-green-100 text-green-700' : type === 'OUT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {type === 'IN' ? 'داخلول' : type === 'OUT' ? 'ایستل' : 'تنظیم'}
                      </span>
                    </td>
                    <td className="px-4 py-2 border font-bold text-center">{t.quantity}</td>
                    <td className="px-4 py-2 border text-center">{t.previous_stock ?? t.stockBefore}</td>
                    <td className="px-4 py-2 border text-center font-bold">{t.new_stock ?? t.stockAfter}</td>
                    <td className="px-4 py-2 border text-xs text-gray-500">{t.source_type || t.reason}</td>
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
