import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { seedDemoItems, getDemoTransactions, getDemoRequests } from "../../firebase/localStore";
import { useCalendar } from "../../context/CalendarContext";
import CurrentDateBadge from "../../components/common/CurrentDateBadge";

// ── Shamsi month labels for 12-month span ──
const MONTH_LABELS = [
  "جوزا ۱۴۰۴","سرطان ۱۴۰۴","اسد ۱۴۰۴","سنبله ۱۴۰۴",
  "میزان ۱۴۰۴","عقرب ۱۴۰۴","قوس ۱۴۰۴","جدي ۱۴۰۴",
  "دلو ۱۴۰۴","حوت ۱۴۰۴","حمل ۱۴۰۵","ثور ۱۴۰۵",
];
const MONTH_LABELS_SHORT = [
  "جوزا","سرطان","اسد","سنبله",
  "میزان","عقرب","قوس","جدي",
  "دلو","حوت","حمل","ثور",
];
const FORECAST_LABELS = ["سرطان ۱۴۰۵","اسد ۱۴۰۵","سنبله ۱۴۰۵"];

const Y1   = new Date(2025, 4, 14, 8, 0, 0).getTime();
const M_MS = 2629800000;

function getMonthIdx(ts: number): number {
  return Math.max(0, Math.min(11, Math.floor((ts - Y1) / M_MS)));
}

// ── Per-item forecast engine ──
function computeItemForecast(monthlyOut: number[]) {
  const vals = monthlyOut;
  const n = vals.length;

  // 3-month moving average
  const ma3 = n >= 3
    ? (vals[n-1] + vals[n-2] + vals[n-3]) / 3
    : vals.reduce((a, b) => a + b, 0) / (n || 1);

  // Exponential smoothing α=0.3
  let es = vals[0] || 0;
  const alpha = 0.3;
  for (let i = 1; i < n; i++) es = alpha * vals[i] + (1 - alpha) * es;

  // Linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) { sumX += i; sumY += vals[i]; sumXY += i*vals[i]; sumX2 += i*i; }
  const slope = (n * sumXY - sumX * sumY) / Math.max(1, n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const linReg = Math.max(0, slope * n + intercept);

  // 3-month projected values
  const projected = [1, 2, 3].map(k => Math.max(0, Math.round(slope * (n + k) + intercept)));

  const recommended = Math.ceil(Math.max(ma3, es, linReg) * 1.1);
  const avgMonthly = sumY / n;
  const reorderPoint = Math.ceil((avgMonthly / 30 * 14) + (avgMonthly / 4));

  return { ma3, es, linReg, projected, recommended, reorderPoint, avgMonthly };
}

// ── Dark-mode-safe chart defaults ──
const CHART_BASE: Partial<ApexOptions> = {
  chart: { toolbar: { show: false }, fontFamily: "inherit", background: "transparent", animations: { enabled: true, speed: 600 } },
  grid: { borderColor: "#e5e7eb", strokeDashArray: 4, xaxis: { lines: { show: false } } },
  tooltip: { theme: "light" },
  legend: { show: true, position: "top", fontSize: "12px" },
};

const STATUS_COLORS: Record<string, string> = {
  Delivered:            "#22c55e",
  PurchaseOrderCreated: "#3b82f6",
  ReceiptRecorded:      "#6366f1",
  WinnerSelected:       "#8b5cf6",
  TenderCreated:        "#f59e0b",
  StockAvailable:       "#14b8a6",
  StockNotAvailable:    "#f97316",
  ApprovedBySuperAdmin: "#a855f7",
  ConfirmedByRequestConfirmer: "#ec4899",
  Submitted:            "#94a3b8",
};
const STATUS_PS: Record<string, string> = {
  Delivered:"بشپړ شو", PurchaseOrderCreated:"آمر خریداري",
  ReceiptRecorded:"راپور رسید", WinnerSelected:"برنده غوره",
  TenderCreated:"جګړه پاڼه", StockAvailable:"ګدام موجود",
  StockNotAvailable:"تدارکاتو ته", ApprovedBySuperAdmin:"سوپر اډمین تایید",
  ConfirmedByRequestConfirmer:"تاییدوونکي تایید", Submitted:"ثبت شوه",
};

export default function ForecastingReport() {
  const { pickDate } = useCalendar();
  const [selectedItemId, setSelectedItemId] = useState<string>("demo_item_1");

  // ── Load data once ──
  const items       = useMemo(() => seedDemoItems(), []);
  const transactions = useMemo(() => getDemoTransactions(), []);
  const requests    = useMemo(() => getDemoRequests(), []);

  // ── Compute per-item monthly IN & OUT ──
  const itemData = useMemo(() => {
    const map: Record<string, { in: number[]; out: number[] }> = {};
    items.forEach(item => {
      map[item.id] = { in: Array(12).fill(0), out: Array(12).fill(0) };
    });
    transactions.forEach(t => {
      if (!map[t.itemId]) return;
      const mo = getMonthIdx(t.createdAt);
      if (t.type === "IN")  map[t.itemId].in[mo]  += t.quantity;
      if (t.type === "OUT") map[t.itemId].out[mo] += t.quantity;
    });
    return map;
  }, [items, transactions]);

  // ── Global monthly IN/OUT totals (across all items) ──
  const globalMonthly = useMemo(() => {
    const totIn  = Array(12).fill(0);
    const totOut = Array(12).fill(0);
    items.forEach(item => {
      const d = itemData[item.id];
      if (!d) return;
      d.in.forEach((v, i)  => (totIn[i]  += v));
      d.out.forEach((v, i) => (totOut[i] += v));
    });
    return { totIn, totOut };
  }, [itemData, items]);

  // ── Selected item data ──
  const selItem  = items.find(i => i.id === selectedItemId);
  const selData  = itemData[selectedItemId] ?? { in: Array(12).fill(0), out: Array(12).fill(0) };
  const selFcast = useMemo(() => computeItemForecast(selData.out), [selData]);

  // ── Low-stock items ──
  const lowStock = useMemo(
    () => items.filter(i => i.currentQuantity <= i.minimumStockLevel),
    [items]
  );

  // ── Top-5 most consumed items (total OUT over 12 months) ──
  const top5 = useMemo(() => {
    return items
      .map(item => ({
        item,
        total: (itemData[item.id]?.out ?? []).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [items, itemData]);

  // ── Request status distribution ──
  const reqStatuses = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  // ── Faculty needs summary ──
  const facultyNeeds = useMemo(() => {
    const map: Record<string, number> = {};
    requests.forEach(r => { map[r.faculty] = (map[r.faculty] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [requests]);

  // ════════════════════════════════
  // CHART OPTIONS
  // ════════════════════════════════

  // Overview: 12-month stacked bar (total IN vs OUT)
  const overviewOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "bar", stacked: false },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    colors: ["#22c55e", "#f87171"],
    xaxis: { categories: MONTH_LABELS_SHORT, labels: { style: { fontSize: "10px" } } },
    yaxis: { title: { text: "مقدار / واحد" } },
    series: [
      { name: "داخل شوي (IN)", data: globalMonthly.totIn },
      { name: "ایستل شوي (OUT)", data: globalMonthly.totOut },
    ],
    title: { text: "د ۱۲ میاشتو ټولیزه د ګدام حرکت", align: "right", style: { fontSize: "14px", fontWeight: "700" } },
  };

  // Per-item: bar IN vs OUT
  const itemBarOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "bar" },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
    colors: ["#3b82f6", "#f87171"],
    xaxis: { categories: MONTH_LABELS_SHORT, labels: { style: { fontSize: "10px" } } },
    yaxis: { title: { text: `مقدار (${selItem?.unit ?? ""})` } },
    series: [
      { name: "داخل (IN)", data: selData.in },
      { name: "ایستل (OUT)", data: selData.out },
    ],
    title: { text: `د ${selItem?.name ?? ""} د میاشتني حرکت`, align: "right", style: { fontSize: "13px", fontWeight: "700" } },
  };

  // Per-item: actual OUT line + forecast projection
  const forecastLineOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "line" },
    stroke: { width: [3, 3], dashArray: [0, 6], curve: "smooth" },
    colors: ["#6366f1", "#f59e0b"],
    markers: { size: 4 },
    xaxis: { categories: [...MONTH_LABELS_SHORT, ...FORECAST_LABELS.map(l => l.split(" ")[0])], labels: { style: { fontSize: "9px" }, rotate: -30 } },
    yaxis: { title: { text: `مقدار (${selItem?.unit ?? ""})` } },
    annotations: {
      xaxis: [{ x: MONTH_LABELS_SHORT[11], strokeDashArray: 5, borderColor: "#f59e0b", label: { text: "اوس", style: { background: "#f59e0b", color: "#fff" } } }],
    },
    series: [
      { name: "واقعي مصرف", data: [...selData.out, null, null, null] as any[] },
      { name: "وړاندوینه", data: [...Array(12).fill(null), ...selFcast.projected] as any[] },
    ],
    title: { text: "د مصرف وړاندوینه — ۳ میاشتې", align: "right", style: { fontSize: "13px", fontWeight: "700" } },
  };

  // Request status donut
  const donutOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "donut" },
    colors: reqStatuses.map(([s]) => STATUS_COLORS[s] ?? "#94a3b8"),
    labels: reqStatuses.map(([s]) => STATUS_PS[s] ?? s),
    plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "ټول", fontSize: "13px" } } } } },
    legend: { position: "bottom", fontSize: "11px" },
    series: reqStatuses.map(([, v]) => v),
    title: { text: "د غوښتنو د حالت ویش", align: "right", style: { fontSize: "13px", fontWeight: "700" } },
  };

  // Faculty needs bar (horizontal)
  const facultyOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "bar" },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: "60%" } },
    colors: ["#6366f1"],
    xaxis: { categories: facultyNeeds.map(([f]) => f.replace("د ", "").replace(" پوهنځی", "")) },
    yaxis: { labels: { style: { fontSize: "10px" } } },
    series: [{ name: "غوښتنې", data: facultyNeeds.map(([, v]) => v) }],
    title: { text: "د پوهنځیو د اړتیاوو لنډیز", align: "right", style: { fontSize: "13px", fontWeight: "700" } },
  };

  // Top-5 radial bars
  const radialOpts: ApexOptions = {
    ...CHART_BASE,
    chart: { ...CHART_BASE.chart, type: "radialBar" },
    colors: ["#6366f1","#22c55e","#f59e0b","#f87171","#14b8a6"],
    plotOptions: { radialBar: { dataLabels: { name: { fontSize: "11px" }, value: { fontSize: "12px", formatter: (val: number) => `${Math.round(val)}` } }, hollow: { size: "25%" } } },
    labels: top5.map(d => d.item.name.substring(0, 10)),
    series: top5.map(d => Math.min(100, Math.round((d.total / Math.max(1, top5[0].total)) * 100))),
    title: { text: "د ۵ تر ټولو ډیر مصرف شوي جنسونه", align: "right", style: { fontSize: "13px", fontWeight: "700" } },
  };

  const inProgressCount = requests.filter(r =>
    !["Delivered","Submitted"].includes(r.status)
  ).length;
  const totalOutYear = globalMonthly.totOut.reduce((a, b) => a + b, 0);
  const totalInYear  = globalMonthly.totIn.reduce((a, b) => a + b, 0);

  return (
    <>
      <PageMeta title="وړاندوینه | د کندهار پوهنتون WMS" description="د اجناسو د راتلونکي اړتیاوو وړاندوینه او د ۱ کال ډیټا تحلیل" />
      <Breadcrumb pageTitle="د وړاندوینې راپور / گزارش پیشبینی" />
      <div className="flex justify-end mb-2" dir="rtl"><CurrentDateBadge /></div>

      <div className="space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"ټول جنسونه", value: items.length, sub:"د ګدام موجودي", color:"text-blue-600", bg:"bg-blue-50 dark:bg-blue-900/20", icon:"📦", to:"/inventory/items" },
            { label:"د کم موجودۍ خبرداري", value: lowStock.length, sub:"د لږ تر لږه کچې لاندې", color:"text-red-600", bg:"bg-red-50 dark:bg-red-900/20", icon:"⚠️", to:"/inventory/items?filter=low" },
            { label:"روان غوښتنې", value: inProgressCount, sub:"د پروسې لاندې", color:"text-indigo-600", bg:"bg-indigo-50 dark:bg-indigo-900/20", icon:"🔄", to:"/requests" },
            { label:"د کال ټول مصرف", value: totalOutYear.toLocaleString(), sub:`داخل: ${totalInYear.toLocaleString()}`, color:"text-green-600", bg:"bg-green-50 dark:bg-green-900/20", icon:"📊", to:"/inventory/ledger" },
          ].map(card => (
            <Link key={card.label} to={card.to}>
              <div className={`rounded-2xl border border-gray-200 dark:border-gray-800 ${card.bg} p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                <div className="text-2xl mb-1">{card.icon}</div>
                <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{card.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Overview 12-month Chart + Low Stock Alert ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={overviewOpts} series={overviewOpts.series as any} type="bar" height={280} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-3 text-right border-b pb-2 dark:border-gray-700 flex items-center justify-end gap-2">
              <span>⚠️ د کم موجودۍ خبرداري</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStock.length === 0 ? (
                <p className="text-sm text-green-600 text-center py-6">✅ ټول جنسونه سم دي</p>
              ) : lowStock.map(item => (
                <Link key={item.id} to={`/inventory/items?filter=low`}>
                  <div className="flex items-center justify-between p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-800 dark:text-white/90">{item.name}</div>
                      <div className="text-[11px] text-gray-500">لږ تر لږه: {item.minimumStockLevel} {item.unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-red-600">{item.currentQuantity}</div>
                      <div className="text-[10px] text-red-500">{item.unit}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Item Selector ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">د جنس انتخاب / انتخاب جنس</label>
              <select
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:bg-white/5 text-right"
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
              >
                {items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} — موجودي: {i.currentQuantity} {i.unit}
                    {i.currentQuantity <= i.minimumStockLevel ? " ⚠️" : ""}
                  </option>
                ))}
              </select>
            </div>
            {selItem && (
              <div className="flex flex-wrap gap-3 text-right">
                {[
                  { label:"اوسنۍ موجودي", value:`${selItem.currentQuantity} ${selItem.unit}`, color: selItem.currentQuantity <= selItem.minimumStockLevel ? "text-red-600" : "text-green-600" },
                  { label:"لږ تر لږه کچه", value:`${selItem.minimumStockLevel} ${selItem.unit}`, color:"text-gray-700 dark:text-gray-300" },
                  { label:"یوه بیه", value:`${selItem.unitPrice.toLocaleString()} افغاني`, color:"text-indigo-600" },
                  { label:"وړاندیز شوي تدارک", value:`${selFcast.recommended} ${selItem.unit}`, color:"text-blue-600" },
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-800 min-w-[130px]">
                    <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Per-Item Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={itemBarOpts} series={itemBarOpts.series as any} type="bar" height={270} />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={forecastLineOpts} series={forecastLineOpts.series as any} type="line" height={270} />
          </div>
        </div>

        {/* ── Forecast Detail Cards ── */}
        {selItem && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"د ۳ میاشتو اوسط (MA3)", value: selFcast.ma3.toFixed(1), unit: selItem.unit, color:"text-blue-600", bg:"bg-blue-50 dark:bg-blue-900/20", desc:"Moving Average" },
              { label:"ایکسپوننشل سموتینګ", value: selFcast.es.toFixed(1), unit: selItem.unit, color:"text-indigo-600", bg:"bg-indigo-50 dark:bg-indigo-900/20", desc:"Exp. Smoothing α=0.3" },
              { label:"لینیري ریګریشن", value: selFcast.linReg.toFixed(1), unit: selItem.unit, color:"text-purple-600", bg:"bg-purple-50 dark:bg-purple-900/20", desc:"Linear Regression" },
              { label:"د بیا اردرولو ټکی", value: Math.ceil(selFcast.reorderPoint).toString(), unit: selItem.unit, color:"text-orange-600", bg:"bg-orange-50 dark:bg-orange-900/20", desc:"Reorder Point (14 ورځې)" },
            ].map(card => (
              <div key={card.label} className={`rounded-2xl border border-gray-200 dark:border-gray-800 ${card.bg} p-5 text-right`}>
                <div className={`text-2xl font-black ${card.color}`}>{card.value} <span className="text-sm font-normal">{card.unit}</span></div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">{card.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-mono">{card.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Reorder Recommendation Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4 text-right border-b pb-2 dark:border-gray-700">
            📋 د تدارک وړاندیز — ټول جنسونه (۱۴۰۴ کال تحلیل)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {["جنس","واحد","اوسنۍ موجودي","لږ تر لږه","د میاشتني مصرف اوسط","وړاندیز شوي تدارک","بیا اردر ټکی","حالت"].map(h => (
                    <th key={h} className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map(item => {
                  const d = itemData[item.id] ?? { out: Array(12).fill(0) };
                  const fc = computeItemForecast(d.out);
                  const needsReorder = item.currentQuantity <= item.minimumStockLevel;
                  const soonReorder  = !needsReorder && item.currentQuantity <= Math.ceil(fc.reorderPoint) * 1.5;
                  return (
                    <tr key={item.id} onClick={() => window.location.href = needsReorder ? `/inventory/items?filter=low` : `/inventory/items`} className={`hover:bg-blue-50/50 dark:hover:bg-white/[0.04] cursor-pointer transition-colors ${needsReorder ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
                      <td className="py-2.5 px-2 font-semibold text-gray-800 dark:text-white/90">{item.name}</td>
                      <td className="py-2.5 px-2 text-gray-500">{item.unit}</td>
                      <td className={`py-2.5 px-2 font-bold ${needsReorder ? "text-red-600" : "text-green-600"}`}>{item.currentQuantity}</td>
                      <td className="py-2.5 px-2 text-gray-600">{item.minimumStockLevel}</td>
                      <td className="py-2.5 px-2 text-gray-700 dark:text-gray-300">{fc.avgMonthly.toFixed(1)}</td>
                      <td className="py-2.5 px-2 font-bold text-blue-600">{fc.recommended}</td>
                      <td className="py-2.5 px-2 text-orange-600">{Math.ceil(fc.reorderPoint)}</td>
                      <td className="py-2.5 px-2">
                        {needsReorder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">⚠️ فوري تدارک</span>
                        ) : soonReorder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">🔔 ژر تدارک</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">✅ سم دی</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom Row: Donut + Faculty + Top5 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Status Donut */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={donutOpts} series={donutOpts.series as any} type="donut" height={280} />
          </div>

          {/* Faculty Needs Bar */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={facultyOpts} series={facultyOpts.series as any} type="bar" height={280} />
          </div>

          {/* Top-5 Radial */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <ReactApexChart options={radialOpts} series={radialOpts.series as any} type="radialBar" height={280} />
          </div>
        </div>

        {/* ── Needs & Authorization Pipeline Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4 text-right border-b pb-2 dark:border-gray-700">
            🔄 د اړتیاوو او اجازه‌نامې د پروسې لنډیز — ۱۴۰۴ کال
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  {["پوهنځی","موضوع","جنسونه","ثبت نیټه","اوسنۍ مرحله","پرمختګ","حالت"].map(h => (
                    <th key={h} className="pb-3 px-2 text-xs font-bold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...requests].sort((a, b) => b.createdAt - a.createdAt).map(req => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-2.5 px-2 text-[11px] text-gray-700 dark:text-gray-300 max-w-[160px]">
                      {req.faculty.replace("د ","").replace(" پوهنځی","")}
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-gray-600 max-w-[180px] truncate">{req.reason.substring(0,50)}…</td>
                    <td className="py-2.5 px-2 text-[11px] text-gray-500">{req.items.map(i => `${i.name}×${i.quantity}`).join(", ")}</td>
                    <td className="py-2.5 px-2 text-[11px] text-gray-500 whitespace-nowrap">{pickDate(req.createdAtHijriShamsi, req.createdAtHijriQamari)}</td>
                    <td className="py-2.5 px-2 text-[11px] text-gray-600">{req.currentStage}</td>
                    <td className="py-2.5 px-2 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${req.progress}%`, backgroundColor: req.progress === 100 ? "#22c55e" : req.progress >= 50 ? "#3b82f6" : req.progress >= 20 ? "#f59e0b" : "#94a3b8" }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 w-7 shrink-0">{req.progress}٪</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: STATUS_COLORS[req.status] ?? "#94a3b8" }}
                      >
                        {STATUS_PS[req.status] ?? req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Top-5 Most Consumed Table ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4 text-right border-b pb-2 dark:border-gray-700">
            🏆 د ۵ تر ټولو ډیر مصرف شوي جنسونه — ۱۴۰۴ کال
          </h3>
          <div className="space-y-3">
            {top5.map(({ item, total }, rank) => {
              const pct = Math.round((total / Math.max(1, top5[0].total)) * 100);
              const fc = computeItemForecast(itemData[item.id]?.out ?? Array(12).fill(0));
              return (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0"
                    style={{ backgroundColor: ["#6366f1","#22c55e","#f59e0b","#f87171","#14b8a6"][rank] }}>
                    {rank + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="font-bold text-gray-800 dark:text-white/90 text-sm">{item.name}</div>
                    <div className="text-[11px] text-gray-500">{item.category} — {item.unit}</div>
                    <div className="mt-1.5 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ["#6366f1","#22c55e","#f59e0b","#f87171","#14b8a6"][rank] }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-gray-800 dark:text-white/90">{total.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">{item.unit} / کال</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">وړاندیز: {fc.recommended}/{item.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
