import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getRequests, InventoryRequest } from "../../firebase/requests";
import { getEmailLogs, openMailClient, saveEmailDraft } from "../../firebase/notifications";
import type { DemoEmailLog } from "../../firebase/localStore";

const levels = ["ټولې درجې", "ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];

export default function NotificationsPage() {
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [logs, setLogs] = useState<DemoEmailLog[]>([]);
  const [filter, setFilter] = useState("ټولې درجې");
  const [form, setForm] = useState({ to: "", subject: "ستاسې د غوښتنې اجناس رسېدلي دي", body: "سلامونه، ستاسې د غوښتنې اړوند اجناس ګدام ته رسېدلي دي. مهرباني وکړئ د تسلیمۍ لپاره مراجعه وکړئ.", requestId: "", requestLevel: "عادي" });

  const load = async () => {
    setRequests(await getRequests());
    setLogs(await getEmailLogs());
  };

  useEffect(() => { load(); }, []);

  const handleSelectRequest = (requestId: string) => {
    const request = requests.find((entry) => entry.id === requestId);
    setForm((prev) => ({
      ...prev,
      requestId,
      requestLevel: request?.currentRequestLevel || prev.requestLevel,
      subject: request ? `د غوښتنې خبرتیا - ${request.faculty}` : prev.subject,
      body: request ? `سلامونه ${request.requesterName}،\n\nستاسې غوښتنه (${request.faculty} - ${request.departmentOrPerson}) د ${request.currentRequestLevel} درجې سره تعقیب کې ده. مهرباني وکړئ د سیستم له لارې مرحله وګورئ.\n\nمننه` : prev.body,
    }));
  };

  const handleSaveAndOpen = async () => {
    if (!form.to.trim()) {
      alert("مهرباني وکړئ د ایمیل پته ولیکئ.");
      return;
    }
    const log = await saveEmailDraft({ to: form.to, subject: form.subject, body: form.body, relatedRequestId: form.requestId, requestLevel: form.requestLevel, status: navigator.onLine ? "Sent" : "Queued" });
    await load();
    if (navigator.onLine) await openMailClient(log);
    else alert("انټرنېټ نشته. ایمیل د انتظار په حالت کې خوندي شو.");
  };

  const visibleLogs = logs.filter((log) => filter === "ټولې درجې" || log.requestLevel === filter);

  return (
    <>
      <PageMeta title="خبرتیاوې" description="ایمیل او خبرتیاوې" />
      <Breadcrumb pageTitle="خبرتیاوې" />
      <div className="space-y-6" dir="rtl">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">ایمیل استول</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">اړوند غوښتنه</label>
                <select className="w-full rounded-lg border p-3 text-right" value={form.requestId} onChange={(e) => handleSelectRequest(e.target.value)}>
                  <option value="">بې له غوښتنې</option>
                  {requests.map((request) => <option key={request.id} value={request.id}>{request.faculty} - {request.currentRequestLevel}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">د ترلاسه کوونکي ایمیل</label>
                <input className="w-full rounded-lg border p-3 text-right" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="example@kandahar.edu.af" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">درجه</label>
                <select className="w-full rounded-lg border p-3 text-right" value={form.requestLevel} onChange={(e) => setForm({ ...form, requestLevel: e.target.value })}>
                  {levels.slice(1).map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">موضوع</label>
                <input className="w-full rounded-lg border p-3 text-right" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">متن</label>
                <textarea className="h-40 w-full rounded-lg border p-3 text-right" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              <Button onClick={handleSaveAndOpen} fullWidth>{navigator.onLine ? "ایمیل خلاصول او تاریخچه کې ثبتول" : "د انتظار په حالت کې خوندي کول"}</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">د ایمیل تاریخچه</h2>
              <select className="rounded-lg border p-2 text-right" value={filter} onChange={(e) => setFilter(e.target.value)}>
                {levels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {visibleLogs.length === 0 ? <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">تاریخچه نشته.</p> : visibleLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-gray-800 dark:text-white/90">{log.subject}</strong>
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-600">{log.status === "Sent" ? "استول شوی" : log.status === "Queued" ? "انتظار" : "مسوده"}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{log.to} · {log.createdAtHijriShamsi} · {log.requestLevel}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">{log.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
