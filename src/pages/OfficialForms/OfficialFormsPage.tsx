import { useMemo, useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import OfficialFormViewer from "../../components/OfficialFormViewer";
import type { OfficialTemplateId, OfficialFormSharedData } from "../../components/OfficialFormViewer";
import { getRequests } from "../../firebase/requests";
import type { InventoryRequest } from "../../firebase/requests";
import { getVendorOffers } from "../../firebase/procurement";
import type { VendorOffer, ReceiptReportRecord } from "../../firebase/procurement";
import type { FS5Document } from "../../firebase/receiving";
import { getLocalItem } from "../../firebase/localStore";
import { buildAllFormsData } from "../../utils/officialFormDataAdapter";

type FormMeta = {
  id: OfficialTemplateId;
  key: string;
  title: string;
  menu: "غوښتنې" | "تدارکات" | "ترلاسه کول" | "ټول فورمونه";
  phase: string;
  minProgress: number;
};

const forms: FormMeta[] = [
  { id: "formTemplate0", key: "proposal",      title: "پیشنهاد",       menu: "غوښتنې",      phase: "د غوښتنې پیل",            minProgress: 0  },
  { id: "formTemplate5", key: "si9",           title: "سیو ۹",         menu: "غوښتنې",      phase: "د غوښتنې رسمي ضمیمه",     minProgress: 0  },
  { id: "formTemplate1", key: "tender",        title: "جګړه پاڼه",     menu: "تدارکات",     phase: "درې قیمتونه",              minProgress: 20 },
  { id: "formTemplate2", key: "comparison",    title: "فورم مقایسوي",  menu: "تدارکات",     phase: "د ټیټې بیې ټاکنه",        minProgress: 35 },
  { id: "formTemplate3", key: "purchaseOrder", title: "آمر خریداري",   menu: "تدارکات",     phase: "د ګټونکي شرکت امر",       minProgress: 55 },
  { id: "formTemplate4", key: "receiptReport", title: "راپور رسید",    menu: "ترلاسه کول",  phase: "ګدام ته داخلول",           minProgress: 65 },
  { id: "formTemplate6", key: "fs5",           title: "ف س ۵",         menu: "ترلاسه کول",  phase: "تسلیمي او موجودي کمول",   minProgress: 80 },
];

const menus = ["ټول فورمونه", "غوښتنې", "تدارکات", "ترلاسه کول"];
const levels = ["ټولې درجې", "ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];

export default function OfficialFormsPage() {
  const [activeTemplateId, setActiveTemplateId] = useState<OfficialTemplateId>("formTemplate0");
  const [menuFilter, setMenuFilter] = useState("ټول فورمونه");
  const [levelFilter, setLevelFilter] = useState("ټولې درجې");
  const [requestId, setRequestId] = useState("");

  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [vendorOffers, setVendorOffers] = useState<VendorOffer[]>([]);
  const [receiptReport, setReceiptReport] = useState<ReceiptReportRecord | null>(null);
  const [fs5, setFs5] = useState<FS5Document | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    getRequests().then(setRequests).catch(() => {});
  }, []);

  const fetchRequestData = useCallback(async (reqId: string) => {
    if (!reqId) {
      setVendorOffers([]);
      setReceiptReport(null);
      setFs5(null);
      return;
    }
    setDataLoading(true);
    try {
      const [offers, rr, fs5Doc] = await Promise.allSettled([
        getVendorOffers(reqId),
        Promise.resolve(
          getLocalItem<ReceiptReportRecord[]>("receipt_reports", []).find(
            (r) => r.requestId === reqId || r.id === reqId
          ) || null
        ),
        Promise.resolve(getLocalItem<FS5Document | null>(`fs5_${reqId}`, null)),
      ]);

      setVendorOffers(offers.status === "fulfilled" ? offers.value : []);
      setReceiptReport(rr.status === "fulfilled" ? rr.value : null);
      setFs5(fs5Doc.status === "fulfilled" ? fs5Doc.value : null);
    } catch {
      setVendorOffers([]);
      setReceiptReport(null);
      setFs5(null);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequestData(requestId);
  }, [requestId, fetchRequestData]);

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === requestId) || null,
    [requests, requestId]
  );

  const allFormsData = useMemo<Record<string, OfficialFormSharedData>>(() => {
    if (!activeRequest) return {};
    return buildAllFormsData(
      activeRequest,
      vendorOffers.length > 0 ? vendorOffers : undefined,
      receiptReport,
      fs5
    );
  }, [activeRequest, vendorOffers, receiptReport, fs5]);

  const currentForm = forms.find((f) => f.id === activeTemplateId) || forms[0];
  const visibleForms = forms.filter(
    (f) => menuFilter === "ټول فورمونه" || f.menu === menuFilter
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter(
        (r) => levelFilter === "ټولې درجې" || r.currentRequestLevel === levelFilter
      ),
    [requests, levelFilter]
  );

  const handleSave = useCallback(
    (data: Record<string, unknown>) => {
      if (!requestId || !data) return;
      try {
        const key = `ku_req_${requestId}_form_${currentForm.key}`;
        localStorage.setItem(key, JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
      } catch {
        // ignore
      }
    },
    [requestId, currentForm.key]
  );

  return (
    <>
      <PageMeta title="رسمي فورمونه" description="رسمي تدارکاتي او ګدامي فورمونه" />
      <div className="space-y-4" dir="rtl">

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">رسمي فورمونه</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            اووه رسمي فورمونه — د غوښتنې، تدارکاتو، ترلاسه کولو او تسلیمۍ لپاره.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <select
            className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900"
            value={menuFilter}
            onChange={(e) => setMenuFilter(e.target.value)}
          >
            {menus.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select
            className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            {levels.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select
            className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
          >
            <option value="">— غوښتنه وټاکئ —</option>
            {filteredRequests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.faculty} · {r.requesterName} · {r.progress}%
              </option>
            ))}
          </select>
        </div>

        {activeRequest && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400">
            <div className="flex flex-wrap gap-4 items-center">
              <span>فعاله غوښتنه: <strong>{activeRequest.faculty}</strong></span>
              <span>غوښتونکی: <strong>{activeRequest.requesterName}</strong></span>
              <span>درجه: <strong>{activeRequest.currentRequestLevel}</strong></span>
              <span>پرمختګ: <strong>{activeRequest.progress}%</strong></span>
              <span>وضعیت: <strong>{activeRequest.status}</strong></span>
              {dataLoading && <span className="text-xs opacity-70">معلومات بارول کیږي...</span>}
              {vendorOffers.length > 0 && (
                <span className="text-xs text-green-700 dark:text-green-400">
                  {vendorOffers.length} آفر موجود
                </span>
              )}
              {receiptReport && (
                <span className="text-xs text-blue-700 dark:text-blue-400">راپور رسید موجود</span>
              )}
              {fs5 && (
                <span className="text-xs text-purple-700 dark:text-purple-400">ف س ۵ موجود</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {visibleForms.map((form) => {
            const isActive = activeTemplateId === form.id;
            const hasData = !!allFormsData[form.id];
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setActiveTemplateId(form.id)}
                className={`rounded-xl border p-3 text-right transition ${
                  isActive
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
                }`}
              >
                <span className="block text-xs font-bold">{form.title}</span>
                <span className="mt-0.5 block text-xs opacity-60">{form.phase}</span>
                {hasData && (
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="h-[800px]">
          <OfficialFormViewer
            templateId={activeTemplateId}
            requestId={requestId || undefined}
            allFormsData={Object.keys(allFormsData).length > 0 ? allFormsData : undefined}
            initialData={allFormsData[activeTemplateId]}
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  );
}
