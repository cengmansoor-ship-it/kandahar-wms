import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getItems } from "../../firebase/inventory";

export default function InventoryDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const items = await getItems();
      const summary = items.reduce(
        (acc, item) => {
          acc.totalItems++;
          acc.totalQuantity += Number(item.currentQuantity) || 0;
          acc.totalValue += (Number(item.currentQuantity) || 0) * (Number(item.unitPrice) || 0);
          if (Number(item.currentQuantity) === 0) acc.outOfStock++;
          else if (Number(item.currentQuantity) <= Number(item.minimumStockLevel)) acc.lowStock++;
          return acc;
        },
        { totalItems: 0, totalQuantity: 0, totalValue: 0, lowStock: 0, outOfStock: 0 }
      );
      setStats(summary);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "ټول اجناس",
      value: stats.totalItems,
      colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      to: "/inventory/items",
      icon: (
        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.39 7.8 12 11.41 4.61 7.8 12 4.18zM4 17.5V9.41l7 3.5v8.09l-7-3.5zm9 3.5V12.91l7-3.5v8.09l-7 3.5z" />
        </svg>
      ),
    },
    {
      title: "ټوله موجوده اندازه",
      value: stats.totalQuantity,
      colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      to: "/inventory/items",
      icon: (
        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
        </svg>
      ),
    },
    {
      title: "ټول ارزښت",
      value: `${stats.totalValue.toLocaleString()} ؋`,
      colorClass: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
      to: "/reports/inventory",
      icon: (
        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      ),
    },
    {
      title: "کمه موجودي",
      value: stats.lowStock,
      colorClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      to: "/inventory/items?filter=low",
      icon: (
        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      ),
    },
    {
      title: "ختم شوي اجناس",
      value: stats.outOfStock,
      colorClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      to: "/inventory/items?filter=out",
      icon: (
        <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="د ګودام عمومي پاڼه | Kandahar University WMS" description="د موجودي عمومي ارقام" />
      <Breadcrumb pageTitle="د موجودۍ ډشبورډ / داشبورد موجودی" />

      {loading ? (
        <div className="text-center py-20 text-gray-500">بارول...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all dark:border-gray-800 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.colorClass}`}>
                    {card.icon}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</span>
                <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90 group-hover:text-primary transition-colors">{card.value}</h4>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90" dir="rtl">چټکې عملیات</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" dir="rtl">
              <Link to="/inventory/add" className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-primary hover:bg-primary/5 transition dark:border-gray-700">
                <span className="text-2xl">➕</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">جنس اضافه کول</span>
              </Link>
              <Link to="/inventory/stock-in" className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-green-400 hover:bg-green-50 transition dark:border-gray-700">
                <span className="text-2xl">📥</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">د ګدام داخل</span>
              </Link>
              <Link to="/inventory/stock-out" className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-red-400 hover:bg-red-50 transition dark:border-gray-700">
                <span className="text-2xl">📤</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">د ګدام خارج</span>
              </Link>
              <Link to="/inventory/ledger" className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:bg-blue-50 transition dark:border-gray-700">
                <span className="text-2xl">📊</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">لیجر</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
