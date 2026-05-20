import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ROLES } from "../../constants/roles";
import { safeSortByCreatedAt } from "../../firebase/safeQuery";

const STATUS_PS: Record<string, string> = {
  Draft: "مسوده", Submitted: "لیږل شوی", ConfirmedByRequestConfirmer: "تایید شوی",
  RejectedByRequestConfirmer: "رد شوی", ApprovedBySuperAdmin: "منل شوی",
  RejectedBySuperAdmin: "رد شوی", StockAvailable: "جنس شتون لري",
  StockNotAvailable: "جنس نشته", ProcurementPending: "تدارکاتو ته لیږل شو",
  TenderCreated: "داوطلبي پاڼه جوړه شوه", OffersReceived: "قیمتونه راغلل",
  ComparisonCreated: "مقایسه شوه", WinnerSelected: "ګټونکی ټاکل شو",
  PurchaseOrderCreated: "آمر خریداري", ReceiptReportCreated: "راپور رسید",
  ReceivedToInventory: "ګدام ته داخل شو", FS5Created: "ف س ۵ جوړه شوه", Delivered: "تسلیم شو",
};

const STATUS_DR: Record<string, string> = {
  Draft: "پیش‌نویس", Submitted: "ارسال شد", ConfirmedByRequestConfirmer: "تأیید شد",
  RejectedByRequestConfirmer: "رد شد", ApprovedBySuperAdmin: "تصویب شد",
  RejectedBySuperAdmin: "رد شد", StockAvailable: "موجود است",
  StockNotAvailable: "موجود نیست", ProcurementPending: "به تدارکات ارسال شد",
  TenderCreated: "مناقصه ایجاد شد", OffersReceived: "پیشنهادها دریافت شد",
  ComparisonCreated: "مقایسه انجام شد", WinnerSelected: "برنده انتخاب شد",
  PurchaseOrderCreated: "امر خرید", ReceiptReportCreated: "گزارش رسید",
  ReceivedToInventory: "وارد انبار شد", FS5Created: "ف س ۵ ایجاد شد", Delivered: "تحویل داده شد",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ConfirmedByRequestConfirmer: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  RejectedByRequestConfirmer: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ApprovedBySuperAdmin: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  RejectedBySuperAdmin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  StockAvailable: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  StockNotAvailable: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  ProcurementPending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  TenderCreated: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  WinnerSelected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PurchaseOrderCreated: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export default function RequestList() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { pick } = useLanguage();

  const filterParam = searchParams.get("filter");

  useEffect(() => {
    if (!authLoading && profile) loadRequests();
  }, [authLoading, profile, user]);

  const loadRequests = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const filters = profile.role === ROLES.REQUESTER ? { requesterId: user.uid } : {};
      const data = await getRequests(filters);
      setRequests(safeSortByCreatedAt(data, "desc"));
    } catch (e) {
      console.error("Error loading requests:", e);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = (s: string) => (pick(STATUS_PS[s], STATUS_DR[s]) || s);

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (filterParam === "pending") list = list.filter(r => r.progress < 100);
    else if (filterParam === "completed") list = list.filter(r => r.progress >= 100);
    else if (filterParam === "procurement") list = list.filter(r =>
      ["StockNotAvailable", "ProcurementPending", "TenderCreated", "OffersReceived", "ComparisonCreated", "WinnerSelected", "PurchaseOrderCreated"].includes(r.status)
    );
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(r =>
      (r.id || "").toLowerCase().includes(q) ||
      (r.faculty || "").toLowerCase().includes(q) ||
      (r.departmentOrPerson || "").toLowerCase().includes(q) ||
      (r.requesterName || "").toLowerCase().includes(q) ||
      (r.currentRequestLevel || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q) ||
      (STATUS_PS[r.status] || "").includes(q) ||
      (STATUS_DR[r.status] || "").includes(q) ||
      (r.reason || "").toLowerCase().includes(q) ||
      (r.items || []).some(i => (i.name || "").toLowerCase().includes(q))
    );
  }, [requests, search, filterParam]);

  const isLoading = authLoading || loading;

  return (
    <>
      <PageMeta title={pick("د غوښتنو لیست", "لیست درخواست‌ها") + " | Kandahar University WMS"} description="" />
      <Breadcrumb pageTitle="غوښتنې / درخواست‌ها" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{pick("د غوښتنو لړۍ", "فهرست درخواست‌ها")}</h3>
          <div className="flex items-center gap-2">
            {filterParam && (
              <Link to="/requests" className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition">
                ✕ {pick("فلتر لرې کول", "حذف فیلتر")}
              </Link>
            )}
            {(profile?.role === ROLES.REQUESTER || profile?.role === ROLES.SUPER_ADMIN) && (
              <Link to="/requests/create" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition">
                + {pick("نوې غوښتنه", "درخواست جدید")}
              </Link>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={pick("لټون... (پوهنځی، غوښتونکی، درجه، حالت، اجناس)", "جستجو... (پوهنکده، درخواست‌کننده، درجه، وضعیت، اجناس)")}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-right text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" dir="rtl" />
          </div>
          {search && <p className="mt-1 text-xs text-gray-400 text-right">{filteredRequests.length} {pick("پایله", "نتیجه")}</p>}
        </div>

        <div className="max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-gray-500">{pick("بارول...", "در حال بارگذاری...")}</p>
            </div>
          ) : !profile ? (
            <div className="text-center py-20 text-orange-500">{pick("د کاروونکي معلومات ونه موندل شول.", "اطلاعات کاربر یافت نشد.")}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {search ? `"${search}" ${pick("لپاره هیڅ غوښتنه ونه موندل شوه.", "برای هیچ درخواستی پیدا نشد.")}` : pick("تر اوسه کومه غوښتنه نشته.", "تاکنون هیچ درخواستی وجود ندارد.")}
            </div>
          ) : (
            <table className="w-full table-auto" dir="rtl">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("نیټه", "تاریخ")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("پوهنځی / غوښتونکی", "پوهنکده / درخواست‌کننده")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("درجه", "درجه")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("اجناس", "اجناس")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("حالت", "وضعیت")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("پرمختګ", "پیشرفت")}</th>
                  <th className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{pick("عمل", "عملیات")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">{r.createdAtHijriShamsi || "-"}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-gray-800 dark:text-white/90">{r.faculty || pick("ناپیژندل", "ناشناخته")}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.requesterName}</div>
                      {r.departmentOrPerson && <div className="text-xs text-gray-400 dark:text-gray-500">{r.departmentOrPerson}</div>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-400 text-right whitespace-nowrap">{r.currentRequestLevel || pick("عادي", "عادی")}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-400 text-right">{r.items?.length || 0} {pick("قلمه", "قلم")}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 mr-auto">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${r.progress || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500">{r.progress || 0}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/requests/details/${r.id}`} className="text-primary text-sm font-bold hover:underline">{pick("جزیات", "جزئیات")}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
