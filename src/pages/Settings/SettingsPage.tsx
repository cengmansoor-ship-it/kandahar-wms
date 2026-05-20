import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getLocalItem, setLocalItem } from "../../firebase/localStore";
import { getCurrentHijriDates } from "../../utils/dateUtils";
import { useLanguage } from "../../context/LanguageContext";

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
    if (!editingId && emailForm.app_password.length !== 16) {
      return flashEmailMsg(
        pick("د اپ پاسورډ باید دقیقاً ۱۶ حروف وي.", "رمز برنامه باید دقیقاً ۱۶ کاراکتر باشد."),
        "error"
      );
    }
    if (editingId && emailForm.app_password.trim() !== "" && emailForm.app_password.length !== 16) {
      return flashEmailMsg(
        pick("د اپ پاسورډ باید دقیقاً ۱۶ حروف وي.", "رمز برنامه باید دقیقاً ۱۶ کاراکتر باشد."),
        "error"
      );
    }

    setEmailLoading(true);
    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/email-config/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailForm),
        });
      } else {
        res = await fetch("/api/email-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailForm),
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
                      type="password"
                      dir="ltr"
                      value={emailForm.app_password}
                      onChange={(e) => setEmailForm({ ...emailForm, app_password: e.target.value })}
                      maxLength={16}
                      placeholder="xxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-left tracking-widest placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
                    />
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono ${
                      emailForm.app_password.length === 16
                        ? "text-green-500"
                        : emailForm.app_password.length > 0
                        ? "text-orange-500"
                        : "text-gray-400"
                    }`}>
                      {emailForm.app_password.length}/16
                    </span>
                  </div>
                  {!editingId && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {pick(
                        "Google → د حساب تنظیمات → امنیت → د اپ پاسورډ جوړول",
                        "Google → تنظیمات حساب → امنیت → رمزهای برنامه"
                      )}
                    </p>
                  )}
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
                    <button
                      onClick={() => handleEdit(config)}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {pick("سمول", "ویرایش")}
                    </button>
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
