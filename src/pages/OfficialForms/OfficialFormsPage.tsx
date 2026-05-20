import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import OfficialFormViewer from "../../components/OfficialFormViewer";
import { getRequests } from "../../firebase/requests";
import { useEffect } from "react";
import type { InventoryRequest } from "../../firebase/requests";

type TemplateId = "formTemplate0" | "formTemplate1" | "formTemplate2" | "formTemplate3" | "formTemplate4" | "formTemplate5" | "formTemplate6";

type FormMeta = { id: TemplateId; key: string; title: string; menu: "غوښتنې" | "تدارکات" | "ترلاسه کول" | "ټول فورمونه"; phase: string };

const forms: FormMeta[] = [
  { id: "formTemplate0", key: "proposal", title: "پیشنهاد", menu: "غوښتنې", phase: "د غوښتنې پیل" },
  { id: "formTemplate5", key: "si9", title: "سیو ۹", menu: "غوښتنې", phase: "د غوښتنې رسمي ضمیمه" },
  { id: "formTemplate1", key: "tender", title: "جګړه پاڼه", menu: "تدارکات", phase: "درې قیمتونه" },
  { id: "formTemplate2", key: "comparison", title: "فورم مقایسوي", menu: "تدارکات", phase: "د ټیټې بیې ټاکنه" },
  { id: "formTemplate3", key: "purchaseOrder", title: "آمر خریداري", menu: "تدارکات", phase: "د ګټونکي شرکت امر" },
  { id: "formTemplate4", key: "receiptReport", title: "راپور رسید", menu: "ترلاسه کول", phase: "ګدام ته داخلول" },
  { id: "formTemplate6", key: "fs5", title: "ف س ۵", menu: "ترلاسه کول", phase: "تسلیمي او موجودي کمول" },
];

const levels = ["ټولې درجې", "ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];
const menus = ["ټول فورمونه", "غوښتنې", "تدارکات", "ترلاسه کول"];

export default function OfficialFormsPage() {
  const [active, setActive] = useState<TemplateId>("formTemplate0");
  const [menuFilter, setMenuFilter] = useState("ټول فورمونه");
  const [levelFilter, setLevelFilter] = useState("ټولې درجې");
  const [requestId, setRequestId] = useState("");
  const [requests, setRequests] = useState<InventoryRequest[]>([]);

  useEffect(() => { getRequests().then(setRequests); }, []);

  const current = forms.find((form) => form.id === active) || forms[0];
  const visibleForms = forms.filter((form) => menuFilter === "ټول فورمونه" || form.menu === menuFilter);
  const activeRequest = requests.find((request) => request.id === requestId);

  const prefill = useMemo(() => {
    if (!activeRequest) return {};
    const data: Record<string, unknown> = {
      request_id: activeRequest.id,
      faculty_name: activeRequest.faculty,
      department: activeRequest.departmentOrPerson,
      requester_name: activeRequest.requesterName,
      request_level: activeRequest.currentRequestLevel,
      date_shamsi: activeRequest.createdAtHijriShamsi,
      date_qamari: activeRequest.createdAtHijriQamari,
      reason: activeRequest.reason,
    };
    activeRequest.items.forEach((item, index) => {
      const n = index + 1;
      data[`item_name_${n}`] = item.name;
      data[`desc_${n}`] = item.name;
      data[`qty_${n}`] = item.quantity;
      data[`requested_qty_${n}`] = item.quantity;
      data[`unit_${n}`] = item.unit;
    });
    return data;
  }, [activeRequest]);

  const filteredRequests = requests.filter((request) => levelFilter === "ټولې درجې" || request.currentRequestLevel === levelFilter);

  return (
    <>
      <PageMeta title="رسمي فورمونه" description="رسمي تدارکاتي او ګدامي فورمونه" />
      <div className="space-y-5" dir="rtl">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">رسمي فورمونه</h1>
          <p className="mt-2 text-sm leading-7 text-gray-500 dark:text-gray-400">
            ټول اووه رسمي فورمونه د اصلي HTML فایل څخه په جلا iframe کې خلاصیږي، نو د چاپ او رسمي بڼه نه خرابیږي.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <select className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900" value={menuFilter} onChange={(e) => setMenuFilter(e.target.value)}>
            {menus.map((menu) => <option key={menu}>{menu}</option>)}
          </select>
          <select className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            {levels.map((level) => <option key={level}>{level}</option>)}
          </select>
          <select className="rounded-xl border border-gray-200 bg-white p-3 text-right dark:border-gray-800 dark:bg-gray-900" value={requestId} onChange={(e) => setRequestId(e.target.value)}>
            <option value="">بې له ځانګړې غوښتنې</option>
            {filteredRequests.map((request) => <option key={request.id} value={request.id}>{request.faculty} - {request.currentRequestLevel} - {request.progress}%</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleForms.map((form) => (
            <button key={form.id} type="button" onClick={() => setActive(form.id)} className={`rounded-xl border p-4 text-right transition ${active === form.id ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "border-gray-200 bg-white text-gray-700 hover:border-brand-400 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"}`}>
              <span className="block font-bold">{form.title}</span>
              <span className="mt-1 block text-xs opacity-70">{form.menu} · {form.phase}</span>
            </button>
          ))}
        </div>

        {activeRequest && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">
            فعاله غوښتنه: {activeRequest.faculty} · درجه: {activeRequest.currentRequestLevel} · پرمختګ: {activeRequest.progress}%
          </div>
        )}

        <div className="h-[720px]">
          <OfficialFormViewer templateId={current.id} initialData={prefill} />
        </div>
      </div>
    </>
  );
}
