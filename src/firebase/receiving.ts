import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  runTransaction
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { getLocalItem, setLocalItem, makeLocalId, addInAppNotification } from "./localStore";
import { getDemoRequests, saveDemoRequests } from "./localStore";
import { performStockTransaction } from "./inventory";
import { getCurrentHijriDates } from "../utils/dateUtils";
import { logAuditEvent } from "./audit";
import { updateRequestStage } from "./requests";
import { apiClient } from "../api/apiClient";

// --- Types ---

export interface FS5Document {
  id: string;
  requestId: string;
  procurementId?: string;
  receiptReportId?: string;
  fs5Number: string;
  status: 'Draft' | 'Submitted' | 'Delivered' | 'Cancelled';
  items: any[];
  receiverId: string;
  receiverName: string;
  facultyName: string;
  createdBy: string;
  createdAt: number;
  createdAtHijriShamsi: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  requestId?: string;
  fs5Id?: string;
}

const FS5_COL = "fs5_documents";
const TRANSACTIONS_COL = "stock_transactions";
const ITEMS_COL = "items";
const ASSIGNMENTS_COL = "item_assignments";
const DELIVERIES_COL = "deliveries";

// --- Service Functions ---

export const createFS5 = async (requestId: string, items: any[], user: { uid: string, name: string, role: string }, receiver: any) => {
  const dates = getCurrentHijriDates();

  try {
    const delivery = await apiClient.post(`/delivery/from-request/${requestId}`, { notes: "FS-5 Created" });
    if (items.length > 0) {
      const apiItems = items.map((i: any) => ({
        item_id: parseInt(i.itemId) || 1,
        quantity: parseInt(i.quantity) || 1,
        unit_id: 1, // Default fallback
        delivered_to_person_id: receiver.id ? parseInt(receiver.id) : null
      }));
      await apiClient.post(`/delivery/${delivery.id || requestId}/items`, { items: apiItems });
    }
  } catch (apiError) {
    console.warn("Backend createFS5 (delivery) failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const existing = getLocalItem<FS5Document | null>(`fs5_${requestId}`, null);
    if (existing?.status === "Delivered") throw new Error("دغه ف، س، ۵ مخکې تسلیم شوی دی.");
    const docData: FS5Document = {
      id: requestId,
      requestId,
      fs5Number: `FS5-${dates.shamsi}`,
      status: "Submitted",
      items,
      receiverId: receiver.id,
      receiverName: receiver.name,
      facultyName: receiver.faculty,
      createdBy: user.uid,
      createdAt: dates.timestamp,
      createdAtHijriShamsi: dates.shamsi,
    };
    setLocalItem(`fs5_${requestId}`, docData);
    setLocalItem("fs5_documents", [docData, ...getLocalItem<FS5Document[]>("fs5_documents", []).filter((item) => item.id !== requestId)]);
    await updateRequestStage(requestId, "FS5Created", 90, "ف، س، ۵ جوړ شو", user, "رسمي ف، س، ۵ فورم جوړ شو.");
    return docData;
  }

  const fs5Ref = doc(db, FS5_COL, requestId);
  const snap = await getDoc(fs5Ref);
  
  if (snap.exists() && snap.data().status === 'Delivered') {
    throw new Error("دغه FS-5 مخکې سپارل شوی دی.");
  }

  const docData: FS5Document = {
    id: requestId,
    requestId,
    fs5Number: `FS5-${Date.now()}`,
    status: 'Submitted',
    items,
    receiverId: receiver.id,
    receiverName: receiver.name,
    facultyName: receiver.faculty,
    createdBy: user.uid,
    createdAt: dates.timestamp,
    createdAtHijriShamsi: dates.shamsi,
  };

  await setDoc(fs5Ref, docData);
  
  // Update request status
  const isProcurement = !!snap.data()?.procurementId;
  const progress = isProcurement ? 90 : 70;
  await updateRequestStage(requestId, 'FS5Created', progress, 'ف، س، ۵ جوړ شو / فورم FS-5 ایجاد شد', user);
  
  await logAuditEvent(user.uid, user.name, 'fs5_created' as any, { requestId });
  return docData;
};

/**
 * ATOMIC DELIVERY TRANSACTION
 * Deducts stock, creates transactions, creates assignments, and completes request.
 */
export const finalizeDelivery = async (requestId: string, user: { uid: string, name: string, role: string }) => {
  const dates = getCurrentHijriDates();

  try {
    await apiClient.put(`/requests/${requestId}/status`, { status: "DELIVERED" });
  } catch (apiError) {
    console.warn("Backend finalizeDelivery failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const fs5 = getLocalItem<FS5Document | null>(`fs5_${requestId}`, null);
    if (!fs5) throw new Error("ف، س، ۵ فورم ونه موندل شو.");
    if (fs5.status === "Delivered") throw new Error("دا تسلیمي مخکې بشپړه شوې ده؛ موجودي بیا نه کمیږي.");
    for (const item of fs5.items) {
      await performStockTransaction(item.itemId, "OUT", Number(item.quantity) || 0, "د ف، س، ۵ له مخې تسلیمي", user);
    }
    const delivered = { ...fs5, status: "Delivered" as const, submittedAt: dates.timestamp, submittedAtHijriShamsi: dates.shamsi };
    setLocalItem(`fs5_${requestId}`, delivered);
    setLocalItem("fs5_documents", [delivered, ...getLocalItem<FS5Document[]>("fs5_documents", []).filter((item) => item.id !== requestId)]);
    setLocalItem("deliveries", [{ id: makeLocalId("delivery"), requestId, fs5Id: requestId, deliveredToName: fs5.receiverName, items: fs5.items, deliveredBy: user.uid, deliveredByName: user.name, deliveredAt: dates.timestamp, deliveredAtHijriShamsi: dates.shamsi, status: "Completed" }, ...getLocalItem<any[]>("deliveries", [])]);
    saveDemoRequests(getDemoRequests().map((request) => request.id === requestId ? { ...request, status: "Delivered", progress: 100, currentStage: "بشپړ شو", updatedAt: dates.timestamp, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari } : request));
    await updateRequestStage(requestId, "Delivered", 100, "بشپړ شو", user, "جنس وسپارل شو او موجودي یو ځل کمه شوه.");
    return { success: true };
  }
  
  return await runTransaction(db, async (transaction) => {
    const fs5Ref = doc(db, FS5_COL, requestId);
    const reqRef = doc(db, "requests", requestId);
    
    const fs5Snap = await getDoc(fs5Ref);
    if (!fs5Snap.exists()) throw new Error("FS-5 فورم ونه موندل شو.");
    
    const fs5 = fs5Snap.data() as FS5Document;
    if (fs5.status === 'Delivered') throw new Error("دغه جنس مخکې سپارل شوی دی.");

    await getDoc(reqRef);

    // 1. Validate all items and read current stock
    const itemUpdates = [];
    for (const reqItem of fs5.items) {
      const itemRef = doc(db, ITEMS_COL, reqItem.itemId);
      const itemSnap = await transaction.get(itemRef);
      
      if (!itemSnap.exists()) throw new Error(`جنس ونه موندل شو: ${reqItem.name}`);
      
      const currentQty = itemSnap.data().currentQuantity || 0;
      if (currentQty < reqItem.quantity) {
        throw new Error(`د ${reqItem.name} لپاره کافي موجودي نشته. (موجود: ${currentQty}, غوښتل شوی: ${reqItem.quantity})`);
      }

      itemUpdates.push({
        ref: itemRef,
        name: reqItem.name,
        itemId: reqItem.itemId,
        unit: reqItem.unit,
        before: currentQty,
        after: currentQty - reqItem.quantity,
        deduct: reqItem.quantity
      });
    }

    // 2. Perform Stock Deduction & Create Transactions
    for (const up of itemUpdates) {
      // Update item quantity
      transaction.update(up.ref, { 
        currentQuantity: up.after,
        updatedAt: dates.timestamp 
      });

      // Create Stock Transaction (OUT)
      const transRef = doc(collection(db, TRANSACTIONS_COL));
      transaction.set(transRef, {
        id: transRef.id,
        itemId: up.itemId,
        itemName: up.name,
        type: 'OUT',
        quantity: up.deduct,
        unit: up.unit,
        stockBefore: up.before,
        stockAfter: up.after,
        reason: "د FS-5 له مخې سپارنه / تحویلی بر اساس FS-5",
        requestId,
        fs5Id: requestId,
        recipientName: fs5.receiverName,
        performedBy: user.uid,
        performedByName: user.name,
        createdAt: dates.timestamp,
        createdAtHijriShamsi: dates.shamsi,
      });

      // Create Item Assignment
      const assignRef = doc(collection(db, ASSIGNMENTS_COL));
      transaction.set(assignRef, {
        id: assignRef.id,
        requestId,
        fs5Id: requestId,
        itemId: up.itemId,
        itemName: up.name,
        quantity: up.deduct,
        unit: up.unit,
        assignedToId: fs5.receiverId,
        assignedToName: fs5.receiverName,
        facultyName: fs5.facultyName,
        assignedBy: user.uid,
        assignedByName: user.name,
        assignedAt: dates.timestamp,
        assignedAtHijriShamsi: dates.shamsi,
        status: 'Assigned',
        isReturned: false
      });
    }

    // 3. Update FS-5 and Request Status
    transaction.update(fs5Ref, { 
      status: 'Delivered',
      submittedAt: dates.timestamp,
      submittedAtHijriShamsi: dates.shamsi
    });

    transaction.update(reqRef, {
      status: 'Delivered',
      progress: 100,
      currentStage: 'بشپړ شو / تکمیل شد',
      updatedAt: dates.timestamp,
      updatedAtHijriShamsi: dates.shamsi
    });

    // 4. Create Delivery Record
    const deliveryRef = doc(collection(db, DELIVERIES_COL));
    transaction.set(deliveryRef, {
      id: deliveryRef.id,
      requestId,
      fs5Id: requestId,
      deliveredToName: fs5.receiverName,
      items: fs5.items,
      deliveredBy: user.uid,
      deliveredByName: user.name,
      deliveredAt: dates.timestamp,
      deliveredAtHijriShamsi: dates.shamsi,
      status: 'Completed'
    });

    return { success: true };
  });
};

/**
 * PROCUREMENT RECEIVING
 * Increases inventory based on Receipt Report.
 */
export const receiveProcurementToInventory = async (requestId: string, items: any[], user: { uid: string, name: string, role: string }) => {
  const dates = getCurrentHijriDates();

  try {
    const receiving = await apiClient.post(`/receiving/from-purchase-order/${requestId}`, { notes: "Received" });
    if (items.length > 0) {
      const apiItems = items.map((i: any) => ({
        item_id: parseInt(i.itemId) || 1,
        quantity_received: parseInt(i.quantity) || 1,
        unit_price: 0
      }));
      await apiClient.post(`/receiving/${receiving.id || requestId}/items`, { items: apiItems });
    }
    // Update request stage
    await apiClient.put(`/requests/${requestId}/status`, { status: "READY_FOR_DELIVERY" }); // Approximation of ReceivedToInventory
  } catch (apiError) {
    console.warn("Backend receiveProcurementToInventory failed; falling back to Firebase/Local");
  }

  if (!isFirebaseConfigured) {
    const request = getDemoRequests().find((entry) => entry.id === requestId);
    if (request?.status === "ReceivedToInventory") throw new Error("دا اجناس مخکې موجودۍ ته داخل شوي دي.");
    for (const item of items) {
      await performStockTransaction(item.itemId, "IN", Number(item.quantity) || 0, "د تدارکاتو رسید", user);
    }
    setLocalItem("receipt_reports", [{ id: requestId, requestId, receivedItems: items, receivedBy: user.uid, receivedByName: user.name, createdAt: dates.timestamp, createdAtHijriShamsi: dates.shamsi, status: "Submitted" }, ...getLocalItem<any[]>("receipt_reports", [])]);
    saveDemoRequests(getDemoRequests().map((entry) => entry.id === requestId ? { ...entry, status: "ReceivedToInventory", progress: 65, currentStage: "ګدام ته داخل شو", updatedAt: dates.timestamp, updatedAtHijriShamsi: dates.shamsi, updatedAtHijriQamari: dates.qamari } : entry));
    await updateRequestStage(requestId, "ReceivedToInventory", 65, "ګدام ته داخل شو", user, "تدارکاتي جنس موجودۍ ته داخل شو.");
    addInAppNotification({
      type: "received",
      titlePs: "اجناس ګدام ته داخل شول",
      titleDr: "اجناس وارد انبار شد",
      bodyPs: `${items.length} ډول اجناس د غوښتنې (${requestId}) لپاره ګدام ته داخل شول. موجودي تازه شوه.`,
      bodyDr: `${items.length} نوع جنس برای درخواست (${requestId}) وارد انبار شد. موجودی بروزرسانی شد.`,
      requestId,
    });
    return { success: true };
  }
  
  return await runTransaction(db, async (transaction) => {
    const reqRef = doc(db, "requests", requestId);
    const reqSnap = await transaction.get(reqRef);
    if (reqSnap.data()?.status === 'ReceivedToInventory') throw new Error("دا اجناس مخکې موجودۍ ته داخل شوي دي.");

    for (const item of items) {
      const itemRef = doc(db, ITEMS_COL, item.itemId);
      const itemSnap = await transaction.get(itemRef);
      
      const before = itemSnap.exists() ? (itemSnap.data().currentQuantity || 0) : 0;
      const after = before + item.quantity;

      transaction.update(itemRef, { 
        currentQuantity: after,
        updatedAt: dates.timestamp 
      });

      const transRef = doc(collection(db, TRANSACTIONS_COL));
      transaction.set(transRef, {
        itemId: item.itemId,
        itemName: item.name,
        type: 'IN',
        quantity: item.quantity,
        stockBefore: before,
        stockAfter: after,
        reason: "د تدارکاتو رسید / دریافت از تدارکات",
        requestId,
        performedBy: user.uid,
        performedByName: user.name,
        createdAt: dates.timestamp,
        createdAtHijriShamsi: dates.shamsi,
      });
    }

    transaction.update(reqRef, {
      status: 'ReceivedToInventory',
      progress: 65,
      updatedAt: dates.timestamp
    });

    return { success: true };
  });
};
