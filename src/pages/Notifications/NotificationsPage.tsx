import { useEffect, useState, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { getEmailLogs, openMailClient, saveEmailDraft } from "../../firebase/notifications";
import type { DemoEmailLog } from "../../firebase/localStore";

const LEVELS = ["ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];
const ALL = "ټولې درجې";

export default function NotificationsPage() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [logs, setLogs] = useState<DemoEmailLog[]>([]);
  const [filter, setFilter] = useState(ALL);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    to: "",
    subject: "ستاسې د غوښتنې خبرتیا",
    body: "سلامونه،\n\nستاسې د غوښتنې اړوند اجناس ګدام ته رسېدلي دي. مهرباني وکړئ د تسلیمۍ لپاره مراجعه وکړئ.\n\nمننه",
    requestId: "",
    requestLevel: "عادي",
  });

  const load = async () => {
    const [reqs, emailLogs] = await Promise.all([getRequests(), getEmailLogs()]);
    setRequests(reqs);
    // De-duplicate logs by subject+to+body fingerprint to prevent duplicates
    const seen = new Set<string>();
    const deduped = emailLogs.filter(l => {
      const key = `${l.to}|${l.subject}|${l.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setLogs(deduped);
  };

  useEffect(() => { load(); }, []);

  const handleSelectRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    setForm(prev => ({
      ...prev,
      requestId,
      requestLevel: req?.currentRequestLevel || prev.requestLevel,
      to: "",
      subject: req ? `د غوښتنې خبرتیا — ${req.faculty}` : prev.subject,
      body: req
        ? `سلامونه ${req.requesterName}،\n\nستاسې غوښتنه (${req.faculty} — ${req.departmentOrPerson}) د ${req.currentRequestLevel} درجې سره د ${STATUS_PS[req.status] || req.status} مرحلې پر بنسټ ده.\n\nمهرباني وکړئ د سیستم له لارې پرمختګ وګورئ.\n\nمننه`
        : prev.body,
    }));
  };

  const handleSend = async () => {
    if (!form.to.trim()) { setMsg("مهرباني وکړئ د ایمیل پته ولیکئ."); return; }
    setSending(true);
    setMsg("");
    try {
      const status: DemoEmailLog["status"] = navigator.onLine ? "Sent" : "Queued";
      const log = await saveEmailDraft({ ...form, status });
      await load();
      setMsg(status === "Sent" ? "ایمیل بریالیتوب سره استول شو." : "انټرنېټ نشته — ایمیل د انتظار حالت کې خوندي شو.");
      if (status === "Sent") await openMailClient(log);
      setTimeout(() => setMsg(""), 5000);
    } catch (e) {
      setMsg("د ایمیل استولو پر مهال تېروتنه رامنځته شوه.");
    } finally {
      setSending(false);
    }
  };

  const visibleLogs = useMemo(
    () => logs.filter(l => filter === ALL || l.requestLevel === filter),
    [logs, filter]
  );

  return (
    <>
      <PageMeta title="خبرتیاوې | Kandahar University WMS" description="ایمیل خبرتیاوې او تاریخچه" />
      <Breadcrumb pageTitle="خبرتیاوې / اعلانات" />

      <div className="space-y-6" dir="rtl">
        {msg && (
          <div className={`rounded-lg border p-3 text-sm ${msg.includes("بریالیتوب") ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Compose */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">✉️ ایمیل استول</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">اړوند غوښتنه (اختیاري)</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  value={form.requestId}
                  onChange={e => handleSelectRequest(e.target.value)}
                >
                  <option value="">— بې له غوښتنې —</option>
                  {requests.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.faculty} — {r.requesterName} ({r.currentRequestLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">د ترلاسه کوونکي ایمیل <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  value={form.to}
                  onChange={e => setForm({ ...form, to: e.target.value })}
                  placeholder="example@ku.edu.af"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">درجه</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  value={form.requestLevel}
                  onChange={e => setForm({ ...form, requestLevel: e.target.value })}
                >
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">موضوع</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-300">متن</label>
                <textarea
                  className="h-36 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-right text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 resize-none"
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                />
              </div>

              <Button onClick={handleSend} disabled={sending} fullWidth>
                {sending ? "استول..." : navigator.onLine ? "📤 ایمیل استول" : "💾 د انتظار حالت کې خوندي کول"}
              </Button>
            </div>
          </div>

          {/* History */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">📋 د ایمیل تاریخچه</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{visibleLogs.length} ایمیل</span>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-right text-xs text-gray-700 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option>{ALL}</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {visibleLogs.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                  تاریخچه نشته.
                </div>
              ) : (
                visibleLogs.map(log => (
                  <div key={log.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm text-gray-800 dark:text-white/90 leading-tight">{log.subject}</strong>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        log.status === "Sent"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : log.status === "Queued"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {log.status === "Sent" ? "استول شوی" : log.status === "Queued" ? "انتظار" : "مسوده"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {log.to} · {log.createdAtHijriShamsi} · {log.requestLevel}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{log.body}</p>
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

const STATUS_PS: Record<string, string> = {
  Submitted: "لیږل شوی",
  ConfirmedByRequestConfirmer: "تایید شوی",
  ApprovedBySuperAdmin: "منل شوی",
  StockAvailable: "جنس شتون لري",
  StockNotAvailable: "جنس نشته",
  ProcurementPending: "تدارکاتو ته لیږل شو",
  Delivered: "تسلیم شو",
};
