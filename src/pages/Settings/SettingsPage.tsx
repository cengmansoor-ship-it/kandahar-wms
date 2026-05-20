import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getLocalItem, setLocalItem } from "../../firebase/localStore";
import { getCurrentHijriDates } from "../../utils/dateUtils";

const limitOptions = [0, 5, 10, 20, 30];

export default function SettingsPage() {
  const saved = getLocalItem("request_limits", { dailyLimit: 10, updatedAtHijriShamsi: "" });
  const [dailyLimit, setDailyLimit] = useState<number>(Number((saved as any).dailyLimit) || 10);
  const [message, setMessage] = useState("");

  const save = () => {
    const dates = getCurrentHijriDates();
    setLocalItem("request_limits", { dailyLimit, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari });
    setMessage("د ورځني غوښتنو حد خوندي شو او د سیستم فعالیتونو کې د ثبت لپاره چمتو دی.");
  };

  return (
    <>
      <PageMeta title="تنظیمات" description="د سیستم تنظیمات" />
      <Breadcrumb pageTitle="تنظیمات" />
      <div className="space-y-6" dir="rtl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white/90">د سوپر اډمین تنظیمات</h1>
          <p className="mt-2 text-sm text-gray-500">د غوښتنو حد، صلاحیتونه، بیکپ، امنیتي یادښتونه او د فایربیس اتصال معلومات.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold">د ورځني غوښتنو حد</h2>
            <label className="mb-2 block text-sm font-semibold">هر غوښتونکی په ورځ کې څو غوښتنې ثبتولای شي؟</label>
            <select className="w-full rounded-lg border p-3 text-right" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))}>
              {limitOptions.map((limit) => <option key={limit} value={limit}>{limit === 0 ? "نن هېڅوک غوښتنه نه شي ثبتولای" : `${limit} غوښتنې`}</option>)}
              <option value={50}>۵۰ غوښتنې</option>
            </select>
            <Button className="mt-4" onClick={save}>حد خوندي کول</Button>
            {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="mb-4 text-lg font-bold">د فایربیس اتصال طریقه</h2>
            <ol className="list-decimal space-y-2 pr-5 text-sm leading-7 text-gray-600 dark:text-gray-400">
              <li>د پروژې په اصلي فولډر کې <code>.env.local</code> فایل جوړ کړئ.</li>
              <li>د Firebase Console د Project settings له Web app څخه SDK config واخلئ.</li>
              <li>هماغه values د <code>.env.example</code> په بڼه کې واچوئ.</li>
              <li>وروسته <code>npm run dev</code> بیا چالان کړئ.</li>
            </ol>
            <p className="mt-4 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">محرمانه کلیدونه، GitHub token او پاسورډونه په frontend کې مه ساتئ.</p>
          </div>
        </div>
      </div>
    </>
  );
}
