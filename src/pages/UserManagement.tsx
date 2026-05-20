import PageMeta from "../components/common/PageMeta";
import Breadcrumb from "../components/common/Breadcrumb";

export default function UserManagement() {
  return (
    <>
      <PageMeta
        title="د کاروونکو مدیریت | Kandahar University WMS"
        description="د کاروونکو مدیریت پاڼه"
      />
      <Breadcrumb pageTitle="د کاروونکو مدیریت / مدیریت کاربران" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            دا برخه د جوړېدو په حال کې ده...
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            این بخش در حال ساخت است...
          </p>
        </div>
      </div>
    </>
  );
}
