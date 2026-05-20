import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { getItems, getRecentTransactions, WarehouseItem, StockTransaction } from "../../firebase/inventory";
import { getRequests, InventoryRequest } from "../../firebase/requests";

const modules = [
  { title: "موجودي", desc: "د اجناسو ثبت، لېست، داخل او خارج", to: "/inventory/items" },
  { title: "غوښتنې", desc: "د اجناسو غوښتنه او تعقیب", to: "/requests" },
  { title: "تدارکات", desc: "تدارکاتي مراحل او پیشنهادونه", to: "/procurement" },
  { title: "ترلاسه کول", desc: "رسید، PC5/FS5 او تسلیمي", to: "/receiving" },
  { title: "راپورونه", desc: "موجودي، غوښتنې او وړاندوینې", to: "/reports" },
  { title: "ساتنه", desc: "Backup، Trash، Audit او QA", to: "/maintenance/final-qa" },
];

export default function Home() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

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
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const totalValue = items.reduce((sum, item) => sum + (Number(item.currentQuantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const lowStock = items.filter((item) => (Number(item.currentQuantity) || 0) <= (Number(item.minimumStockLevel) || 0)).length;
  const pendingRequests = requests.filter((request) => request.progress < 100).length;
  const completedRequests = requests.filter((request) => request.progress >= 100).length;

  const cards = [
    { label: "ټول اجناس", value: items.length },
    { label: "د موجودۍ ارزښت", value: `${totalValue.toLocaleString()} ؋` },
    { label: "کمه موجودي", value: lowStock },
    { label: "ټولې غوښتنې", value: requests.length },
    { label: "پاتې غوښتنې", value: pendingRequests },
    { label: "بشپړې غوښتنې", value: completedRequests },
  ];

  return (
    <>
      <PageMeta
        title="Dashboard | Kandahar University WMS"
        description="د کندهار پوهنتون د ګدام او تدارکاتو سیستم عمومي پاڼه"
      />

      <div className="space-y-6" dir="rtl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                د کندهار پوهنتون د عمومي ګدام او تدارکاتو مدیریت سیستم
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                د موجودۍ، غوښتنو، تدارکاتو، ترلاسه کولو، تسلیمۍ او راپورونو لپاره یو واحد سیستم.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="mt-3 text-2xl font-bold text-gray-800 dark:text-white/90">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">د سیستم اصلي برخې</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {modules.map((module) => (
                <Link key={module.to} to={module.to} className="rounded-xl border border-gray-200 p-4 transition hover:border-brand-500 hover:bg-brand-50 dark:border-gray-800 dark:hover:bg-white/[0.04]">
                  <h3 className="font-bold text-gray-800 dark:text-white/90">{module.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{module.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">وروستي حرکات</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                  تر اوسه کوم حرکت نه دی ثبت شوی.
                </p>
              ) : (
                transactions.map((transaction, index) => (
                  <div key={transaction.id || index} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-white/[0.04]">
                    <p className="font-semibold text-gray-800 dark:text-white/90">{transaction.itemName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{transaction.type} - {transaction.quantity} {transaction.unit}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
