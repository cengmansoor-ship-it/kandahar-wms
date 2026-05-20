import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getRequestById, InventoryRequest, saveFormInstance } from "../../firebase/requests";
import { 
  getOrCreateProcurement, 
  ProcurementRecord, 
  updateProcurementStatus, 
  getVendorOffers, 
  VendorOffer, 
  getComparison,
  createPurchaseOrder,
  createReceiptReport
} from "../../firebase/procurement";
import { useAuth } from "../../context/AuthContext";
import OfficialFormViewer from "../../components/OfficialFormViewer";

export default function ProcurementDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState<InventoryRequest | null>(null);
  const [procurement, setProcurement] = useState<ProcurementRecord | null>(null);
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [activeView, setActiveView] = useState<'details' | 'tender' | 'offers' | 'comparison' | 'winner' | 'po' | 'rr'>('details');
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) fetchData(id);
  }, [id, user]);

  const fetchData = async (requestId: string) => {
    setLoading(true);
    try {
      const reqData = await getRequestById(requestId);
      if (reqData) {
        const procData = await getOrCreateProcurement(reqData, user!.uid);
        const offersData = await getVendorOffers(requestId);
        const compData = await getComparison(requestId);
        setRequest(reqData);
        setProcurement(procData);
        setOffers(offersData);
        setComparison(compData);
      }
    } catch (error) {
      console.error("Error fetching procurement data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTender = async (data: any) => {
    if (!id || !user || !profile) return;
    await saveFormInstance(id, 'Tender', data, user.uid, profile.name);
    await updateProcurementStatus(
      id, 'TenderCreated', 25, 
      { uid: user.uid, name: profile.name, role: profile.role },
      'تدارکات: جګړه پاڼه جوړه شوه / تدارکات: فرم داوطلبی ایجاد شد'
    );
    alert("جګړه پاڼه خوندي شوه.");
    fetchData(id);
    setActiveView('details');
  };

  const handleSavePO = async (data: any) => {
    if (!id || !user || !profile || !comparison) return;
    await saveFormInstance(id, 'PurchaseOrder', data, user.uid, profile.name);
    await createPurchaseOrder(
      id, 
      { id: comparison.winnerVendorId, name: comparison.winnerVendorName, total: comparison.winnerTotalPrice },
      { uid: user.uid, name: profile.name, role: profile.role }
    );
    alert("آمر خریداري خوندي شو.");
    fetchData(id);
    setActiveView('details');
  };

  const handleSaveRR = async (data: any) => {
    if (!id || !user || !profile || !comparison) return;
    await saveFormInstance(id, 'ReceiptReport', data, user.uid, profile.name);
    await createReceiptReport(
      id,
      comparison.winnerVendorName,
      request!.items,
      { uid: user.uid, name: profile.name, role: profile.role }
    );
    alert("راپور رسید خوندي شو.");
    fetchData(id);
    setActiveView('details');
  };

  if (loading) return <div className="p-10 text-center text-gray-500">بارول...</div>;
  if (!request || !procurement) return <div className="p-10 text-center text-red-500">معلومات ونه موندل شول.</div>;

  return (
    <>
      <PageMeta title="د تدارکاتو مدیریت | Kandahar University WMS" description="د تدارکاتي پروسې مدیریت" />
      <Breadcrumb pageTitle="د تدارکاتو مدیریت / مدیریت تدارکات" />

      {activeView === 'tender' ? (
        <div className="h-[85vh]">
          <div className="mb-4"><Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته</Button></div>
          <OfficialFormViewer templateId="formTemplate1" initialData={{}} onSave={handleSaveTender} />
        </div>
      ) : activeView === 'comparison' ? (
        <div className="h-[85vh]">
          <div className="mb-4"><Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته</Button></div>
          <OfficialFormViewer templateId="formTemplate2" initialData={{ vendors: offers.map(o => ({ name: o.vendorName, total: o.totalOfferPrice })) }} onSave={() => alert("فورم مقایسوي خوندي شو.")} />
        </div>
      ) : activeView === 'po' ? (
        <div className="h-[85vh]">
          <div className="mb-4"><Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته</Button></div>
          <OfficialFormViewer templateId="formTemplate3" initialData={{ vendor_name: comparison?.winnerVendorName, total: comparison?.winnerTotalPrice }} onSave={handleSavePO} />
        </div>
      ) : activeView === 'rr' ? (
        <div className="h-[85vh]">
          <div className="mb-4"><Button variant="outline" size="sm" onClick={() => setActiveView('details')}>← بیرته</Button></div>
          <OfficialFormViewer templateId="formTemplate4" initialData={{ vendor_name: comparison?.winnerVendorName }} onSave={handleSaveRR} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د تدارکاتو جزیات</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">ګټونکی شرکت:</p>
                  <p className="font-bold text-green-600">{comparison?.winnerVendorName || "نه دی ټاکل شوی"}</p>
                </div>
                <div>
                  <p className="text-gray-500">مجموعي قیمت:</p>
                  <p className="font-bold text-primary">{comparison?.winnerTotalPrice || 0} افغانۍ</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">د تدارکاتو مدیریت</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveView('tender')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    procurement.status !== 'ProcurementPending' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">۱. جګړه پاڼه / داوطلبي</span>
                  {procurement.status !== 'ProcurementPending' ? '✅' : '⏳'}
                </button>
                
                <button 
                  onClick={() => setActiveView('comparison')}
                  disabled={offers.length < 3}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    offers.length < 3 ? 'opacity-50 cursor-not-allowed grayscale' : 
                    ['ComparisonCreated', 'WinnerSelected', 'PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">۲. فورم مقایسوي</span>
                  {['ComparisonCreated', 'WinnerSelected', 'PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? '✅' : '⏳'}
                </button>

                <button 
                  onClick={() => navigate(`/procurement/winner/${id}`)}
                  disabled={offers.length < 3}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    offers.length < 3 ? 'opacity-50 cursor-not-allowed grayscale' : 
                    ['WinnerSelected', 'PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">۳. د ګټونکي ټاکنه</span>
                  {['WinnerSelected', 'PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? '✅' : '⏳'}
                </button>

                <button 
                  onClick={() => setActiveView('po')}
                  disabled={procurement.status !== 'WinnerSelected' && !procurement.purchaseOrderId}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    !procurement.purchaseOrderId && procurement.status !== 'WinnerSelected' ? 'opacity-50 cursor-not-allowed grayscale' : 
                    ['PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">۴. آمر خریداري</span>
                  {['PurchaseOrderCreated', 'ReceiptReportCreated'].includes(procurement.status) ? '✅' : '⏳'}
                </button>

                <button 
                  onClick={() => setActiveView('rr')}
                  disabled={!procurement.purchaseOrderId && !procurement.receiptReportId}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    !procurement.purchaseOrderId && !procurement.receiptReportId ? 'opacity-50 cursor-not-allowed grayscale' : 
                    procurement.status === 'ReceiptReportCreated' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">۵. راپور رسید / ترلاسه کول</span>
                  {procurement.status === 'ReceiptReportCreated' ? '✅' : '⏳'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">پرمختګ</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">{procurement.progress}%</span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-800">
                  <div style={{ width: `${procurement.progress}%` }} className="bg-primary transition-all duration-500"></div>
                </div>
                <p className="text-xs text-gray-500">{procurement.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
