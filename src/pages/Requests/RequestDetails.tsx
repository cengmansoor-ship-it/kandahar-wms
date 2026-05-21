import { useEffect, useState } from "react";
import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { 
  getRequestById, 
  InventoryRequest, 
  saveFormInstance, 
  getFormInstance, 
  updateRequestStage, 
  getPipelineHistory, 
  PipelineRecord 
} from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import OfficialFormViewer from "../../components/OfficialFormViewer";
import PipelineTimeline from "../../components/requests/PipelineTimeline";
import ConfirmerPanel from "../../components/requests/ConfirmerPanel";
import SuperAdminPanel from "../../components/requests/SuperAdminPanel";
import AdminDecisionPanel from "../../components/requests/AdminDecisionPanel";
import { ROLES } from "../../constants/roles";

export default function RequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState<InventoryRequest | null>(null);
  const [pipeline, setPipeline] = useState<PipelineRecord[]>([]);
  const [activeForm, setActiveForm] = useState<'Proposal' | 'SI-9' | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (requestId: string) => {
    setLoading(true);
    try {
      const data = await getRequestById(requestId);
      const history = await getPipelineHistory(requestId);
      setRequest(data ?? null);
      setPipeline(history);
    } catch (error) {
      console.error("Error fetching request data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openForm = async (type: 'Proposal' | 'SI-9') => {
    const formId = type === 'Proposal' ? request?.formInstances.proposalId : request?.formInstances.si9Id;
    if (formId) {
      const instance = await getFormInstance(formId);
      setFormData(instance?.formData || {});
    } else {
      const prefill: any = {};
      if (type === 'Proposal') {
        prefill['faculty_name'] = request?.faculty;
        prefill['reason'] = request?.reason;
        request?.items.forEach((item, idx) => {
          prefill[`item_name_${idx + 1}`] = item.name;
          prefill[`qty_${idx + 1}`] = item.quantity;
          prefill[`unit_${idx + 1}`] = item.unit;
        });
      } else if (type === 'SI-9') {
        prefill['department'] = request?.faculty;
        request?.items.forEach((item, idx) => {
          prefill[`desc_${idx + 1}`] = item.name;
          prefill[`requested_qty_${idx + 1}`] = item.quantity;
          prefill[`unit_${idx + 1}`] = item.unit;
        });
      }
      setFormData(prefill);
    }
    setActiveForm(type);
  };

  const handleSaveForm = async (data: any) => {
    if (!id || !activeForm || !user || !profile) return;
    try {
      await saveFormInstance(id, activeForm, data, user.uid, profile.name);
      alert("فورم په بریالیتوب سره ذخیره شو. / فورم با موفقیت ذخیره شد.");
      fetchData(id);
      setActiveForm(null);
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  const submitRequest = async () => {
    if (!id || !user || !profile) return;
    if (!request?.formInstances.proposalId || !request?.formInstances.si9Id) {
      alert("مهرباني وکړئ لومړی پیشنهاد او سیو ۹ فورمونه ډک کړئ. / لطفا ابتدا فورم‌های پیشنهاد و سیو ۹ را خانه پوری کنید.");
      return;
    }
    try {
      await updateRequestStage(
        id, 
        'Submitted', 
        0, 
        'غوښتنه واستول شوه / درخواست ارسال شد', 
        { uid: user.uid, name: profile.name, role: profile.role },
        "غوښتنه نهایي او واستول شوه."
      );
      alert("غوښتنه په بریالیتوب سره واستول شوه. / درخواست با موفقیت ارسال شد.");
      fetchData(id);
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  const canShowConfirmerPanel = profile?.role === ROLES.REQUEST_CONFIRMER && request?.status === 'Submitted';
  const canShowSuperAdminPanel = profile?.role === ROLES.SUPER_ADMIN && request?.status === 'ConfirmedByRequestConfirmer';
  const canShowAdminPanel = (profile?.role === ROLES.ADMIN || profile?.role === ROLES.SUPER_ADMIN) && request?.status === 'ApprovedBySuperAdmin';

  if (loading) return <div className="p-10 text-center text-gray-500">بارول...</div>;
  if (!request) return <div className="p-10 text-center text-red-500">غوښتنه ونه موندل شوه.</div>;

  return (
    <>
      <PageMeta title="د غوښتنې جزیات | Kandahar University WMS" description="د غوښتنې جزیات او فورمونه" />
      <Breadcrumb pageTitle="د غوښتنې جزیات / جزیات درخواست" />

      {activeForm ? (
        <div className="h-[85vh]">
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => setActiveForm(null)}>← بیرته / بازګشت</Button>
          </div>
          <OfficialFormViewer 
            templateId={activeForm === 'Proposal' ? 'formTemplate0' : 'formTemplate5'} 
            initialData={formData}
            onSave={handleSaveForm}
            readOnly={request.status !== 'Draft'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex justify-between items-start mb-6 border-b pb-4 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">{request.faculty}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{request.departmentOrPerson}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    request.status === 'Draft' ? 'bg-gray-100 text-gray-600' :
                    request.status.includes('Rejected') ? 'bg-red-100 text-red-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {request.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">{request.createdAtHijriShamsi}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-1">د غوښتنې علت:</h4>
                  <p className="text-gray-800 dark:text-white/80">{request.reason}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-500 mb-1">درجه:</h4>
                  <p className="text-gray-800 dark:text-white/80">{request.currentRequestLevel}</p>
                </div>
                {request.rejectionComment && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-red-700 mb-1">د ردیدو علت:</h4>
                    <p className="text-red-600">{request.rejectionComment}</p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-3 border-b pb-2 dark:border-gray-700">غوښتل شوي اجناس:</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase">
                        <th className="py-2">جنس</th>
                        <th className="py-2">مقدار</th>
                        <th className="py-2">واحد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.items.map((item, idx) => (
                        <tr key={idx} className="border-t dark:border-gray-800">
                          <td className="py-3 font-medium text-gray-800 dark:text-white/90">{item.name}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{item.quantity}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Role-Based Action Panels */}
            {canShowConfirmerPanel && (
              <ConfirmerPanel 
                requestId={id!} 
                currentLevel={request.currentRequestLevel} 
                user={{ uid: user!.uid, name: profile!.name, role: profile!.role }}
                onUpdate={() => fetchData(id!)}
              />
            )}

            {canShowSuperAdminPanel && (
              <SuperAdminPanel 
                requestId={id!} 
                user={{ uid: user!.uid, name: profile!.name, role: profile!.role }}
                onUpdate={() => fetchData(id!)}
              />
            )}

            {canShowAdminPanel && (
              <AdminDecisionPanel 
                requestId={id!} 
                items={request.items}
                user={{ uid: user!.uid, name: profile!.name, role: profile!.role }}
                onUpdate={() => fetchData(id!)}
              />
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-6 border-b pb-2 dark:border-gray-700">د اجرااتو تاریخچه / تاریخچه اجراات</h3>
              <PipelineTimeline history={pipeline} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">رسمي فورمونه</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => openForm('Proposal')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    request.formInstances.proposalId ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">پیشنهاد / پروپوزل</span>
                  {request.formInstances.proposalId ? '✅' : '⏳'}
                </button>
                <button 
                  onClick={() => openForm('SI-9')}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${
                    request.formInstances.si9Id ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  <span className="font-bold text-sm">سیو ۹ / فورم SI-9</span>
                  {request.formInstances.si9Id ? '✅' : '⏳'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">پرمختګ / پیشرفت</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                      {request.progress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-800">
                  <div style={{ width: `${request.progress}%` }} className="shadow-none flex flex-col text-center white-space-nowrap text-white justify-center bg-primary transition-all duration-500"></div>
                </div>
                <p className="text-xs text-gray-500">
                  {request.currentStage}
                </p>
              </div>
            </div>

            {request.status === 'Draft' && profile?.role === ROLES.REQUESTER && (
              <div className="rounded-2xl border border-dashed border-primary bg-primary/5 p-6 text-center">
                <p className="text-sm text-primary mb-4 font-bold">غوښتنه وروستۍ کړئ!</p>
                <Button onClick={submitRequest} variant="primary" fullWidth>استول / ارسال</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
