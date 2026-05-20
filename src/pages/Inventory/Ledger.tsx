import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getRecentTransactions, StockTransaction } from "../../firebase/inventory";

export default function InventoryLedger() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await getRecentTransactions(50);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'IN': return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case 'OUT': return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case 'ADJUSTMENT': return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <PageMeta
        title="د موجودۍ لېجر | Kandahar University WMS"
        description="د ګودام د راکړې ورکړې لېجر"
      />
      <Breadcrumb pageTitle="د موجودۍ لېجر / لجر موجودی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 text-right">
            د راکړې ورکړې تاریخچه / تاریخچه تراکنش‌ها
          </h3>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-gray-800">
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">نیټه (شمسي)</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">د جنس نوم</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">ډول</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">مقدار</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">مخکې/وروسته</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">ترسره کوونکی</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">علت</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">بارول...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">هیڅ ریکارډ ونه موندل شو.</td>
                </tr>
              ) : (
                transactions.map((t, idx) => (
                  <tr key={t.id || idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-sm text-right">{t.createdAtHijriShamsi}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right font-medium">{t.itemName}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getBadgeClass(t.type)}`}>
                        {t.type === 'IN' ? 'داخل' : t.type === 'OUT' ? 'خارج' : 'اصلاح'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{t.quantity} {t.unit}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-500 text-xs text-right">
                      {t.stockBefore} → {t.stockAfter}
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{t.performedByName}</td>
                    <td className="px-4 py-4 text-gray-500 dark:text-gray-500 text-sm text-right max-w-[200px] truncate" title={t.reason}>
                      {t.reason}
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
