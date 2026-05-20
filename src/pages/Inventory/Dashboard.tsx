import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getItems } from "../../firebase/inventory";

export default function InventoryDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const items = await getItems();
      const summary = items.reduce((acc, item) => {
        acc.totalItems++;
        acc.totalQuantity += item.currentQuantity;
        acc.totalValue += (item.currentQuantity * item.unitPrice);
        if (item.currentQuantity === 0) acc.outOfStock++;
        else if (item.currentQuantity <= item.minimumStockLevel) acc.lowStock++;
        return acc;
      }, { totalItems: 0, totalQuantity: 0, totalValue: 0, lowStock: 0, outOfStock: 0 });
      
      setStats(summary);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ title, value, icon, colorClass }: any) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{value}</h4>
      </div>
    </div>
  );

  return (
    <>
      <PageMeta title="د ګودام عمومي پاڼه | Kandahar University WMS" description="د موجودي عمومي ارقام" />
      <Breadcrumb pageTitle="د موجودۍ ډشبورډ / داشبورد موجودی" />

      {loading ? (
        <div className="text-center py-20">بارول...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
          <Card 
            title="ټول اجناس" 
            value={stats.totalItems} 
            colorClass="bg-blue-100 text-blue-600"
            icon={<svg className="fill-current" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.39 7.8 12 11.41 4.61 7.8 12 4.18zM4 17.5V9.41l7 3.5v8.09l-7-3.5zm9 3.5V12.91l7-3.5v8.09l-7 3.5z"/></svg>}
          />
          <Card 
            title="ټوله موجوده اندازه" 
            value={stats.totalQuantity} 
            colorClass="bg-green-100 text-green-600"
            icon={<svg className="fill-current" width="24" height="24" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>}
          />
          <Card 
            title="کمه موجودي" 
            value={stats.lowStock} 
            colorClass="bg-orange-100 text-orange-600"
            icon={<svg className="fill-current" width="24" height="24" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>}
          />
          <Card 
            title="ختم شوي اجناس" 
            value={stats.outOfStock} 
            colorClass="bg-red-100 text-red-600"
            icon={<svg className="fill-current" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>}
          />
        </div>
      )}

      {/* Placeholder for Category breakdown or Faculty breakdown can go here */}
    </>
  );
}
