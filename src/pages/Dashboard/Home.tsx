import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { getItems, getRecentTransactions, WarehouseItem, StockTransaction } from "../../firebase/inventory";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

const modules = [
  { title: "موجودي", desc: "د اجناسو ثبت، لېست، داخل او خارج", to: "/inventory/items" },
  { title: "غوښتنې", desc: "د اجناسو غوښتنه او تعقیب", to: "/requests" },
  { title: "تدارکات", desc: "تدارکاتي مراحل او پیشنهادونه", to: "/procurement" },
  { title: "ترلاسه کول", desc: "رسید، ف س ۵ او تسلیمي", to: "/receiving" },
  { title: "راپورونه", desc: "موجودي، غوښتنې او وړاندوینې", to: "/reports" },
  { title: "فورمونه", desc: "رسمي فورمونه او اسناد", to: "/official-forms" },
];

export default function Home() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [itemData, requestData, transactionData] = await Promise.all([
          getItems(),
          getRequests(),
          getRecentTransactions(6),
        ]);
        if (!alive) return;
        setItems(itemData);
        setRequests(requestData);
        setTransactions(transactionData);
      } catch (error) {
        console.warn("Dashboard data load failed:", error);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  const totalValue = items.reduce((sum, item) => sum + (Number(item.currentQuantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const lowStock = items.filter(i => i.currentQuantity > 0 && i.currentQuantity <= i.minimumStockLevel).length;
  const outOfStock = items.filter(i => i.currentQuantity === 0).length;
  const pendingRequests = requests.filter(r => r.progress < 100).length;
  const completedRequests = requests.filter(r => r.progress >= 100).length;
  const procurementRequests = requests.filter(r =>
    ["StockNotAvailable", "ProcurementPending", "TenderCreated", "OffersReceived", "ComparisonCreated", "WinnerSelected", "PurchaseOrderCreated"].includes(r.status)
  ).length;

  const cards = [
    {
      label: "ټول اجناس",
      value: loading ? "..." : items.length,
      to: "/inventory/items",
      color: "bg-blue-500",
      icon: "📦",
    },
    {
      label: "د موجودۍ ارزښت",
      value: loading ? "..." : `${totalValue.toLocaleString()} ؋`,
      to: "/reports/inventory",
      color: "bg-green-500",
      icon: "💰",
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR],
    },
    {
      label: "کمه موجودي",
      value: loading ? "..." : lowStock,
      to: "/inventory/items?filter=low",
      color: lowStock > 0 ? "bg-orange-500" : "bg-gray-400",
      icon: "⚠️",
    },
    {
      label: "ختم شوي اجناس",
      value: loading ? "..." : outOfStock,
      to: "/inventory/items?filter=out",
      color: outOfStock > 0 ? "bg-red-500" : "bg-gray-400",
      icon: "❌",
    },
    {
      label: "ټولې غوښتنې",
      value: loading ? "..." : requests.length,
      to: "/requests",
      color: "bg-purple-500",
      icon: "📋",
    },
    {
      label: "پاتې غوښتنې",
      value: loading ? "..." : pendingRequests,
      to: "/requests?filter=pending",
      color: pendingRequests > 0 ? "bg-indigo-500" : "bg-gray-400",
      icon: "⏳",
    },
    {
      label: "بشپړې غوښتنې",
      value: loading ? "..." : completedRequests,
      to: "/requests?filter=completed",
      color: "bg-teal-500",
      icon: "✅",
    },
    {
      label: "تدارکاتي غوښتنې",
      value: loading ? "..." : procurementRequests,
      to: "/procurement",
      color: procurementRequests > 0 ? "bg-amber-500" : "bg-gray-400",
      icon: "🛒",
      roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR],
    },
  ].filter(c => !c.roles || !profile || c.roles.includes(profile.role));

  return (
    <>
      <PageMeta
        title="عمومي پاڼه | Kandahar University WMS"
        description="د کندهار پوهنتون د ګدام او تدارکاتو سیستم عمومي پاڼه"
      />

      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            د کندهار پوهنتون د عمومي ګدام او تدارکاتو مدیریت سیستم
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            د موجودۍ، غوښتنو، تدارکاتو، ترلاسه کولو، تسلیمۍ او راپورونو لپاره یو واحد سیستم.
          </p>
          {profile && (
            <p className="mt-2 text-xs text-primary font-medium">
              ښه راغلاست، {profile.name} — {profile.role}
            </p>
          )}
        </div>

        {/* Clickable Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="group rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-primary/30 transition-all dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <div className={`w-2 h-2 rounded-full ${card.color}`}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90 group-hover:text-primary transition-colors">
                {card.value}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Main Modules */}
          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">د سیستم اصلي برخې</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <Link
                  key={module.to}
                  to={module.to}
                  className="rounded-xl border border-gray-200 p-4 transition hover:border-primary hover:bg-primary/5 dark:border-gray-800 dark:hover:bg-white/[0.04]"
                >
                  <h3 className="font-bold text-gray-800 dark:text-white/90">{module.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{module.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">وروستي حرکات</h2>
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">بارول...</p>
              ) : transactions.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400 text-center">
                  تر اوسه کوم حرکت نه دی ثبت شوی.
                </p>
              ) : (
                transactions.map((tx, index) => (
                  <div key={tx.id || index} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{tx.itemName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.quantity} {tx.unit}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${tx.type === "IN" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                      {tx.type === "IN" ? "داخل" : "خارج"}
                    </span>
                  </div>
                ))
              )}
            </div>
            {transactions.length > 0 && (
              <Link to="/inventory/ledger" className="mt-4 block text-center text-xs text-primary hover:underline">
                ټول حرکات وګورئ ←
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
