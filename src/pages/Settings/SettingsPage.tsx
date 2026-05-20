import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getLocalItem, setLocalItem } from "../../firebase/localStore";
import { getCurrentHijriDates } from "../../utils/dateUtils";
import { useLanguage } from "../../context/LanguageContext";

const limitOptions = [0, 5, 10, 20, 30];

export default function SettingsPage() {
  const saved = getLocalItem("request_limits", { dailyLimit: 10, updatedAtHijriShamsi: "" });
  const [dailyLimit, setDailyLimit] = useState<number>(Number((saved as any).dailyLimit) || 10);
  const [message, setMessage] = useState("");
  const { lang, setLang, pick } = useLanguage();

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
      </div>
    </>
  );
}
