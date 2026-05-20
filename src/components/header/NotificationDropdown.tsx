import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { ROLES } from "../../constants/roles";

const STATUS_PS: Record<string, string> = {
  Submitted: "لیږل شوی",
  ConfirmedByRequestConfirmer: "تایید شوی",
  ApprovedBySuperAdmin: "منل شوی",
  StockAvailable: "جنس شتون لري",
  StockNotAvailable: "جنس نشته",
  ProcurementPending: "تدارکاتو ته لیږل شو",
  Delivered: "تسلیم شو",
};

const STATUS_DR: Record<string, string> = {
  Submitted: "ارسال شد",
  ConfirmedByRequestConfirmer: "تأیید شد",
  ApprovedBySuperAdmin: "تصویب شد",
  StockAvailable: "موجود است",
  StockNotAvailable: "موجود نیست",
  ProcurementPending: "به تدارکات ارسال شد",
  Delivered: "تحویل داده شد",
};

const STATUS_COLOR: Record<string, string> = {
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ConfirmedByRequestConfirmer: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ApprovedBySuperAdmin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  StockAvailable: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  StockNotAvailable: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ProcurementPending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Delivered: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

function timeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (lang === "dr") {
    if (diff < 60) return "همین الان";
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
  }
  if (diff < 60) return "هم اوس";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقې وړاندې`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعته وړاندې`;
  return `${Math.floor(diff / 86400)} ورځې وړاندې`;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "bg-brand-500", "bg-purple-500", "bg-emerald-500",
  "bg-orange-500", "bg-rose-500", "bg-teal-500",
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [seen, setSeen] = useState(false);
  const [query, setQuery] = useState("");
  const { profile } = useAuth();
  const { lang, pick } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getRequests().then(all => {
      let filtered = all;
      if (profile?.role === ROLES.REQUESTER) {
        filtered = all.filter(r => r.requesterId === profile.uid || r.requesterName === profile.name);
      }
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(filtered.slice(0, 20));
    });
  }, [profile]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    setTimeout(() => searchRef.current?.focus(), 80);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  const unread = !seen && requests.length > 0;

  const handleClick = () => {
    setIsOpen(o => !o);
    setSeen(true);
    if (isOpen) setQuery("");
  };

  const statusMap = lang === "dr" ? STATUS_DR : STATUS_PS;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? requests.filter(r =>
        r.faculty?.toLowerCase().includes(q) ||
        r.departmentOrPerson?.toLowerCase().includes(q) ||
        r.requesterName?.toLowerCase().includes(q) ||
        r.faculty?.includes(query.trim()) ||
        r.departmentOrPerson?.includes(query.trim()) ||
        r.requesterName?.includes(query.trim())
      )
    : requests;

  return (
    <>
      <button
        ref={btnRef}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unread && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          dir="rtl"
          className="fixed top-[70px] left-4 right-4 sm:left-auto sm:right-4 sm:w-[361px] z-[99999] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
          style={{ maxHeight: "min(480px, calc(100vh - 80px))" }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h5 className="text-base font-bold text-gray-800 dark:text-gray-200">
                {pick("خبرتیاوې", "اعلانات")}
              </h5>
              {requests.length > 0 && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  {q ? `${filtered.length}/${requests.length}` : requests.length}
                </span>
              )}
            </div>
            <button onClick={() => { setIsOpen(false); setQuery(""); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
              <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            </button>
          </div>

          <div className="px-3 pt-3 pb-1">
            <div className="relative flex items-center">
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={pick("پوهنځی، ډیپارتمنټ یا غوښتونکی...", "پوهنکده، دیپارتمنت یا درخواست‌کننده...")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-9 pl-8 text-sm text-right text-gray-700 placeholder-gray-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-brand-600 dark:focus:ring-brand-900/30 transition-all"
                dir="rtl"
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <ul className="flex flex-col overflow-y-auto custom-scrollbar gap-1 p-3 pt-2">
            {filtered.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-8 text-center">
                {q ? (
                  <>
                    <span className="text-2xl mb-2">🔍</span>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {pick("پایله ونه موندله", "نتیجه‌ای پیدا نشد")}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      «{query}»
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-2">🔔</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {pick("هیڅ خبرتیا نشته", "هیچ اعلانی وجود ندارد")}
                    </p>
                  </>
                )}
              </li>
            ) : (
              filtered.map((req, i) => {
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const statusLabel = statusMap[req.status] || req.status;
                const statusCls = STATUS_COLOR[req.status] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
                return (
                  <li key={req.id}>
                    <Link
                      to="/requests"
                      onClick={() => setIsOpen(false)}
                      className="flex gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>
                        {initials(req.requesterName)}
                      </span>
                      <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">{req.requesterName}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusCls}`}>{statusLabel}</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {req.faculty}{req.departmentOrPerson ? ` — ${req.departmentOrPerson}` : ""}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          <span>{req.currentRequestLevel}</span>
                          <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                          <span>{timeAgo(req.createdAt, lang)}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>

          <div className="p-3 pt-0">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-center text-brand-600 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors"
            >
              {pick("ټولې خبرتیاوې وګورئ", "مشاهده همه اعلانات")}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
