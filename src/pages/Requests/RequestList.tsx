import { useMemo } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { buildRequestsQuery, InventoryRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { useFirestoreQuery } from "../../hooks/useFirestoreQuery";
import { safeSortByCreatedAt } from "../../firebase/safeQuery";

export default function RequestList() {
  const { user, profile, loading: authLoading } = useAuth();

  // Memoize the query to prevent unnecessary re-fetches
  const requestsQuery = useMemo(() => {
    return buildRequestsQuery(profile?.role, user?.uid);
  }, [profile?.role, user?.uid]);

  const { 
    data: unsortedRequests, 
    loading: queryLoading, 
    error, 
    empty 
  } = useFirestoreQuery<InventoryRequest>(requestsQuery, [requestsQuery]);

  // Client-side sorting to avoid Firestore Composite Index requirements
  const requests = useMemo(() => {
    return safeSortByCreatedAt(unsortedRequests, 'desc');
  }, [unsortedRequests]);

  // Total loading state combines auth and query
  const loading = authLoading || (requestsQuery && queryLoading);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft': return "bg-gray-100 text-gray-700";
      case 'Submitted': return "bg-blue-100 text-blue-700";
      case 'Confirmed': return "bg-green-100 text-green-700";
      case 'Rejected': return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <PageMeta title="زما غوښتنو لړۍ | Kandahar University WMS" description="د غوښتنو لیست او لړۍ" />
      <Breadcrumb pageTitle="غوښتنې / درخواست‌ها" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">د غوښتنو لړۍ / لیست درخواست‌ها</h3>
          {profile?.role === ROLES.REQUESTER && (
            <Link to="/requests/create" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition">
              + نوې غوښتنه
            </Link>
          )}
        </div>

        <div className="max-w-full overflow-x-auto">
          {/* STATE HANDLING */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-gray-500">بارول... / در حال بارګیری...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <p className="font-bold">خطا / اشتباه:</p>
              <p>{error}</p>
              <p className="text-xs mt-2 text-gray-400">کومه ستونزه رامنځته شوې ده، مهرباني وکړئ بیا هڅه وکړئ.</p>
            </div>
          ) : !profile ? (
            <div className="text-center py-20 text-orange-500">
              د کاروونکي معلومات ونه موندل شول. / معلومات کاربر پیدا نشد.
            </div>
          ) : empty ? (
            <div className="text-center py-20 text-gray-500">
              تر اوسه کومه غوښتنه نشته. / تا هنوز درخواستی وجود ندارد.
            </div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-800">
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">نیټه</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">پوهنځی / غوښتونکی</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">درجه</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">اجناس</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">حالت</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">پرمختګ</th>
                  <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">عمل</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4 text-xs text-gray-700 dark:text-gray-400 text-right">{r.createdAtHijriShamsi || "-"}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-gray-800 dark:text-white/90">{r.faculty || "ناپیژندل شوی"}</div>
                      <div className="text-xs text-gray-500">{r.requesterName}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-400 text-right">{r.currentRequestLevel || "عادي"}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-400 text-right">
                      {r.items?.length || 0} قلمه
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(r.status)}`}>
                        {r.status === 'Draft' ? 'ډرافټ' : r.status === 'Submitted' ? 'لیږل شوی' : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 ml-auto">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${r.progress || 0}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-500">{r.progress || 0}%</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/requests/details/${r.id}`} className="text-primary text-sm font-bold hover:underline">جزیات</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
