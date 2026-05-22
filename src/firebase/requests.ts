import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getDemoRequests, saveDemoRequests, getDemoPipeline, saveDemoPipeline, getDemoLevelHistory, setLocalItem, getLocalItem, makeLocalId } from "./localStore";
import { getCurrentHijriDates } from "../utils/dateUtils";
import { logAuditEvent } from "./audit";
import { ROLES } from "../constants/roles";
import { getItemById } from "./inventory";
import { apiClient } from "../api/apiClient";

const mapRequestFromApi = (apiReq: any): InventoryRequest => ({
  id: apiReq.id ? apiReq.id.toString() : "",
  requesterId: apiReq.requester_id?.toString() || "",
  requesterName: apiReq.requester_name || "",
  faculty: apiReq.faculty_name || "",
  departmentOrPerson: apiReq.department_name || apiReq.person_name || "",
  reason: apiReq.notes || "",
  items: (apiReq.items || []).map((i: any) => ({
    itemId: i.item_id?.toString() || "",
    name: i.item_name || i.item_code || "",
    unit: i.unit_name || "",
    quantity: Number(i.quantity) || 0
  })),
  status: apiReq.status || "Submitted",
  progress: Number(apiReq.progress_percent) || 0,
  currentStage: apiReq.status || "Submitted",
  originalRequestLevel: apiReq.request_level || "عادي",
  currentRequestLevel: apiReq.request_level || "عادي",
  createdAt: apiReq.created_at ? new Date(apiReq.created_at).getTime() : Date.now(),
  createdAtHijriShamsi: "",
  createdAtHijriQamari: "",
  updatedAt: apiReq.updated_at ? new Date(apiReq.updated_at).getTime() : Date.now(),
  updatedAtHijriShamsi: "",
  updatedAtHijriQamari: "",
  formInstances: {},
  rejectionComment: ""
});

// --- Types ---

export interface PipelineRecord {
  id?: string;
  requestId: string;
  stage: string;
  status: string;
  progress: number;
  actionBy: string;
  actionByName: string;
  actionByRole: string;
  comment: string;
  createdAt: number;
  createdAtHijriShamsi: string;
  createdAtHijriQamari: string;
}

export interface RequestLevelRecord {
  id?: string;
  requestId: string;
  oldLevel: string;
  newLevel: string;
  changedBy: string;
  changedByName: string;
  changedByRole: string;
  comment: string;
  changedAt: number;
  changedAtHijriShamsi: string;
  changedAtHijriQamari: string;
}

export interface RequestItem {
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
}

export interface InventoryRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  faculty: string;
  departmentOrPerson: string;
  reason: string;
  items: RequestItem[];
  status: string;
  progress: number;
  currentStage: string;
  originalRequestLevel: string;
  currentRequestLevel: string;
  createdAt: number;
  createdAtHijriShamsi: string;
  createdAtHijriQamari: string;
  updatedAt: number;
  updatedAtHijriShamsi: string;
  updatedAtHijriQamari: string;
  formInstances: {
    proposalId?: string;
    si9Id?: string;
  };
  rejectionComment?: string;
}

export interface OfficialFormInstance {
  id: string;
  requestId: string;
  formType: 'Proposal' | 'Tender' | 'Comparison' | 'PurchaseOrder' | 'ReceiptReport' | 'SI-9' | 'FS-5';
  formData: any;
  createdAt: number;
  updatedAt: number;
}

const REQUESTS_COL = "requests";
const FORMS_COL = "official_form_instances";
const PIPELINE_COL = "request_pipeline";
const LEVEL_HISTORY_COL = "request_level_history";

// --- Service Functions ---

export const createRequest = async (requestData: Partial<InventoryRequest>, userId: string, userName: string) => {
  const dates = getCurrentHijriDates();

  try {
    const apiPayload = {
      notes: requestData.reason || "",
      request_level: requestData.originalRequestLevel || "عادي",
      items: (requestData.items || []).map(i => ({
        item_id: parseInt(i.itemId) || null,
        item_name: i.name,
        quantity: i.quantity,
      }))
    };
    const response = await apiClient.post('/requests', apiPayload);
    return response.id?.toString() || "";
  } catch (apiError) {
    console.warn("Backend createRequest failed; falling back to Firebase/Local");
    if (!isFirebaseConfigured) {
      const requestId = makeLocalId("request");
      const newRequest: InventoryRequest = {
        id: requestId,
        requesterId: userId,
        requesterName: userName,
        faculty: requestData.faculty || "",
        departmentOrPerson: requestData.departmentOrPerson || "",
        reason: requestData.reason || "",
        items: requestData.items || [],
        status: "Submitted",
        progress: 0,
        currentStage: "Submitted",
        originalRequestLevel: requestData.originalRequestLevel || "عادي",
        currentRequestLevel: requestData.originalRequestLevel || "عادي",
        createdAt: dates.timestamp,
        createdAtHijriShamsi: dates.shamsi,
        createdAtHijriQamari: dates.qamari,
        updatedAt: dates.timestamp,
        updatedAtHijriShamsi: dates.shamsi,
        updatedAtHijriQamari: dates.qamari,
        formInstances: {},
      };
      saveDemoRequests([newRequest, ...getDemoRequests()]);
      saveDemoPipeline([
        {
          id: makeLocalId("pipe"),
          requestId,
          stage: "Submitted",
          status: "Submitted",
          progress: 0,
          actionBy: userId,
          actionByName: userName,
          actionByRole: "Super Admin",
          comment: "Demo request created",
          createdAt: dates.timestamp,
          createdAtHijriShamsi: dates.shamsi,
          createdAtHijriQamari: dates.qamari,
        },
        ...getDemoPipeline(),
      ]);
      return requestId;
    }
  }

  const reqRef = doc(collection(db, REQUESTS_COL));
  
  const newRequest: InventoryRequest = {
    id: reqRef.id,
    requesterId: userId,
    requesterName: userName,
    faculty: requestData.faculty || "",
    departmentOrPerson: requestData.departmentOrPerson || "",
    reason: requestData.reason || "",
    items: requestData.items || [],
    status: 'Draft',
    progress: 0,
    currentStage: 'Draft',
    originalRequestLevel: requestData.originalRequestLevel || "عادي",
    currentRequestLevel: requestData.originalRequestLevel || "عادي",
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
    createdAtHijriQamari: dates.qamari,
    updatedAt: dates.timestamp,
    updatedAtHijriShamsi: dates.shamsi,
    updatedAtHijriQamari: dates.qamari,
    formInstances: {},
  };

  await setDoc(reqRef, newRequest);
  await logAuditEvent(userId, userName, 'request_created' as any, { requestId: reqRef.id });
  return reqRef.id;
};

export const addPipelineRecord = async (requestId: string, data: Partial<PipelineRecord>) => {
  const dates = getCurrentHijriDates();

  if (!isFirebaseConfigured) {
    saveDemoPipeline([
      {
        id: makeLocalId("pipe"),
        requestId,
        stage: data.stage || "",
        status: data.status || "",
        progress: data.progress || 0,
        actionBy: data.actionBy || "demo-super-admin",
        actionByName: data.actionByName || "Super Admin",
        actionByRole: data.actionByRole || "Super Admin",
        comment: data.comment || "",
        createdAt: dates.timestamp,
        createdAtHijriShamsi: dates.shamsi,
        createdAtHijriQamari: dates.qamari,
      },
      ...getDemoPipeline(),
    ]);
    return;
  }

  const ref = collection(db, PIPELINE_COL);
  await addDoc(ref, {
    ...data,
    requestId,
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
    createdAtHijriQamari: dates.qamari,
  });
};

export const updateRequestStage = async (
  requestId: string, 
  status: string, 
  progress: number, 
  stage: string, 
  user: { uid: string, name: string, role: string },
  comment: string = ""
) => {
  const dates = getCurrentHijriDates();

  try {
    await apiClient.put(`/requests/${requestId}/status`, {
      status,
      stage_label: stage,
      action_by_name: user.name,
      action_by_role: user.role,
      comment,
    });
  } catch (apiError) {
    console.warn("Backend updateRequestStage failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const updatedRequests = getDemoRequests().map((request) =>
      request.id === requestId
        ? {
            ...request,
            status,
            progress,
            currentStage: stage,
            rejectionComment: status.includes("Rejected") ? comment : "",
            updatedAt: dates.timestamp,
            updatedAtHijriShamsi: dates.shamsi,
            updatedAtHijriQamari: dates.qamari,
          }
        : request
    );
    saveDemoRequests(updatedRequests);
    await addPipelineRecord(requestId, {
      stage,
      status,
      progress,
      actionBy: user.uid,
      actionByName: user.name,
      actionByRole: user.role,
      comment,
    });
    return;
  }

  const reqRef = doc(db, REQUESTS_COL, requestId);
  
  await updateDoc(reqRef, {
    status,
    progress,
    currentStage: stage,
    rejectionComment: status.includes('Rejected') ? comment : "",
    updatedAt: dates.timestamp,
    updatedAtHijriShamsi: dates.shamsi,
    updatedAtHijriQamari: dates.qamari,
  });

  await addPipelineRecord(requestId, {
    stage,
    status,
    progress,
    actionBy: user.uid,
    actionByName: user.name,
    actionByRole: user.role,
    comment
  });

  await logAuditEvent(user.uid, user.name, 'request_stage_changed' as any, { requestId, status, stage });
};

export const changeRequestLevel = async (
  requestId: string, 
  newLevel: string, 
  oldLevel: string, 
  user: { uid: string, name: string, role: string },
  comment: string = ""
) => {
  const dates = getCurrentHijriDates();

  try {
    await apiClient.put(`/requests/${requestId}/level`, { new_level: newLevel, reason: comment });
  } catch (apiError) {
    console.warn("Backend changeRequestLevel failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const requests = getDemoRequests().map((request) =>
      request.id === requestId
        ? {
            ...request,
            currentRequestLevel: newLevel,
            updatedAt: dates.timestamp,
            updatedAtHijriShamsi: dates.shamsi,
            updatedAtHijriQamari: dates.qamari,
          }
        : request
    );
    saveDemoRequests(requests);
    const history = getDemoLevelHistory();
    setLocalItem("request_level_history", [
      {
        id: makeLocalId("level"),
        requestId,
        oldLevel,
        newLevel,
        changedBy: user.uid,
        changedByName: user.name,
        changedByRole: user.role,
        comment,
        changedAt: dates.timestamp,
        changedAtHijriShamsi: dates.shamsi,
        changedAtHijriQamari: dates.qamari,
      },
      ...history,
    ]);
    return;
  }

  const reqRef = doc(db, REQUESTS_COL, requestId);
  
  await updateDoc(reqRef, {
    currentRequestLevel: newLevel,
    updatedAt: dates.timestamp,
    updatedAtHijriShamsi: dates.shamsi,
    updatedAtHijriQamari: dates.qamari,
  });

  await addDoc(collection(db, LEVEL_HISTORY_COL), {
    requestId,
    oldLevel,
    newLevel,
    changedBy: user.uid,
    changedByName: user.name,
    changedByRole: user.role,
    comment,
    changedAt: dates.timestamp,
    changedAtHijriShamsi: dates.shamsi,
    changedAtHijriQamari: dates.qamari,
  });

  await logAuditEvent(user.uid, user.name, 'request_level_changed' as any, { requestId, oldLevel, newLevel });
};

export const checkStockAvailability = async (items: RequestItem[]) => {
  const results = [];
  for (const item of items) {
    const invItem = await getItemById(item.itemId);
    results.push({
      itemId: item.itemId,
      name: item.name,
      requested: item.quantity,
      available: invItem?.currentQuantity || 0,
      isAvailable: (invItem?.currentQuantity || 0) >= item.quantity,
      shortage: Math.max(0, item.quantity - (invItem?.currentQuantity || 0))
    });
  }
  return results;
};

export const getRequests = async (filters: { requesterId?: string } = {}) => {
  try {
    const apiReqs = await apiClient.get('/requests');
    let mapped = apiReqs.map(mapRequestFromApi);
    if (filters.requesterId) {
      mapped = mapped.filter((r: any) => r.requesterId === filters.requesterId);
    }
    return mapped;
  } catch (apiError) {
    console.warn("Backend getRequests failed; falling back to Firebase/Local");
    if (!isFirebaseConfigured) {
      const requests = getDemoRequests();
      return filters.requesterId
        ? requests.filter((request) => request.requesterId === filters.requesterId)
        : requests;
    }

    try {
      let q = query(collection(db, REQUESTS_COL));
      if (filters.requesterId) {
        q = query(q, where("requesterId", "==", filters.requesterId));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryRequest));
    } catch (error) {
      console.warn("Firebase getRequests failed; using demo requests:", error);
      const requests = getDemoRequests();
      return filters.requesterId
        ? requests.filter((request) => request.requesterId === filters.requesterId)
        : requests;
    }
  }
};

export const getRequestById = async (id: string) => {
  try {
    const apiReq = await apiClient.get(`/requests/${id}`);
    if (apiReq) return mapRequestFromApi(apiReq);
  } catch (apiError) {
    console.warn(`Backend getRequestById failed for ${id}; falling back to Firebase/Local`);
    if (!isFirebaseConfigured) {
      return getDemoRequests().find((request) => request.id === id) || null;
    }

    try {
      const snap = await getDoc(doc(db, REQUESTS_COL, id));
      if (snap.exists()) return { id: snap.id, ...snap.data() } as InventoryRequest;
      return null;
    } catch (error) {
      console.warn("Firebase getRequestById failed; using demo request:", error);
      return getDemoRequests().find((request) => request.id === id) || null;
    }
  }
};

export const getPipelineHistory = async (requestId: string): Promise<PipelineRecord[]> => {
  try {
    const data = await apiClient.get(`/requests/${requestId}/pipeline`);
    if (data && Array.isArray(data.pipeline) && data.pipeline.length > 0) {
      return data.pipeline.map((row: any): PipelineRecord => ({
        id: row.id?.toString(),
        requestId: requestId,
        stage: row.stage_label || row.status || "",
        status: row.status || "",
        progress: Number(row.progress) || 0,
        actionBy: row.action_by || "",
        actionByName: row.action_by_name || row.actor_name || "",
        actionByRole: row.action_by_role || "",
        comment: row.comment || "",
        createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        createdAtHijriShamsi: "",
        createdAtHijriQamari: "",
      }));
    }
  } catch (apiError) {
    console.warn("Backend getPipelineHistory failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    return getDemoPipeline().filter((record) => record.requestId === requestId).sort((a, b) => a.createdAt - b.createdAt);
  }

  try {
    const q = query(collection(db, PIPELINE_COL), where("requestId", "==", requestId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PipelineRecord);
  } catch (error) {
    console.warn("Firebase getPipelineHistory failed; using demo pipeline:", error);
    return getDemoPipeline().filter((record) => record.requestId === requestId).sort((a, b) => a.createdAt - b.createdAt);
  }
};

export const getLevelHistory = async (requestId: string) => {
  if (!isFirebaseConfigured) {
    return getDemoLevelHistory()
      .filter((record) => record.requestId === requestId)
      .sort((a, b) => a.changedAt - b.changedAt);
  }

  try {
    const q = query(collection(db, LEVEL_HISTORY_COL), where("requestId", "==", requestId), orderBy("changedAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as RequestLevelRecord);
  } catch (error) {
    console.warn("Firebase getLevelHistory failed:", error);
    return [];
  }
};

export const buildRequestsQuery = (role: string | undefined, userId: string | undefined) => {
  if (!role || !userId) return null;
  let q = query(collection(db, REQUESTS_COL));
  if (role === ROLES.REQUESTER) {
    q = query(q, where("requesterId", "==", userId));
  } else if (role === ROLES.REQUEST_CONFIRMER) {
    q = query(q, where("status", "in", ["Submitted", "ConfirmedByRequestConfirmer", "RejectedByRequestConfirmer", "ApprovedBySuperAdmin", "StockAvailable", "StockNotAvailable"]));
  } else if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
    // See all
  } else {
    return null;
  }
  return q;
};

export const saveFormInstance = async (requestId: string, formType: OfficialFormInstance['formType'], formData: any, userId: string, userName: string) => {
  const dates = getCurrentHijriDates();

  if (!isFirebaseConfigured) {
    const formId = makeLocalId("form");
    const instance: OfficialFormInstance = {
      id: formId,
      requestId,
      formType,
      formData,
      createdAt: dates.timestamp,
      updatedAt: dates.timestamp,
    };
    const forms = getLocalItem<OfficialFormInstance[]>("official_form_instances", []);
    setLocalItem("official_form_instances", [instance, ...forms]);
    const requests = getDemoRequests().map((request) => {
      if (request.id !== requestId) return request;
      const formInstances = { ...request.formInstances };
      if (formType === "Proposal") formInstances.proposalId = formId;
      if (formType === "SI-9") formInstances.si9Id = formId;
      return { ...request, formInstances, updatedAt: dates.timestamp, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari };
    });
    saveDemoRequests(requests);
    return formId;
  }

  const formRef = doc(collection(db, FORMS_COL));
  const instance: OfficialFormInstance = {
    id: formRef.id,
    requestId,
    formType,
    formData,
    createdAt: dates.timestamp,
    updatedAt: dates.timestamp,
  };
  await setDoc(formRef, instance);
  const fieldName = formType === 'Proposal' ? 'formInstances.proposalId' : formType === 'SI-9' ? 'formInstances.si9Id' : null;
  if (fieldName) {
    await updateDoc(doc(db, REQUESTS_COL, requestId), { [fieldName]: formRef.id, updatedAt: dates.timestamp });
  }
  await logAuditEvent(userId, userName, (formType.toLowerCase().replace('-', '') + '_saved') as any, { requestId, formId: formRef.id });
  return formRef.id;
};

export const getFormInstance = async (id: string) => {
  if (!isFirebaseConfigured) {
    return getLocalItem<OfficialFormInstance[]>("official_form_instances", []).find((instance) => instance.id === id) || null;
  }
  const snap = await getDoc(doc(db, FORMS_COL, id));
  if (snap.exists()) return snap.data() as OfficialFormInstance;
  return null;
};
