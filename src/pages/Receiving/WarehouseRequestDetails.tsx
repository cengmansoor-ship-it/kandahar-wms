import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getRequestById, InventoryRequest, saveFormInstance } from "../../firebase/requests";
import { createFS5, finalizeDelivery, receiveProcurementToInventory } from "../../firebase/receiving";
import { createReceiptReport, getComparison } from "../../firebase/procurement";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import OfficialFormViewer from "../../components/OfficialFormViewer";
import { getDemoUsers } from "../../firebase/localStore";
import type { ComparisonRecord } from "../../firebase/procurement";

export default function WarehouseRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState<InventoryRequest | null>(null);
  const [activeView, setActiveView] = useState<'details' | 'fs5' | 'rr'>('details');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonRecord | null>(null);
  const { user, profile } = useAuth();
  const { pick } = useLanguage();

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (requestId: string) => {
    setLoading(true);
    const data = await getRequestById(requestId);
    setRequest(data ?? null);
    setLoading(false);
  };

  const saveRR = async (data: any): Promise<boolean> => {
    if (!id || !user || !profile || !request) return false;
    try {
      const compData = comparison || await getComparison(id);
      const winnerName = compData?.winnerVendorName || '';
      await saveFormInstance(id, 'ReceiptReport', data, user.uid, profile.name);
      await createReceiptReport(id, winnerName, request.items, { uid: user.uid, name: profile.name, role: profile.role });
      return true;
    } catch (error: any) {
      alert(error.message);
      return false;
    }
  };

  const handleSaveRR = async (data: any) => {
    setActionLoading(true);
    const ok = await saveRR(data);
    if (ok) {
      fetchData(id);
      setActiveView('details');
    }
    setActionLoading(false);
  };

  const handleRRPrint = async (data: any) => {
    setActionLoading(true);
    const ok = await saveRR(data);
    if (!ok) { setActionLoading(false); return; }

    if (!id || !request) return;
    const users = getDemoUsers();
    const requesterUser = users.find(u => u.uid === request.requesterId);
    const requesterEmail = requesterUser?.email || '';

    const params = new URLSearchParams({ requestId: id, to: requesterEmail });
    window.location.href = `/notifications?${params.toString()}`;
  };

  const handleSaveFS5 = async (data: any) => {
    if (!id || !user || !profile || !request) return;
    setActionLoading(true);
    try {
      await saveFormInstance(id, 'FS-5', data, user.uid, profile.name);
      await createFS5(id, request.items, { uid: user.uid, name: profile.name, role: profile.role }, { 
        id: request.requesterId, 
        name: request.requesterName, 
        faculty: request.faculty 
      });
      alert("ف، س، ۵ فورم خوندي شو.");
      fetchData(id);
      setActiveView('details');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveToInventory = async () => {
    if (!id || !user || !profile || !request) return;
    setActionLoading(true);
    try {
      const result: any = await receiveProcurementToInventory(id, request.items, { uid: user.uid, name: profile.name, role: profile.role });
      if (result?.requesterId) {
        const users = getDemoUsers();
        const requesterUser = users.find(u => u.uid === result.requesterId);
        const requesterEmail = requesterUser?.email || '';
        const params = new URLSearchParams({ requestId: id, to: requesterEmail });
        window.location.href = `/notifications?${params.toString()}`;
      } else {
        alert("اجناس موجودۍ ته داخل شول.");
        fetchData(id);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!id || !user || !profile || !request) return;
    if (!window.confirm("ایا تاسو باوري یاست چې اجناس سپارل غواړئ؟ له دې سره به موجودي کمه شي.")) return;
    
    setActionLoading(true);
    try {
      await finalizeDelivery(id, { uid: user.uid, name: profile.name, role: profile.role }, {
        items: request.items,
        requesterName: request.requesterName,
        receiverName: request.requesterName,
        receiverId: request.requesterId,
      });
      alert("اجناس په بریالیتوب سره وسپارل شول او موجودي کمه شوه.");
      fetchData(id);
    } catch (error: any) {
      alert(`تېروتنه: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 italic">بارول...</div>;
  if (!request) return <div className="p-10 text-center text-red-500">غوښتنه ونه موندل شول.</div>;

  const showReceiveBtn = request.status === 'ReceiptReportCreated';
  const showRRBtn = request.status === 'PurchaseOrderCreated';
  const showFS5Btn = ['StockAvailable', 'ReceivedToInventory', 'DeliveryReferredToWarehouse'].includes(request.status);
  const showDeliverBtn = request.status === 'FS5Created';

  const openRRForm = async () => {
    if (!id) return;
    const compData = await getComparison(id);
    setComparison(compData);
    setActiveView('rr');
  };

  return (
    <>
      <PageMeta title="د سپارلو مدیریت | Kandahar University WMS" description="د اجناسو سپارلو مدیریت" />
      <Breadcrumb pageTitle={pick("د سپارلو مدیریت", "مدیریت تحویلی")} />

      {activeView === 'rr' ? (
        <div className="h-[85vh]">
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته ورشئ</Button>
          </div>
          <OfficialFormViewer 
            templateId="formTemplate4" 
            initialData={{ vendor_name: comparison?.winnerVendorName || '' } as any}
            onSave={handleSaveRR}
            onPrint={handleRRPrint}
            autoSaveOnPrint={false}
            userId={user?.uid || ''}
          />
        </div>
      ) : activeView === 'fs5' ? (
        <div className="h-[85vh]">
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته ورشئ</Button>
          </div>
          <OfficialFormViewer 
            templateId="formTemplate6" 
            initialData={{
              receiver_name: request.requesterName,
              faculty: request.faculty,
              items: request.items.map(i => ({ name: i.name, qty: i.quantity, unit: i.unit }))
            } as any}
            onSave={handleSaveFS5}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د ویش پړاوونه</h3>
              <div className="space-y-4">
                {showRRBtn && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <p className="text-indigo-700 text-sm font-bold mb-3">لومړی د تدارکاتو راپور رسید فورم ډک کړئ:</p>
                    <Button onClick={openRRForm} disabled={actionLoading} fullWidth>
                      {actionLoading ? pick("یو لحظه...", "لطفا صبر کنید...") : pick("راپور رسید جوړول", "ایجاد راپور رسید")}
                    </Button>
                  </div>
                )}

                {showReceiveBtn && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <p className="text-orange-700 text-sm font-bold mb-3">تدارکاتي اجناس موجودۍ ته داخل کړئ:</p>
                    <Button onClick={handleReceiveToInventory} disabled={actionLoading} fullWidth variant="primary">
                      {actionLoading ? pick("یو لحظه...", "لطفا صبر کنید...") : pick("موجودۍ ته داخلول", "ورود به گدام")}
                    </Button>
                  </div>
                )}

                {showFS5Btn && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-blue-700 text-sm font-bold mb-3">د ویش لپاره ف، س، ۵ فورم ډک کړئ:</p>
                    <Button onClick={() => setActiveView('fs5')} disabled={actionLoading} fullWidth>
                      {actionLoading ? pick("یو لحظه...", "لطفا صبر کنید...") : pick("+ ف، س، ۵ جوړول", "+ ایجاد ف، س، ۵")}
                    </Button>
                  </div>
                )}

                {showDeliverBtn && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <p className="text-purple-700 text-sm font-bold mb-3">آیا اجناس غوښتونکي ته وسپارل شول؟ (نهایي مرحله):</p>
                    <button 
                      onClick={handleDeliver} 
                      disabled={actionLoading}
                      className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                    >
                      {actionLoading ? "اجرا کیږي..." : "نهایي سپارنه او موجودي کمول"}
                    </button>
                    <p className="mt-2 text-[10px] text-center text-purple-400 font-bold">پاملرنه: له دې مرحله وروسته موجودي کمه او غوښتنه بشپړېږي.</p>
                  </div>
                )}

                {request.status === 'Delivered' && (
                  <div className="p-10 text-center bg-green-50 border border-green-100 rounded-2xl">
                    <div className="text-4xl mb-2">✅</div>
                    <h4 className="text-green-700 font-bold text-xl">غوښتنه په بریالیتوب سره بشپړه شوه!</h4>
                    <p className="text-green-600 text-sm mt-1">اجناس وسپارل شول او موجودي کمه شوه.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د غوښتنې اجناس</h3>
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="py-2">جنس</th>
                    <th className="py-2">غوښتل شوی مقدار</th>
                    <th className="py-2">واحد</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((i, idx) => (
                    <tr key={idx} className="border-t dark:border-gray-800">
                      <td className="py-3 font-medium text-gray-800 dark:text-white/90">{i.name}</td>
                      <td className="py-3 text-gray-600">{i.quantity}</td>
                      <td className="py-3 text-gray-600">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">پرمختګ</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">{request.progress}%</span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-800">
                  <div style={{ width: `${request.progress}%` }} className="bg-primary transition-all duration-500"></div>
                </div>
                <p className="text-xs text-gray-500">{request.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
