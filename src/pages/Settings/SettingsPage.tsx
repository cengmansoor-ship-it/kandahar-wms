import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getLocalItem, setLocalItem } from "../../firebase/localStore";
import { getCurrentHijriDates } from "../../utils/dateUtils";
import { useLanguage } from "../../context/LanguageContext";
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "../../constants/roles";

const limitOptions = [0, 5, 10, 20, 30];

interface EmailConfig {
  id: number;
  email: string;
  label: string;
  created_at: string;
}

interface EmailForm {
  email: string;
  app_password: string;
  label: string;
}

const emptyForm: EmailForm = { email: "", app_password: "", label: "" };

export default function SettingsPage() {
  const saved = getLocalItem("request_limits", { dailyLimit: 10, updatedAtHijriShamsi: "" });
  const [dailyLimit, setDailyLimit] = useState<number>(Number((saved as any).dailyLimit) || 10);
  const [message, setMessage] = useState("");
  const { lang, setLang, pick } = useLanguage();

  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [emailForm, setEmailForm] = useState<EmailForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const loadEmailConfigs = async () => {
    try {
      const res = await fetch("/api/email-config");
      const data = await res.json();
      if (data.success) setEmailConfigs(data.data);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    loadEmailConfigs();
  }, []);

  const flashEmailMsg = (text: string, type: "success" | "error") => {
    setEmailMsg({ text, type });
    setTimeout(() => setEmailMsg(null), 4000);
  };

  const handleEmailSubmit = async () => {
    if (!emailForm.email.trim()) {
      return flashEmailMsg(pick("ایمیل خالي دی.", "ایمیل خالی است."), "error");
    }
    if (!emailForm.email.includes("@")) {
      return flashEmailMsg(pick("ایمیل سمه نه ده.", "ایمیل معتبر نیست."), "error");
    }
    // Strip spaces — Google shows App Passwords as "xxxx xxxx xxxx xxxx"
    const cleanedPass = emailForm.app_password.replace(/\s/g, "");
    if (!editingId && cleanedPass.length !== 16) {
      return flashEmailMsg(
        pick("د اپ پاسورډ باید دقیقاً ۱۶ حروف وي (د فضا پرته).", "رمز برنامه باید دقیقاً ۱۶ کاراکتر باشد (بدون فاصله)."),
        "error"
      );
    }
    if (editingId && cleanedPass !== "" && cleanedPass.length !== 16) {
      return flashEmailMsg(
        pick("د اپ پاسورډ باید دقیقاً ۱۶ حروف وي (د فضا پرته).", "رمز برنامه باید دقیقاً ۱۶ کاراکتر باشد (بدون فاصله)."),
        "error"
      );
    }

    setEmailLoading(true);
    try {
      const payload = { ...emailForm, app_password: cleanedPass };
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/email-config/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/email-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (data.success) {
        flashEmailMsg(
          editingId
            ? pick("ایمیل تنظیمات تازه شو.", "تنظیمات ایمیل بروزرسانی شد.")
            : pick("ایمیل د بریالیتوب سره خوندي شو.", "ایمیل با موفقیت ذخیره شد."),
          "success"
        );
        setEmailForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        await loadEmailConfigs();
      } else {
        flashEmailMsg(data.message || pick("ستونزه پیښه شوه.", "خطا رخ داد."), "error");
      }
    } catch {
      flashEmailMsg(pick("د سرور سره اتصال نشو.", "اتصال به سرور برقرار نشد."), "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEdit = (config: EmailConfig) => {
    setEditingId(config.id);
    setEmailForm({ email: config.email, app_password: "", label: config.label });
    setShowForm(true);
    setEmailMsg(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/email-config/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        flashEmailMsg(pick("ایمیل ړنګ شو.", "ایمیل حذف شد."), "success");
        await loadEmailConfigs();
      } else {
        flashEmailMsg(data.message || pick("ستونزه پیښه شوه.", "خطا رخ داد."), "error");
      }
    } catch {
      flashEmailMsg(pick("د سرور سره اتصال نشو.", "اتصال به سرور برقرار نشد."), "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/email-config/${id}/test`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        flashEmailMsg(pick("✅ د ازموینې ایمیل بریالیتوب سره ولیږل شو! خپل inbox وګورئ.", "✅ ایمیل آزمایشی با موفقیت ارسال شد! صندوق ورودی را بررسی کنید."), "success");
      } else if (data.code === "GMAIL_BAD_CREDENTIALS" || (data.message || "").includes("GMAIL_BAD_CREDENTIALS")) {
        flashEmailMsg(
          pick(
            "❌ د Gmail اپ پاسورډ غلط دی — د عادي پاسورډ پر ځای باید د Gmail اپ پاسورډ (App Password) وکاروئ. myaccount.google.com/apppasswords ته لاړ شئ.",
            "❌ رمز برنامه Gmail نادرست است — به جای رمز عادی، باید App Password استفاده کنید. به myaccount.google.com/apppasswords بروید."
          ),
          "error"
        );
      } else {
        flashEmailMsg(pick("❌ ازموینه ناکامه شوه: ", "❌ آزمایش ناموفق: ") + (data.message || ""), "error");
      }
    } catch {
      flashEmailMsg(pick("د سرور سره اتصال نشو.", "اتصال به سرور برقرار نشد."), "error");
    } finally {
      setTestingId(null);
    }
  };

  const cancelForm = () => {
    setEmailForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setEmailMsg(null);
  };

  const save = () => {
    const dates = getCurrentHijriDates();
    setLocalItem("request_limits", { dailyLimit, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari });
    setMessage(pick(
      "د ورځني غوښتنو حد خوندي شو او د سیستم فعالیتونو کې د ثبت لپاره چمتو دی.",
      "محدودیت درخواست‌های روزانه ذخیره شد."
    ));
  };

  return (
    <>
      <PageMeta title={pick("تنظیمات", "تنظیمات")} description={pick("د سیستم تنظیمات", "تنظیمات سیستم")} />
      <Breadcrumb pageTitle={pick("تنظیمات", "تنظیمات")} />
      <div className="space-y-6 page-enter" dir="rtl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up" style={{ animationDelay: "0ms" }}>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">
            {pick("د سوپر اډمین تنظیمات", "تنظیمات سوپر ادمین")}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {pick(
              "د غوښتنو حد، صلاحیتونه، بیکپ، امنیتي یادښتونه او د فایربیس اتصال معلومات.",
              "محدودیت درخواست‌ها، دسترسی‌ها، پشتیبان‌گیری، یادداشت‌های امنیتی و اطلاعات اتصال Firebase."
            )}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up card-interactive" style={{ animationDelay: "80ms" }}>
          <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90">
            {pick("د سیستم ژبه / زبان سیستم", "زبان سیستم / د سیستم ژبه")}
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {pick(
              "هغه ژبه وټاکئ چې د ټول سیستم لپاره وکارول شي.",
              "زبانی را انتخاب کنید که برای کل سیستم استفاده شود."
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setLang("ps")}
              className={`flex-1 rounded-xl border-2 py-3 px-4 text-sm font-bold transition-all ${
                lang === "ps"
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              <div className="text-base mb-1">🇦🇫</div>
              <div>پښتو</div>
              <div className="text-xs font-normal mt-0.5 opacity-70">Pashto</div>
            </button>
            <button
              onClick={() => setLang("dr")}
              className={`flex-1 rounded-xl border-2 py-3 px-4 text-sm font-bold transition-all ${
                lang === "dr"
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              <div className="text-base mb-1">🇦🇫</div>
              <div>دری</div>
              <div className="text-xs font-normal mt-0.5 opacity-70">Dari</div>
            </button>
          </div>
          <p className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
            {lang === "ps"
              ? "✓ اوس سیستم پښتو ژبه کاروي"
              : "✓ اکنون سیستم زبان دری را استفاده می‌کند"}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up card-interactive" style={{ animationDelay: "160ms" }}>
            <h2 className="mb-4 text-lg font-bold">
              {pick("د ورځني غوښتنو حد", "محدودیت درخواست‌های روزانه")}
            </h2>
            <label className="mb-2 block text-sm font-semibold">
              {pick(
                "هر غوښتونکی په ورځ کې څو غوښتنې ثبتولای شي؟",
                "هر درخواست‌کننده در روز چند درخواست می‌تواند ثبت کند؟"
              )}
            </label>
            <select className="w-full rounded-lg border p-3 text-right" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}>
              {limitOptions.map((limit) => (
                <option key={limit} value={limit}>
                  {limit === 0
                    ? pick("نن هېڅوک غوښتنه نه شي ثبتولای", "امروز هیچ‌کس نمی‌تواند درخواست ثبت کند")
                    : pick(`${limit} غوښتنې`, `${limit} درخواست`)}
                </option>
              ))}
              <option value={50}>{pick("۵۰ غوښتنې", "۵۰ درخواست")}</option>
            </select>
            <Button className="mt-4" onClick={save}>
              {pick("حد خوندي کول", "ذخیره محدودیت")}
            </Button>
            {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up card-interactive" style={{ animationDelay: "220ms" }}>
            <h2 className="mb-4 text-lg font-bold">
              {pick("د فایربیس اتصال طریقه", "روش اتصال Firebase")}
            </h2>
            <ol className="list-decimal space-y-2 pr-5 text-sm leading-7 text-gray-600 dark:text-gray-400">
              <li>{pick("د پروژې په اصلي فولډر کې", "در پوشه اصلی پروژه")} <code>.env.local</code> {pick("فایل جوړ کړئ.", "فایل بسازید.")}</li>
              <li>{pick("د Firebase Console د Project settings له Web app څخه SDK config واخلئ.", "از Firebase Console → Project settings → Web app تنظیمات SDK را بگیرید.")}</li>
              <li>{pick("هماغه values د", "همان values را به شکل")} <code>.env.example</code> {pick("په بڼه کې واچوئ.", "وارد کنید.")}</li>
              <li>{pick("وروسته", "سپس")} <code>npm run dev</code> {pick("بیا چالان کړئ.", "را دوباره اجرا کنید.")}</li>
            </ol>
            <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
              {pick(
                "محرمانه کلیدونه، GitHub token او پاسورډونه په frontend کې مه ساتئ.",
                "کلیدهای محرمانه، GitHub token و رمزها را در frontend نگه ندارید."
              )}
            </p>
          </div>
        </div>

        {/* ─── Permissions Management Section ─── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🛡️</span>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {pick("د صلاحیتونو مدیریت", "مدیریت صلاحیت‌ها")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {pick("د هر رول لپاره د لاسرسي سطح او اجازه‌ناوې", "سطح دسترسی و مجوزها برای هر نقش")}
              </p>
            </div>
          </div>

          {/* Role permission matrix */}
          <div className="space-y-4">
            {(Object.values(ROLES) as string[]).map((role) => {
              const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
              const roleColors: Record<string, string> = {
                [ROLES.SUPER_ADMIN]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/40",
                [ROLES.ADMIN]: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800/40",
                [ROLES.PROCUREMENT_DIRECTOR]: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
                [ROLES.WAREHOUSE_DIRECTOR]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
                [ROLES.WAREHOUSE_ENTRY_PERSON]: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
                [ROLES.REQUESTER]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/40",
                [ROLES.REQUEST_CONFIRMER]: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
              };
              const roleNamePs: Record<string, string> = {
                [ROLES.SUPER_ADMIN]: "سوپر اډمین",
                [ROLES.ADMIN]: "اډمین",
                [ROLES.PROCUREMENT_DIRECTOR]: "د تدارکاتو مدیر",
                [ROLES.WAREHOUSE_DIRECTOR]: "د ګدام مدیر",
                [ROLES.WAREHOUSE_ENTRY_PERSON]: "د ګدام داخلوونکی",
                [ROLES.REQUESTER]: "غوښتونکی",
                [ROLES.REQUEST_CONFIRMER]: "د غوښتنې تاییدوونکی",
              };
              const permLabelPs: Record<string, string> = {
                [PERMISSIONS.MANAGE_USERS]: "کاربران مدیریت",
                [PERMISSIONS.MANAGE_ROLES]: "رولونه مدیریت",
                [PERMISSIONS.VIEW_AUDIT_LOGS]: "آډیټ لاګونه",
                [PERMISSIONS.VIEW_TRASH]: "ژبدار ولیدل",
                [PERMISSIONS.MANAGE_SETTINGS]: "تنظیمات",
                [PERMISSIONS.VIEW_INVENTORY]: "موجودي ولیدل",
                [PERMISSIONS.EDIT_INVENTORY]: "موجودي سمول",
                [PERMISSIONS.VIEW_PROCUREMENT]: "تدارکات ولیدل",
                [PERMISSIONS.MANAGE_PROCUREMENT]: "تدارکات مدیریت",
                [PERMISSIONS.VIEW_RECEIVING]: "تسلیمي ولیدل",
                [PERMISSIONS.MANAGE_RECEIVING]: "تسلیمي مدیریت",
                [PERMISSIONS.CREATE_REQUESTS]: "غوښتنه جوړول",
                [PERMISSIONS.CONFIRM_REQUESTS]: "غوښتنه تاییدول",
                [PERMISSIONS.VIEW_ALL_REQUESTS]: "ټولې غوښتنې",
                [PERMISSIONS.VIEW_REPORTS]: "راپورونه",
              };
              return (
                <div key={role} className={`rounded-xl border p-4 ${roleColors[role] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold opacity-70">{perms.length} {pick("اجازه","مجوز")}</span>
                    <div className="text-right">
                      <p className="font-bold text-sm">{roleNamePs[role] || role}</p>
                      <p className="text-xs opacity-70 font-normal mt-0.5">{role}</p>
                    </div>
                  </div>
                  {perms.length === 0 ? (
                    <p className="text-xs opacity-50 text-center">{pick("هیڅ ځانګړي اجازه نشته","هیچ مجوز خاصی ندارد")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {perms.map((perm) => (
                        <span key={perm} className="text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20 font-medium">
                          {permLabelPs[perm] || perm}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
            {pick("د رولونو اجازه‌ناوې د سیستم کوډ کې ټاکل کیږي.","مجوزهای نقش‌ها در کد سیستم تعریف شده‌اند.")}
          </p>
        </div>

        {/* ─── Email Configuration Section ─── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up" style={{ animationDelay: "280ms" }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 flex items-center gap-2">
                <span className="text-xl">📧</span>
                {pick("د ایمیل تنظیمات", "تنظیمات ایمیل")}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {pick(
                  "د Gmail اپ پاسورډ سره د لیږلو ایمیل تنظیم کړئ. هر ایمیل ادرس باید ۱۶ حروفه اپ پاسورډ ولري.",
                  "ایمیل ارسال را با رمز برنامه Gmail تنظیم کنید. هر آدرس ایمیل باید یک رمز برنامه ۱۶ کاراکتری داشته باشد."
                )}
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setShowForm(true); setEditingId(null); setEmailForm(emptyForm); setEmailMsg(null); }}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
              >
                <span className="text-base leading-none">+</span>
                {pick("نوی ایمیل", "ایمیل جدید")}
              </button>
            )}
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/40 p-5 dark:border-brand-800/40 dark:bg-brand-900/10">
              <h3 className="mb-4 text-sm font-bold text-gray-700 dark:text-white/80">
                {editingId
                  ? pick("د ایمیل سمول", "ویرایش ایمیل")
                  : pick("نوی ایمیل اضافه کول", "افزودن ایمیل جدید")}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {pick("ایمیل ادرس *", "آدرس ایمیل *")}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    placeholder="example@gmail.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                {/* Label */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {pick("نوم / لیبل (اختیاري)", "نام / برچسب (اختیاری)")}
                  </label>
                  <input
                    type="text"
                    value={emailForm.label}
                    onChange={(e) => setEmailForm({ ...emailForm, label: e.target.value })}
                    placeholder={pick("لکه: د اطلاعاتو ایمیل", "مثلاً: ایمیل اطلاع‌رسانی")}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
                {/* App Password */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {editingId
                      ? pick("د اپ پاسورډ (که بدلول غواړئ ۱۶ حروف ولیکئ، که نه خالي پریږدئ)", "رمز برنامه (اگر می‌خواهید تغییر دهید ۱۶ کاراکتر وارد کنید، وگرنه خالی بگذارید)")
                      : pick("د اپ پاسورډ — دقیقاً ۱۶ حروف *", "رمز برنامه — دقیقاً ۱۶ کاراکتر *")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={emailForm.app_password}
                      onChange={(e) => setEmailForm({ ...emailForm, app_password: e.target.value })}
                      maxLength={19}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left tracking-widest placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                    />
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
                      emailForm.app_password.replace(/\s/g, "").length === 16
                        ? "text-green-500"
                        : emailForm.app_password.replace(/\s/g, "").length > 0
                        ? "text-orange-500"
                        : "text-gray-400"
                    }`}>
                      {emailForm.app_password.replace(/\s/g, "").length}/16
                    </span>
                  </div>
                  <div className="mt-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-1">
                      {pick("⚠️ د عادي پاسورډ پر ځای باید د Gmail اپ پاسورډ وکاروئ:", "⚠️ باید از App Password Gmail استفاده کنید، نه رمز عادی:")}
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-amber-700 dark:text-amber-400">
                      <li>{pick("myaccount.google.com ته لاړ شئ", "وارد myaccount.google.com شوید")}</li>
                      <li>{pick("Security → 2-Step Verification (فعال وي)", "Security → 2-Step Verification (باید فعال باشد)")}</li>
                      <li>{pick("App Passwords ته لاړ شئ", "به App Passwords بروید")}</li>
                      <li>{pick("نوی اپ پاسورډ جوړ کړئ (۱۶ حروف)", "یک App Password جدید بسازید (۱۶ کاراکتر)")}</li>
                    </ol>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1.5 font-semibold underline text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200"
                    >
                      {pick("→ د اپ پاسورډ جوړولو لینک", "→ لینک ساخت App Password")}
                    </a>
                  </div>
                </div>
              </div>
              {/* Form actions */}
              <div className="mt-4 flex items-center gap-3 justify-end">
                <button
                  onClick={cancelForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                >
                  {pick("لغو", "انصراف")}
                </button>
                <button
                  onClick={handleEmailSubmit}
                  disabled={emailLoading}
                  className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {emailLoading
                    ? pick("خوندي کیږي...", "در حال ذخیره...")
                    : editingId
                    ? pick("تازه کول", "بروزرسانی")
                    : pick("خوندي کول", "ذخیره")}
                </button>
              </div>
            </div>
          )}

          {/* Feedback message */}
          {emailMsg && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
              emailMsg.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}>
              {emailMsg.type === "success" ? "✓ " : "✗ "}{emailMsg.text}
            </div>
          )}

          {/* Email list */}
          {emailConfigs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-10 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pick("هیڅ ایمیل تنظیم شوی نه دی.", "هیچ ایمیلی تنظیم نشده است.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 dark:border-gray-700 dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-sm font-bold">
                      @
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate" dir="ltr">
                        {config.email}
                      </p>
                      {config.label && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {config.label}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {pick("د اپ پاسورډ:", "رمز برنامه:")} <span dir="ltr" className="font-mono">••••••••••••••••</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Test button */}
                    <button
                      onClick={() => handleTest(config.id)}
                      disabled={testingId === config.id}
                      className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-100 dark:border-green-800/40 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
                      title={pick("د ایمیل ازموینه", "آزمایش ایمیل")}
                    >
                      {testingId === config.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {pick("ازموینه", "آزمایش")}
                    </button>
                    {/* Edit button */}
                    <button
                      onClick={() => handleEdit(config)}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {pick("سمول", "ویرایش")}
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(config.id)}
                      disabled={deletingId === config.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === config.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                      {pick("ړنګول", "حذف")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
