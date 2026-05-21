import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import Breadcrumb from "../components/common/Breadcrumb";
import { useLanguage } from "../context/LanguageContext";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../constants/roles";

const ROLE_META: Record<string, { icon: string; colorClasses: string; namePs: string; nameDr: string; descPs: string; descDr: string }> = {
  [ROLES.SUPER_ADMIN]: {
    icon: "👑",
    colorClasses: "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700/50",
    namePs: "سوپر اډمین",
    nameDr: "سوپر ادمین",
    descPs: "بشپړ لاسرسی — ټول واکونه",
    descDr: "دسترسی کامل — تمام اختیارات",
  },
  [ROLES.ADMIN]: {
    icon: "🛠️",
    colorClasses: "border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700/50",
    namePs: "اډمین",
    nameDr: "ادمین",
    descPs: "د سیستم عمومي مدیریت",
    descDr: "مدیریت عمومی سیستم",
  },
  [ROLES.PROCUREMENT_DIRECTOR]: {
    icon: "📋",
    colorClasses: "border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700/50",
    namePs: "د تدارکاتو مدیر",
    nameDr: "مدیر تدارکات",
    descPs: "د تدارکاتو پروسه مدیریت",
    descDr: "مدیریت فرایند تدارکات",
  },
  [ROLES.WAREHOUSE_DIRECTOR]: {
    icon: "🏭",
    colorClasses: "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/50",
    namePs: "د ګدام مدیر",
    nameDr: "مدیر انبار",
    descPs: "د ګدام نظارت او تسلیمي",
    descDr: "نظارت انبار و تحویل‌گیری",
  },
  [ROLES.WAREHOUSE_ENTRY_PERSON]: {
    icon: "📦",
    colorClasses: "border-sky-300 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-700/50",
    namePs: "د ګدام داخلوونکی",
    nameDr: "متصدی انبار",
    descPs: "د موجودۍ لید او سمول",
    descDr: "مشاهده و ویرایش موجودی",
  },
  [ROLES.REQUESTER]: {
    icon: "📝",
    colorClasses: "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700/50",
    namePs: "غوښتونکی",
    nameDr: "درخواست‌کننده",
    descPs: "د غوښتنو جوړول",
    descDr: "ثبت درخواست‌ها",
  },
  [ROLES.REQUEST_CONFIRMER]: {
    icon: "✅",
    colorClasses: "border-teal-300 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-700/50",
    namePs: "د غوښتنې تاییدوونکی",
    nameDr: "تأییدکننده درخواست",
    descPs: "د غوښتنو تاییدول",
    descDr: "تأیید درخواست‌ها",
  },
};

const PERM_META: Record<string, { icon: string; labelPs: string; labelDr: string; group: string }> = {
  [PERMISSIONS.MANAGE_USERS]:      { icon: "👤", labelPs: "د کاروونکو مدیریت",     labelDr: "مدیریت کاربران",         group: "admin" },
  [PERMISSIONS.MANAGE_ROLES]:      { icon: "🛡️", labelPs: "د رولونو مدیریت",       labelDr: "مدیریت نقش‌ها",          group: "admin" },
  [PERMISSIONS.VIEW_AUDIT_LOGS]:   { icon: "📜", labelPs: "د فعالیت لاګونه",       labelDr: "گزارش فعالیت‌ها",        group: "admin" },
  [PERMISSIONS.VIEW_TRASH]:        { icon: "🗑️", labelPs: "ژبدار لیدل",            labelDr: "مشاهده زباله‌دان",        group: "admin" },
  [PERMISSIONS.MANAGE_SETTINGS]:   { icon: "⚙️", labelPs: "تنظیمات",              labelDr: "تنظیمات",                 group: "admin" },
  [PERMISSIONS.VIEW_INVENTORY]:    { icon: "👁️", labelPs: "موجودي لیدل",           labelDr: "مشاهده موجودی",          group: "warehouse" },
  [PERMISSIONS.EDIT_INVENTORY]:    { icon: "✏️", labelPs: "موجودي سمول",           labelDr: "ویرایش موجودی",          group: "warehouse" },
  [PERMISSIONS.VIEW_PROCUREMENT]:  { icon: "📋", labelPs: "تدارکات لیدل",          labelDr: "مشاهده تدارکات",         group: "procurement" },
  [PERMISSIONS.MANAGE_PROCUREMENT]:{ icon: "🔧", labelPs: "تدارکات مدیریت",        labelDr: "مدیریت تدارکات",         group: "procurement" },
  [PERMISSIONS.VIEW_RECEIVING]:    { icon: "📥", labelPs: "تسلیمي لیدل",           labelDr: "مشاهده تحویل‌گیری",     group: "warehouse" },
  [PERMISSIONS.MANAGE_RECEIVING]:  { icon: "📤", labelPs: "تسلیمي مدیریت",         labelDr: "مدیریت تحویل‌گیری",     group: "warehouse" },
  [PERMISSIONS.CREATE_REQUESTS]:   { icon: "📝", labelPs: "غوښتنه جوړول",          labelDr: "ثبت درخواست",            group: "requests" },
  [PERMISSIONS.CONFIRM_REQUESTS]:  { icon: "✔️", labelPs: "غوښتنه تاییدول",        labelDr: "تأیید درخواست",          group: "requests" },
  [PERMISSIONS.VIEW_ALL_REQUESTS]: { icon: "📂", labelPs: "ټولې غوښتنې لیدل",      labelDr: "مشاهده همه درخواست‌ها",  group: "requests" },
  [PERMISSIONS.VIEW_REPORTS]:      { icon: "📊", labelPs: "راپورونه لیدل",          labelDr: "مشاهده گزارش‌ها",        group: "reports" },
};

const GROUP_COLORS: Record<string, string> = {
  admin:       "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  warehouse:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  procurement: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  requests:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  reports:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function RoleManagement() {
  const { pick } = useLanguage();
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const allRoles = Object.values(ROLES);
  const allPerms = Object.values(PERMISSIONS);

  return (
    <>
      <PageMeta
        title="د صلاحیتونو مدیریت | Kandahar University WMS"
        description="د صلاحیتونو مدیریت پاڼه"
      />
      <Breadcrumb pageTitle={pick("د صلاحیتونو مدیریت", "مدیریت صلاحیت‌ها")} />

      <div className="space-y-6" dir="rtl">

        {/* Header summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {pick("د صلاحیتونو مدیریت", "مدیریت صلاحیت‌ها")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {pick("د هر رول لپاره د لاسرسي سطح او اجازه‌ناوې", "سطح دسترسی و مجوزها برای هر نقش")}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-center">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] px-4 py-2">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{allRoles.length}</div>
                <div className="text-xs text-gray-500">{pick("رولونه", "نقش‌ها")}</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] px-4 py-2">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{allPerms.length}</div>
                <div className="text-xs text-gray-500">{pick("اجازه‌ناوې", "مجوزها")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Role filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveRole(null)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeRole === null
                ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
          >
            {pick("ټول رولونه", "همه نقش‌ها")}
          </button>
          {allRoles.map((role) => {
            const meta = ROLE_META[role];
            return (
              <button
                key={role}
                onClick={() => setActiveRole(activeRole === role ? null : role)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  activeRole === role
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                {meta?.icon} {pick(meta?.namePs || role, meta?.nameDr || role)}
              </button>
            );
          })}
        </div>

        {/* Role cards grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {allRoles
            .filter((role) => activeRole === null || activeRole === role)
            .map((role) => {
              const meta = ROLE_META[role];
              const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
              return (
                <div
                  key={role}
                  className={`rounded-2xl border-2 p-5 transition-all ${meta?.colorClasses || "border-gray-200 bg-gray-50 dark:bg-gray-800/30"}`}
                >
                  {/* Role header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/60 dark:bg-black/30 text-gray-600 dark:text-gray-300">
                      {perms.length} {pick("اجازه", "مجوز")}
                    </span>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-bold text-gray-800 dark:text-white/90 text-base">
                          {pick(meta?.namePs || role, meta?.nameDr || role)}
                        </span>
                        <span className="text-2xl">{meta?.icon || "👤"}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {pick(meta?.descPs || "", meta?.descDr || "")}
                      </p>
                      <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5" dir="ltr">
                        {role}
                      </p>
                    </div>
                  </div>

                  {/* Permissions */}
                  {perms.length === 0 ? (
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-4">
                      {pick("هیڅ ځانګړي اجازه نشته", "هیچ مجوز خاصی ندارد")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {perms.map((perm) => {
                        const pm = PERM_META[perm];
                        return (
                          <span
                            key={perm}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                              GROUP_COLORS[pm?.group || ""] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            <span>{pm?.icon || "•"}</span>
                            {pick(pm?.labelPs || perm, pm?.labelDr || perm)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Full permission matrix table */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-800 dark:text-white/90 text-base">
              {pick("د صلاحیتونو لنډیز جدول", "جدول خلاصه صلاحیت‌ها")}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pick("✓ = دغه رول دا اجازه لري  •  — = نشته", "✓ = این نقش این مجوز را دارد  •  — = ندارد")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 min-w-[160px]">
                    {pick("اجازه‌ناوه", "مجوز")}
                  </th>
                  {allRoles.map((role) => (
                    <th key={role} className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center min-w-[80px]">
                      <div>{ROLE_META[role]?.icon || "👤"}</div>
                      <div className="text-xs font-medium mt-0.5 whitespace-nowrap">
                        {pick(ROLE_META[role]?.namePs || role, ROLE_META[role]?.nameDr || role)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allPerms.map((perm, idx) => {
                  const pm = PERM_META[perm];
                  return (
                    <tr
                      key={perm}
                      className={`border-b border-gray-100 dark:border-gray-800 ${
                        idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-gray-50/50 dark:bg-white/[0.01]"
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          GROUP_COLORS[pm?.group || ""] || "bg-gray-100 text-gray-700"
                        }`}>
                          {pm?.icon} {pick(pm?.labelPs || perm, pm?.labelDr || perm)}
                        </span>
                      </td>
                      {allRoles.map((role) => {
                        const rolePerms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
                        const has = rolePerms.includes(perm as any);
                        return (
                          <td key={role} className="px-3 py-2.5 text-center">
                            {has ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="font-bold text-gray-700 dark:text-white/80 text-sm mb-3">
            {pick("د اجازه‌ناوو ډلې", "دسته‌بندی مجوزها")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries({ admin: pick("اداري", "اداری"), warehouse: pick("ګدام", "انبار"), procurement: pick("تدارکات", "تدارکات"), requests: pick("غوښتنې", "درخواست‌ها"), reports: pick("راپورونه", "گزارش‌ها") }).map(([key, label]) => (
              <span key={key} className={`px-3 py-1 rounded-full text-xs font-semibold ${GROUP_COLORS[key]}`}>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            {pick(
              "⚠️ د رولونو اجازه‌ناوې د سیستم کوډ کې ټاکل کیږي. د بدلولو لپاره د IT مسوول سره اړیکه ونیسئ.",
              "⚠️ مجوزهای نقش‌ها در کد سیستم تعریف شده‌اند. برای تغییر با مسئول IT تماس بگیرید."
            )}
          </p>
        </div>

      </div>
    </>
  );
}
