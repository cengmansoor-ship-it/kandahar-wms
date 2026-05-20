import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";

const phases = [
  "غوښتنه، پیشنهاد او سیو ۹",
  "د غوښتنې تایید او درجه",
  "د سوپر اډمین تایید",
  "د اډمین د موجودۍ پرېکړه",
  "ګدامي مسیر یا تدارکاتي مسیر",
  "جګړه پاڼه او درې قیمتونه",
  "مقایسوي فورم او ګټونکی شرکت",
  "آمر خریداري",
  "راپور رسید او موجودۍ ته داخلول",
  "ف س ۵، تسلیمي او اتومات کمول",
  "راپورونه، بیکپ، امنیت او وړاندوینه",
];

export default function AboutPage() {
  return (
    <>
      <PageMeta title="زموږ په اړه" description="د پروژې معلومات" />
      <Breadcrumb pageTitle="زموږ په اړه" />
      <div className="space-y-6" dir="rtl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">د کندهار پوهنتون د عمومي ګدام او تدارکاتو مدیریت سیستم</h1>
          <p className="mt-3 leading-8 text-gray-600 dark:text-gray-400">دا سیستم د پوهنتون د اجناسو غوښتنې، تایید، تدارکاتو، رسید، ګدام ته داخلولو، تسلیمۍ، موجودۍ کمولو، راپورونو، بیکپ او تعقیب لپاره جوړ شوی دی.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {phases.map((phase, index) => (
            <div key={phase} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">فاز {index + 1}</span>
              <h2 className="mt-3 font-bold text-gray-800 dark:text-white/90">{phase}</h2>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
