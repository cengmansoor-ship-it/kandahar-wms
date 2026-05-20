import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { safeSortByCreatedAt } from "../../firebase/safeQuery";

export default function WarehouseRequestList() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    const all = await getRequests();
    // Filter for requests at Warehouse stages
    const filtered = all.filter(r => 
      ['StockAvailable', 'ReceiptReportCreated', 'ReceivedToInventory', 'FS5Created', 'Delivered'].includes(r.status)
    );
    setRequests(safeSortByCreatedAt(filtered));
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'StockAvailable': return "bg-blue-100 text-blue-700";
      case 'ReceiptReportCreated': return "bg-orange-100 text-orange-700";
      case 'FS5Created': return "bg-purple-100 text-purple-700";
      case 'Delivered': return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <PageMeta title="ګودام ته سپارل شوې غوښتنې | Kandahar University WMS" description="د ګودام د ترلاسه کولو او سپارلو مدیریت" />
      <Breadcrumb pageTitle="ګودام ته سپارل شوې غوښتنې / لیست گدام" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">د سپارلو او ویش مدیریت</h3>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-gray-800">
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">نیټه</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">پوهنځی / غوښتونکی</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">حالت</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">پرمختګ</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">عمل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 italic text-gray-400">بارول...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">هیڅ غوښتنه نشته.</td></tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4 text-xs text-gray-700 dark:text-gray-400 text-right">{r.createdAtHijriShamsi}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-gray-800 dark:text-white/90">{r.faculty}</div>
                      <div className="text-xs text-gray-500">{r.requesterName}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 ml-auto">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${r.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500">{r.progress}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/receiving/details/${r.id}`} className="text-primary text-sm font-bold hover:underline">مدیریت</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
