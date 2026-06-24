import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getLocalItem, setLocalItem, makeLocalId } from "./localStore";
import { getCurrentHijriDates } from "../utils/dateUtils";
import { logAuditEvent } from "./audit";
import { updateRequestStage, InventoryRequest } from "./requests";
import { apiClient } from "../api/apiClient";

const mapProcurementFromApi = (apiProc: any): ProcurementRecord => ({
  id: apiProc.id ? apiProc.id.toString() : "",
  requestId: apiProc.request_id?.toString() || "",
  requesterId: "",
  requesterName: "",
  requestLevel: "عادي",
  status: apiProc.status || "ProcurementPending",
  progress: 20,
  createdAt: apiProc.created_at ? new Date(apiProc.created_at).getTime() : Date.now(),
  createdAtHijriShamsi: "",
  createdAtHijriQamari: "",
  updatedAt: apiProc.updated_at ? new Date(apiProc.updated_at).getTime() : Date.now(),
  updatedAtHijriShamsi: "",
  updatedAtHijriQamari: "",
  isDeleted: false
});

const mapOfferFromApi = (apiOffer: any): VendorOffer => ({
  id: apiOffer.id ? apiOffer.id.toString() : "",
  requestId: "",
  procurementId: apiOffer.procurement_case_id?.toString() || "",
  vendorName: apiOffer.vendor_name || "",
  vendorPhone: apiOffer.vendor_phone || "",
  vendorAddress: apiOffer.vendor_address || "",
  items: [],
  totalOfferPrice: Number(apiOffer.total_amount) || 0,
  deliveryTime: apiOffer.delivery_time_days?.toString() || "",
  warrantyOrNotes: apiOffer.warranty_terms || "",
  offerDate: Date.now(),
  offerDateHijriShamsi: "",
  offerDateHijriQamari: "",
  createdBy: "",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// --- Types ---

export interface ProcurementRecord {
  id: string;
  requestId: string;
  requestNumber?: string;
  requesterId: string;
  requesterName: string;
  requestLevel: string;
  status: string;
  progress: number;
  assignedToProcurementDirector?: string;
  createdAt: number;
  createdAtHijriShamsi: string;
  createdAtHijriQamari: string;
  updatedAt: number;
  updatedAtHijriShamsi: string;
  updatedAtHijriQamari: string;
  isDeleted: boolean;
  purchaseOrderId?: string;
  receiptReportId?: string;
}

export interface VendorOffer {
  id: string;
  requestId: string;
  procurementId: string;
  vendorName: string;
  vendorPhone: string;
  vendorAddress: string;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalOfferPrice: number;
  deliveryTime: string;
  warrantyOrNotes: string;
  offerDate: number;
  offerDateHijriShamsi: string;
  offerDateHijriQamari: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ComparisonRecord {
  id: string;
  requestId: string;
  procurementId: string;
  winnerVendorId?: string;
  winnerVendorName?: string;
  winnerTotalPrice?: number;
  selectionReason: string;
  createdBy: string;
  createdAt: number;
  createdAtHijriShamsi: string;
  createdAtHijriQamari: string;
}

export interface PurchaseOrderRecord {
  id: string;
  requestId: string;
  procurementId: string;
  vendorId: string;
  vendorName: string;
  totalPrice: number;
  status: 'Draft' | 'Submitted';
  createdBy: string;
  createdByName: string;
  createdAt: number;
  createdAtHijriShamsi: string;
}

export interface ReceiptReportRecord {
  id: string;
  requestId: string;
  procurementId: string;
  purchaseOrderId: string;
  vendorName: string;
  receivedItems: any[];
  status: 'Draft' | 'Submitted';
  receivedBy: string;
  receivedByName: string;
  createdAt: number;
  createdAtHijriShamsi: string;
}

const PROCUREMENTS_COL = "procurements";
const OFFERS_COL = "vendor_offers";
const COMPARISON_COL = "comparison_records";
const PO_COL = "purchase_orders";
const RR_COL = "receipt_reports";

// --- Service Functions ---

export const getOrCreateProcurement = async (request: InventoryRequest, userId: string) => {
  const dates = getCurrentHijriDates();

  try {
    const existingCases = await apiClient.get('/procurement');
    let proc = existingCases.find((c: any) => c.request_id?.toString() === request.id);
    if (!proc) {
      proc = await apiClient.post(`/procurement/from-request/${request.id}`, {});
    }
    return mapProcurementFromApi(proc);
  } catch (apiError) {
    console.warn("Backend getOrCreateProcurement failed; falling back to Firebase/Local");
    if (!isFirebaseConfigured) {
      const existing = getLocalItem<ProcurementRecord[]>("procurements", []).find((entry) => entry.id === request.id);
      if (existing) return existing;
      const newProc: ProcurementRecord = {
        id: request.id,
        requestId: request.id,
        requesterId: request.requesterId,
        requesterName: request.requesterName,
        requestLevel: request.currentRequestLevel,
        status: request.status === "PurchaseOrderCreated" ? "PurchaseOrderCreated" : "ProcurementPending",
        progress: request.progress || 20,
        createdAt: dates.timestamp,
        createdAtHijriShamsi: dates.shamsi,
        createdAtHijriQamari: dates.qamari,
        updatedAt: dates.timestamp,
        updatedAtHijriShamsi: dates.shamsi,
        updatedAtHijriQamari: dates.qamari,
        isDeleted: false,
      };
      setLocalItem("procurements", [newProc, ...getLocalItem<ProcurementRecord[]>("procurements", [])]);
      return newProc;
    }

    const procRef = doc(db, PROCUREMENTS_COL, request.id);
    const snap = await getDoc(procRef);
    if (snap.exists()) return snap.data() as ProcurementRecord;

    const newProc: ProcurementRecord = {
      id: request.id,
      requestId: request.id,
      requesterId: request.requesterId,
      requesterName: request.requesterName,
      requestLevel: request.currentRequestLevel,
      status: 'ProcurementPending',
      progress: 20,
      createdAt: dates.timestamp,
      createdAtHijriShamsi: dates.shamsi,
      createdAtHijriQamari: dates.qamari,
      updatedAt: dates.timestamp,
      updatedAtHijriShamsi: dates.shamsi,
      updatedAtHijriQamari: dates.qamari,
      isDeleted: false,
    };
    await setDoc(procRef, newProc);
    await logAuditEvent(userId, 'System', 'procurement_created' as any, { requestId: request.id });
    return newProc;
  }
};

export const getProcurementById = async (id: string) => {
  try {
    const apiProc = await apiClient.get(`/procurement/${id}`);
    if (apiProc) return mapProcurementFromApi(apiProc);
  } catch (apiError) {
    console.warn(`Backend getProcurementById failed for ${id}; falling back to Firebase/Local`);
    if (!isFirebaseConfigured) return getLocalItem<ProcurementRecord[]>("procurements", []).find((entry) => entry.id === id) || null;
    const snap = await getDoc(doc(db, PROCUREMENTS_COL, id));
    if (snap.exists()) return snap.data() as ProcurementRecord;
    return null;
  }
};

export const updateProcurementStatus = async (
  procurementId: string, 
  status: string, 
  progress: number, 
  user: { uid: string, name: string, role: string },
  stage: string,
  comment: string = ""
) => {
  const dates = getCurrentHijriDates();

  if (!isFirebaseConfigured) {
    const procurements = getLocalItem<ProcurementRecord[]>("procurements", []).map((entry) => entry.id === procurementId ? { ...entry, status, progress, updatedAt: dates.timestamp, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari } : entry);
    setLocalItem("procurements", procurements);
    await updateRequestStage(procurementId, status, progress, stage, user, comment);
    return;
  }

  const procRef = doc(db, PROCUREMENTS_COL, procurementId);
  await updateDoc(procRef, {
    status,
    progress,
    updatedAt: dates.timestamp,
    updatedAtHijriShamsi: dates.shamsi,
    updatedAtHijriQamari: dates.qamari,
  });
  await updateRequestStage(procurementId, status, progress, stage, user, comment);
  await logAuditEvent(user.uid, user.name, 'procurement_updated' as any, { procurementId, status, progress });
};

export const addVendorOffer = async (offerData: Partial<VendorOffer>, user: { uid: string, name: string }) => {
  const dates = getCurrentHijriDates();

  try {
    const apiPayload = {
      vendor_name: offerData.vendorName || "",
      vendor_phone: offerData.vendorPhone || "",
      vendor_address: offerData.vendorAddress || "",
      total_amount: (offerData.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0),
      delivery_time_days: offerData.deliveryTime ? parseInt(offerData.deliveryTime) || 0 : 0,
      warranty_terms: offerData.warrantyOrNotes || ""
    };
    const response = await apiClient.post(`/procurement/${offerData.procurementId}/vendor-offers`, apiPayload);
    return response.id?.toString() || "";
  } catch (apiError) {
    console.warn("Backend addVendorOffer failed; falling back to Firebase/Local");
    if (!isFirebaseConfigured) {
      const totalOfferPrice = (offerData.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
      const newOffer: VendorOffer = {
        id: makeLocalId("offer"),
        requestId: offerData.requestId!,
        procurementId: offerData.procurementId!,
        vendorName: offerData.vendorName || "",
        vendorPhone: offerData.vendorPhone || "",
        vendorAddress: offerData.vendorAddress || "",
        items: (offerData.items || []).map(item => ({ ...item, totalPrice: (item.quantity || 0) * (item.unitPrice || 0) })) as any,
        totalOfferPrice,
        deliveryTime: offerData.deliveryTime || "",
        warrantyOrNotes: offerData.warrantyOrNotes || "",
        offerDate: dates.timestamp,
        offerDateHijriShamsi: dates.shamsi,
        offerDateHijriQamari: dates.qamari,
        createdBy: user.uid,
        createdAt: dates.timestamp,
        updatedAt: dates.timestamp,
      };
      setLocalItem("vendor_offers", [newOffer, ...getLocalItem<VendorOffer[]>("vendor_offers", [])]);
      return newOffer.id;
    }

    const offerRef = doc(collection(db, OFFERS_COL));
    const totalOfferPrice = (offerData.items || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const newOffer: VendorOffer = {
      id: offerRef.id,
      requestId: offerData.requestId!,
      procurementId: offerData.procurementId!,
      vendorName: offerData.vendorName || "",
      vendorPhone: offerData.vendorPhone || "",
      vendorAddress: offerData.vendorAddress || "",
      items: (offerData.items || []).map(item => ({ ...item, totalPrice: (item.quantity || 0) * (item.unitPrice || 0) })) as any,
      totalOfferPrice,
      deliveryTime: offerData.deliveryTime || "",
      warrantyOrNotes: offerData.warrantyOrNotes || "",
      offerDate: dates.timestamp,
      offerDateHijriShamsi: dates.shamsi,
      offerDateHijriQamari: dates.qamari,
      createdBy: user.uid,
      createdAt: dates.timestamp,
      updatedAt: dates.timestamp,
    };
    await setDoc(offerRef, newOffer);
    await updateDoc(doc(db, PROCUREMENTS_COL, newOffer.procurementId), { status: 'OffersReceived', updatedAt: dates.timestamp });
    await logAuditEvent(user.uid, user.name, 'vendor_offer_added' as any, { procurementId: newOffer.procurementId, vendorName: newOffer.vendorName });
    return offerRef.id;
  }
};

export const getVendorOffers = async (procurementId: string) => {
  try {
    const apiProc = await apiClient.get(`/procurement/${procurementId}`);
    if (apiProc && apiProc.offers) {
      return apiProc.offers.map(mapOfferFromApi);
    }
  } catch (apiError) {
    console.warn("Backend getVendorOffers failed; falling back to Firebase/Local");
    if (!isFirebaseConfigured) return getLocalItem<VendorOffer[]>("vendor_offers", []).filter((entry) => entry.procurementId === procurementId);
    const q = query(collection(db, OFFERS_COL), where("procurementId", "==", procurementId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as VendorOffer);
  }
};

export const saveWinnerSelection = async (
  requestId: string,
  procurementId: string,
  winner: { vendorId: string, vendorName: string, totalPrice: number },
  reason: string,
  user: { uid: string, name: string, role: string }
) => {
  const dates = getCurrentHijriDates();

  try {
    await apiClient.put(`/procurement/${procurementId}/select-winner/${winner.vendorId || 1}`, { selection_reason: reason });
  } catch (apiError) {
    console.warn("Backend saveWinnerSelection failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const comparison: ComparisonRecord = { id: procurementId, requestId, procurementId, winnerVendorId: winner.vendorId, winnerVendorName: winner.vendorName, winnerTotalPrice: winner.totalPrice, selectionReason: reason, createdBy: user.uid, createdAt: dates.timestamp, createdAtHijriShamsi: dates.shamsi, createdAtHijriQamari: dates.qamari };
    setLocalItem("comparison_records", [comparison, ...getLocalItem<ComparisonRecord[]>("comparison_records", []).filter((entry) => entry.id !== procurementId)]);
    await updateProcurementStatus(procurementId, "WinnerSelected", 40, user, "مقایسوي فورم او ګټونکی", `ګټونکی: ${winner.vendorName}`);
    return;
  }

  const compRef = doc(db, COMPARISON_COL, procurementId);
  const comparison: ComparisonRecord = {
    id: procurementId,
    requestId,
    procurementId,
    winnerVendorId: winner.vendorId,
    winnerVendorName: winner.vendorName,
    winnerTotalPrice: winner.totalPrice,
    selectionReason: reason,
    createdBy: user.uid,
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
    createdAtHijriQamari: dates.qamari,
  };
  await setDoc(compRef, comparison);
  await updateProcurementStatus(procurementId, 'WinnerSelected', 45, user, 'تدارکات: ګټونکی وټاکل شو / تدارکات: برنده انتخاب شد', `ګټونکی: ${winner.vendorName} - علت: ${reason}`);
  await logAuditEvent(user.uid, user.name, 'winner_selected' as any, { procurementId, winnerVendorName: winner.vendorName });
};

export const createPurchaseOrder = async (
  procurementId: string,
  vendor: { id: string, name: string, total: number },
  user: { uid: string, name: string, role: string }
) => {
  const dates = getCurrentHijriDates();

  try {
    await apiClient.post(`/procurement/${procurementId}/purchase-order`, {
      vendor_id: vendor.id ? parseInt(vendor.id) || 1 : 1,
      total_amount: vendor.total
    });
  } catch (apiError) {
    console.warn("Backend createPurchaseOrder failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const poData: PurchaseOrderRecord = { id: procurementId, requestId: procurementId, procurementId, vendorId: vendor.id, vendorName: vendor.name, totalPrice: vendor.total, status: "Submitted", createdBy: user.uid, createdByName: user.name, createdAt: dates.timestamp, createdAtHijriShamsi: dates.shamsi };
    setLocalItem("purchase_orders", [poData, ...getLocalItem<PurchaseOrderRecord[]>("purchase_orders", []).filter((entry) => entry.id !== procurementId)]);
    await updateProcurementStatus(procurementId, "PurchaseOrderCreated", 50, user, "آمر خریداري جوړ شو");
    return;
  }

  const poRef = doc(db, PO_COL, procurementId);
  const poData: PurchaseOrderRecord = {
    id: procurementId,
    requestId: procurementId,
    procurementId,
    vendorId: vendor.id,
    vendorName: vendor.name,
    totalPrice: vendor.total,
    status: 'Submitted',
    createdBy: user.uid,
    createdByName: user.name,
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
  };
  await setDoc(poRef, poData);
  await updateDoc(doc(db, PROCUREMENTS_COL, procurementId), { purchaseOrderId: procurementId });
  await updateProcurementStatus(procurementId, 'PurchaseOrderCreated', 50, user, 'تدارکات: آمر خریداري جوړ شو / تدارکات: آمر خریداری ایجاد شد');
  await logAuditEvent(user.uid, user.name, 'purchase_order_created' as any, { procurementId });
};

export const createReceiptReport = async (
  procurementId: string,
  vendorName: string,
  items: any[],
  user: { uid: string, name: string, role: string }
) => {
  const dates = getCurrentHijriDates();

  if (!isFirebaseConfigured) {
    const rrData: ReceiptReportRecord = { id: procurementId, requestId: procurementId, procurementId, purchaseOrderId: procurementId, vendorName, receivedItems: items, status: "Submitted", receivedBy: user.uid, receivedByName: user.name, createdAt: dates.timestamp, createdAtHijriShamsi: dates.shamsi };
    setLocalItem("receipt_reports", [rrData, ...getLocalItem<ReceiptReportRecord[]>("receipt_reports", []).filter((entry) => entry.id !== procurementId)]);
    await updateProcurementStatus(procurementId, "ReceiptReportCreated", 60, user, "راپور رسید جوړ شو");
    return;
  }

  const rrRef = doc(db, RR_COL, procurementId);
  const rrData: ReceiptReportRecord = {
    id: procurementId,
    requestId: procurementId,
    procurementId,
    purchaseOrderId: procurementId,
    vendorName,
    receivedItems: items,
    status: 'Submitted',
    receivedBy: user.uid,
    receivedByName: user.name,
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
  };
  await setDoc(rrRef, rrData);
  await updateDoc(doc(db, PROCUREMENTS_COL, procurementId), { receiptReportId: procurementId });
  await updateProcurementStatus(procurementId, 'ReceiptReportCreated', 60, user, 'تدارکات: راپور رسید جوړ شو / تدارکات: راپور رسید ایجاد شد');
  await logAuditEvent(user.uid, user.name, 'receipt_report_created' as any, { procurementId });
};

export const getComparison = async (procurementId: string) => {
  if (!isFirebaseConfigured) return getLocalItem<ComparisonRecord[]>("comparison_records", []).find((entry) => entry.id === procurementId) || null;
  const snap = await getDoc(doc(db, COMPARISON_COL, procurementId));
  return snap.exists() ? snap.data() as ComparisonRecord : null;
};
