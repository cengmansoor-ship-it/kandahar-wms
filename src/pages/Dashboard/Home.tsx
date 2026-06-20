import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { getItems, getRecentTransactions, WarehouseItem, StockTransaction } from "../../firebase/inventory";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useCalendar } from "../../context/CalendarContext";
import { ROLES } from "../../constants/roles";

function buildMonthlyStockData(transactions: StockTransaction[], months: string[]) {
  const now = Date.now();
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
  const recent = transactions.filter(tx => tx.createdAt >= sixMonthsAgo);
  const buckets: Record<string, { in: number; out: number }> = {};
  recent.forEach(tx => {
    const d = new Date(tx.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!buckets[key]) buckets[key] = { in: 0, out: 0 };
    if (tx.type === "IN") buckets[key].in += tx.quantity;
    else buckets[key].out += tx.quantity;
  });
  const labels: string[] = [];
  const inData: number[] = [];
  const outData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    labels.push(months[d.getMonth()]);
    inData.push(buckets[key]?.in || 0);
    outData.push(buckets[key]?.out || 0);
  }
  return { labels, inData, outData };
}

function buildRequestStatusData(requests: InventoryRequest[], lang: "ps" | "dr") {
  const STATUS_PS: Record<string, string> = {
    Delivered: "تسلیم شوی", Submitted: "ثبت شوی", StockAvailable: "جنس شتون لري",
    StockNotAvailable: "تدارکاتو ته", PurchaseOrderCreated: "آمر خریداري",
    WinnerSelected: "اخیستونکی ټاکل شو", TenderCreated: "داوطلبي",
    ApprovedBySuperAdmin: "سوپر اډمین تایید", ConfirmedByRequestConfirmer: "تاییدوونکی تایید",
  };
  const STATUS_DR: Record<string, string> = {
    Delivered: "تحویل داده شد", Submitted: "ثبت شد", StockAvailable: "موجود است",
    StockNotAvailable: "به تدارکات", PurchaseOrderCreated: "امر خرید",
    WinnerSelected: "برنده انتخاب شد", TenderCreated: "مناقصه",
    ApprovedBySuperAdmin: "تأیید سوپر ادمین", ConfirmedByRequestConfirmer: "تأیید تأییدکننده",
  };
  const map = lang === "dr" ? STATUS_DR : STATUS_PS;
  const statusMap: Record<string, number> = {};
  requests.forEach(r => {
    const label = map[r.status] || r.status;
    statusMap[label] = (statusMap[label] || 0) + 1;
  });
  return { labels: Object.keys(statusMap), series: Object.values(statusMap) };
}

function buildCategoryData(items: WarehouseItem[]) {
  const catMap: Record<string, number> = {};
  items.forEach(item => {
    const cat = item.category || "نور";
    catMap[cat] = (catMap[cat] || 0) + item.currentQuantity;
  });
  return { labels: Object.keys(catMap), series: Object.values(catMap) };
}

export default function Home() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { pick, lang } = useLanguage();
  const { calendarType, getMonthNames, getCurrentYear, getYearFromDate, getMonthIndexFromDate, getCurrentDateString } = useCalendar();
  const calLabel = calendarType === "shamsi" ? "شمسي" : calendarType === "qamari" ? "قمري" : "میلادي";
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [itemData, requestData, transactionData] = await Promise.all([
          getItems(), getRequests(), getRecentTransactions(60),
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
    { label: pick("ټول اجناس", "تمام اجناس"), value: loading ? "..." : items.length, to: "/inventory/items", color: "bg-blue-500", icon: "📦" },
    { label: pick("د موجودۍ ارزښت", "ارزش موجودی"), value: loading ? "..." : `${totalValue.toLocaleString()} ؋`, to: "/reports/inventory", color: "bg-green-500", icon: "💰", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR] },
    { label: pick("کمه موجودي", "موجودی کم"), value: loading ? "..." : lowStock, to: "/inventory/items?filter=low", color: lowStock > 0 ? "bg-orange-500" : "bg-gray-400", icon: "⚠️" },
    { label: pick("ختم شوي اجناس", "اجناس تمام‌شده"), value: loading ? "..." : outOfStock, to: "/inventory/items?filter=out", color: outOfStock > 0 ? "bg-red-500" : "bg-gray-400", icon: "❌" },
    { label: pick("ټولې غوښتنې", "همه درخواست‌ها"), value: loading ? "..." : requests.length, to: "/requests", color: "bg-purple-500", icon: "📋" },
    { label: pick("پاتې غوښتنې", "درخواست‌های باقی‌مانده"), value: loading ? "..." : pendingRequests, to: "/requests?filter=pending", color: pendingRequests > 0 ? "bg-indigo-500" : "bg-gray-400", icon: "⏳" },
    { label: pick("بشپړې غوښتنې", "درخواست‌های تکمیل‌شده"), value: loading ? "..." : completedRequests, to: "/requests?filter=completed", color: "bg-teal-500", icon: "✅" },
    { label: pick("تدارکاتي غوښتنې", "درخواست‌های تدارکاتی"), value: loading ? "..." : procurementRequests, to: "/procurement", color: procurementRequests > 0 ? "bg-amber-500" : "bg-gray-400", icon: "🛒", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR] },
  ].filter(c => !c.roles || !profile || (c.roles as string[]).includes(profile.role));

  const months = useMemo(() => getMonthNames(lang), [lang, calendarType]);

  const availableYears = useMemo(() => {
    const currentYear = getCurrentYear();
    const yearsSet = new Set<number>([currentYear]);
    transactions.forEach(tx => {
      if (tx.date) {
        const d = typeof tx.date === "number" ? new Date(tx.date) : new Date(String(tx.date));
        const y = getYearFromDate(d);
        if (y > 1200 && y <= currentYear + 1) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions, calendarType]);

  const [selectedYear, setSelectedYear] = useState<number>(() => getCurrentYear());

  useEffect(() => {
    setSelectedYear(getCurrentYear());
  }, [calendarType]);

  const { labels: monthLabels, inData, outData } = useMemo(() => {
    const txForYear = transactions.filter(tx => {
      if (!tx.date) return false;
      const d = typeof tx.date === "number" ? new Date(tx.date) : new Date(String(tx.date));
      return getYearFromDate(d) === selectedYear;
    });
    const inCounts = new Array(12).fill(0);
    const outCounts = new Array(12).fill(0);
    txForYear.forEach(tx => {
      try {
        const d = typeof tx.date === "number" ? new Date(tx.date) : new Date(tx.date!);
        const monthIdx = getMonthIndexFromDate(d);
        if (monthIdx >= 0 && monthIdx < 12) {
          if (tx.type === "IN") inCounts[monthIdx] += Number(tx.quantity) || 0;
          else outCounts[monthIdx] += Number(tx.quantity) || 0;
        }
      } catch {}
    });
    return { labels: months, inData: inCounts, outData: outCounts };
  }, [transactions, selectedYear, months, calendarType]);

  const { labels: statusLabels, series: statusSeries } = buildRequestStatusData(requests, lang);
  const { labels: catLabels, series: catSeries } = buildCategoryData(items);

  const stockBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", background: "transparent",
      events: { dataPointSelection: (_e, _chart, config) => {
        if (config.seriesIndex === 0) navigateRef.current("/inventory/ledger?type=IN");
        else navigateRef.current("/inventory/ledger?type=OUT");
      }},
    },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    colors: ["#3b82f6", "#f97316"],
    xaxis: { categories: monthLabels, labels: { style: { fontFamily: "inherit", fontSize: "12px" } } },
    yaxis: { labels: { style: { fontFamily: "inherit" } } },
    legend: { position: "top", fontFamily: "inherit", labels: { colors: "#6b7280" } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    tooltip: { theme: "light", style: { fontFamily: "inherit" } },
  };

  const stockBarSeries = [
    { name: pick("داخل", "ورودی"), data: inData },
    { name: pick("خارج", "خروجی"), data: outData },
  ];

  const requestDonutOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "inherit", background: "transparent",
      events: { dataPointSelection: () => { navigateRef.current("/requests"); } },
    },
    labels: statusLabels,
    colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#ef4444", "#06b6d4", "#f59e0b", "#6366f1", "#ec4899"],
    legend: { position: "bottom", fontFamily: "inherit", labels: { colors: "#6b7280" } },
    dataLabels: { style: { fontFamily: "inherit", fontSize: "11px" } },
    plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: pick("ټول", "مجموع"), fontFamily: "inherit", color: "#374151" } } } } },
    tooltip: { theme: "light", style: { fontFamily: "inherit" } },
  };

  const categoryBarOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit", background: "transparent",
      events: { dataPointSelection: () => { navigateRef.current("/inventory/items"); } },
    },
    plotOptions: { bar: { borderRadius: 6, horizontal: true } },
    dataLabels: { enabled: true, style: { fontFamily: "inherit", fontSize: "11px" } },
    colors: ["#6366f1"],
    xaxis: { categories: catLabels, labels: { style: { fontFamily: "inherit", fontSize: "11px" } } },
    yaxis: { labels: { style: { fontFamily: "inherit", fontSize: "12px" } } },
    grid: { borderColor: "#f3f4f6", strokeDashArray: 4 },
    tooltip: { theme: "light", style: { fontFamily: "inherit" } },
  };

  const categoryBarSeries = [{ name: pick("مقدار", "مقدار"), data: catSeries }];

  const modules = [
    { title: pick("موجودي", "موجودی"), desc: pick("د اجناسو ثبت، لیست، داخل او خارج", "ثبت، لیست، ورودی و خروجی اجناس"), to: "/inventory/items" },
    { title: pick("غوښتنې", "درخواست‌ها"), desc: pick("د اجناسو غوښتنه او تعقیب", "درخواست و پیگیری اجناس"), to: "/requests" },
    { title: pick("تدارکات", "تدارکات"), desc: pick("تدارکاتي مراحل او پیشنهادونه", "مراحل تدارکاتی و پیشنهادها"), to: "/procurement" },
    { title: pick("ترلاسه کول", "تحویل‌گیری"), desc: pick("رسید، ف، س، ۵ او تسلیمي", "رسید، ف، س، ۵ و تحویل‌دهی"), to: "/receiving" },
    { title: pick("راپورونه", "گزارش‌ها"), desc: pick("موجودي، غوښتنې او وړاندوینې", "موجودی، درخواست‌ها و پیش‌بینی"), to: "/reports" },
    { title: pick("فورمونه", "فرم‌ها"), desc: pick("رسمي فورمونه او اسناد", "فرم‌های رسمی و اسناد"), to: "/official-forms" },
  ];

  const staggerDelay = (i: number) => ({ animationDelay: `${i * 60}ms` });

  return (
    <>
      <PageMeta title={pick("عمومي پاڼه", "داشبورد") + " | Kandahar University WMS"} description="" />
      <div className="space-y-6 page-enter" dir="rtl">

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-white to-blue-50 p-6 dark:from-primary/20 dark:via-white/[0.03] dark:to-blue-900/10 dark:border-primary/30 animate-slide-down">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 right-10 w-28 h-28 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 relative z-10">
            {pick("د کندهار پوهنتون د عمومي ګدام او تدارکاتو مدیریت سیستم", "سیستم مدیریت انبار و تدارکات پوهنتون کندهار")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 relative z-10">
            {pick("د موجودۍ، غوښتنو، تدارکاتو، ترلاسه کولو، تسلیمۍ او راپورونو لپاره یو واحد سیستم.", "یک سیستم واحد برای موجودی، درخواست‌ها، تدارکات، تحویل‌گیری و گزارش‌ها.")}
          </p>
          {profile && (
            <p className="mt-2 text-xs text-primary font-medium relative z-10">
              {pick("ښه راغلاست،", "خوش آمدید،")} <span className="font-bold">{profile.name}</span> — <span className="opacity-70">{profile.role}</span>
            </p>
          )}
          <div className="mt-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white/70 dark:bg-white/5 px-3 py-1 text-xs font-medium text-primary dark:text-primary/80" dir="rtl">
              📅 {getCurrentDateString()} <span className="opacity-60">({calLabel})</span>
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]" style={staggerDelay(i)}>
                  <div className="skeleton-shimmer h-6 w-8 rounded mb-3" />
                  <div className="skeleton-shimmer h-3 w-20 rounded mb-2" />
                  <div className="skeleton-shimmer h-7 w-14 rounded" />
                </div>
              ))
            : cards.map((card, i) => (
                <Link key={card.label} to={card.to}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 card-interactive hover:shadow-lg hover:border-primary/30 dark:border-gray-800 dark:bg-white/[0.03] animate-scale-in"
                  style={staggerDelay(i)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl transition-transform group-hover:scale-125 duration-300">{card.icon}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${card.color} animate-pulse-ring`}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90 group-hover:text-primary transition-colors stat-pop">{card.value}</p>
                </Link>
              ))
          }
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{pick("د ګدام داخل / خارج", "ورودی / خروجی انبار")}</h2>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <Link to="/inventory/ledger" className="text-xs text-primary hover:underline btn-press">{pick("د راکړې ورکړې ثبت ←", "ثبت معاملات ←")}</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-10 rounded-lg" style={staggerDelay(i)} />
                ))}
              </div>
            ) : (
              <ReactApexChart key={lang} options={stockBarOptions} series={stockBarSeries} type="bar" height={280} />
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in" style={{ animationDelay: '220ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{pick("د غوښتنو وضعیت", "وضعیت درخواست‌ها")}</h2>
              <Link to="/requests" className="text-xs text-primary hover:underline btn-press">{pick("ټولې غوښتنې ←", "همه درخواست‌ها ←")}</Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-[280px]"><div className="skeleton-shimmer h-48 w-48 rounded-full" /></div>
            ) : requests.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">{pick("کومه غوښتنه نشته", "هیچ درخواستی وجود ندارد")}</div>
            ) : (
              <ReactApexChart key={lang + "-donut"} options={requestDonutOptions} series={statusSeries} type="donut" height={280} />
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{pick("د کټګورۍ موجودي", "موجودی بر اساس دسته‌بندی")}</h2>
              <Link to="/inventory/items" className="text-xs text-primary hover:underline">{pick("ټول اجناس ←", "همه اجناس ←")}</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-shimmer h-8 rounded-lg" style={staggerDelay(i)} />)}</div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">{pick("کوم جنس نشته", "هیچ جنسی وجود ندارد")}</div>
            ) : (
              <ReactApexChart key={lang + "-cat"} options={categoryBarOptions} series={categoryBarSeries} type="bar" height={240} />
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in" style={{ animationDelay: '180ms' }}>
            <h2 className="mb-4 text-base font-bold text-gray-800 dark:text-white/90">{pick("د سیستم اصلي برخې", "بخش‌های اصلی سیستم")}</h2>
            <div className="grid grid-cols-1 gap-2">
              {modules.map((module, i) => (
                <Link key={module.to} to={module.to}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 card-interactive hover:border-primary hover:bg-primary/5 dark:border-gray-800 dark:hover:bg-white/[0.04] animate-slide-in-right"
                  style={staggerDelay(i)}>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-white/90 group-hover:text-primary transition-colors">{module.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{module.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-fade-in" style={{ animationDelay: '240ms' }}>
            <h2 className="mb-4 text-base font-bold text-gray-800 dark:text-white/90">{pick("وروستي حرکات", "آخرین تراکنش‌ها")}</h2>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-12 rounded-xl" style={staggerDelay(i)} />
                ))
              ) : transactions.length === 0 ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400 text-center">
                  {pick("تر اوسه کوم حرکت نه دی ثبت شوی.", "تاکنون هیچ تراکنشی ثبت نشده است.")}
                </p>
              ) : (
                transactions.slice(0, 8).map((tx, index) => (
                  <Link to="/inventory/ledger" key={tx.id || index}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 table-row-hover dark:bg-white/[0.04] dark:hover:bg-white/[0.07] animate-slide-up"
                    style={staggerDelay(index)}>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{tx.itemName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.quantity} {tx.unit}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${tx.type === "IN" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                      {tx.type === "IN" ? pick("داخل", "ورودی") : pick("خارج", "خروجی")}
                    </span>
                  </Link>
                ))
              )}
            </div>
            {transactions.length > 0 && (
              <Link to="/inventory/ledger" className="mt-4 block text-center text-xs text-primary hover:underline btn-press">
                {pick("ټول حرکات وګورئ ←", "مشاهده همه تراکنش‌ها ←")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
