import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { seedDemoItems, getDemoRequests, getDemoTransactions } from "./localStore";
import { safeTimestampToDate } from "./safeQuery";

// --- Aggregation Functions ---

export const getReportSummary = async () => {
  if (!isFirebaseConfigured) {
    const itemsData = seedDemoItems();
    const requestsData = getDemoRequests();
    const transData = getDemoTransactions();
    return {
      totalItems: itemsData.length,
      totalValue: itemsData.reduce((sum, item) => sum + ((item.currentQuantity || 0) * (item.unitPrice || 0)), 0),
      lowStockCount: itemsData.filter(item => (item.currentQuantity || 0) <= (item.minimumStockLevel || 0) && (item.currentQuantity || 0) > 0).length,
      outOfStockCount: itemsData.filter(item => (item.currentQuantity || 0) <= 0).length,
      totalRequests: requestsData.length,
      pendingRequests: requestsData.filter(r => !['Delivered', 'RejectedBySuperAdmin', 'RejectedByRequestConfirmer'].includes(r.status)).length,
      deliveredRequests: requestsData.filter(r => r.status === 'Delivered').length,
      procurementCount: 0,
      totalProcurementCost: 0,
      totalAssignedItems: 0,
      monthlyStockIn: transData.filter(t => t.type === 'IN').reduce((sum, t) => sum + (t.quantity || 0), 0),
      monthlyStockOut: transData.filter(t => t.type === 'OUT').reduce((sum, t) => sum + (t.quantity || 0), 0),
    };
  }

  const [items, requests, trans, procurements, assignments] = await Promise.all([
    getDocs(collection(db, "items")),
    getDocs(collection(db, "requests")),
    getDocs(collection(db, "stock_transactions")),
    getDocs(collection(db, "procurements")),
    getDocs(collection(db, "item_assignments"))
  ]);

  const itemsData = items.docs.map(d => d.data());
  const requestsData = requests.docs.map(d => d.data());
  const transData = trans.docs.map(d => d.data());
  const procData = procurements.docs.map(d => d.data());

  return {
    totalItems: itemsData.length,
    totalValue: itemsData.reduce((sum, item) => sum + ((item.currentQuantity || 0) * (item.unitPrice || 0)), 0),
    lowStockCount: itemsData.filter(item => (item.currentQuantity || 0) <= (item.minimumStockLevel || 0) && (item.currentQuantity || 0) > 0).length,
    outOfStockCount: itemsData.filter(item => (item.currentQuantity || 0) <= 0).length,
    
    totalRequests: requestsData.length,
    pendingRequests: requestsData.filter(r => !['Delivered', 'RejectedBySuperAdmin', 'RejectedByRequestConfirmer'].includes(r.status)).length,
    deliveredRequests: requestsData.filter(r => r.status === 'Delivered').length,
    
    procurementCount: procData.length,
    totalProcurementCost: procData.reduce((sum, p) => sum + (p.winnerTotalPrice || 0), 0),
    
    totalAssignedItems: assignments.size,
    monthlyStockIn: transData.filter(t => t.type === 'IN').reduce((sum, t) => sum + (t.quantity || 0), 0),
    monthlyStockOut: transData.filter(t => t.type === 'OUT').reduce((sum, t) => sum + (t.quantity || 0), 0),
  };
};

// --- Forecasting & Needs Analysis ---

export const calculateAnnualNeeds = async () => {
  const items = isFirebaseConfigured
    ? (await getDocs(collection(db, "items"))).docs.map(d => ({ id: d.id, ...d.data() }))
    : seedDemoItems();
  const transactions = isFirebaseConfigured
    ? (await getDocs(collection(db, "stock_transactions"))).docs.map(d => d.data())
    : getDemoTransactions();

  const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

  return items.map((item: any) => {
    const historicalConsumption = transactions
      .filter(t => t.itemId === item.id && t.type === 'OUT' && t.createdAt >= oneYearAgo)
      .reduce((sum, t) => sum + (t.quantity || 0), 0);

    const gap = Math.max(0, historicalConsumption - (item.currentQuantity || 0));
    const priority = item.currentQuantity === 0 ? 'High' : gap > (item.currentQuantity * 2) ? 'Medium' : 'Low';

    return {
      ...item,
      historicalConsumption,
      annualNeed: historicalConsumption,
      gap,
      recommendedPurchase: gap,
      priority
    };
  });
};

export const getForecastForItem = async (itemId: string) => {
  const data = isFirebaseConfigured
    ? (await getDocs(query(
        collection(db, "stock_transactions"),
        where("itemId", "==", itemId),
        where("type", "==", "OUT"),
        orderBy("createdAt", "desc")
      ))).docs.map(d => d.data())
    : getDemoTransactions().filter((t) => t.itemId === itemId && t.type === "OUT");

  const monthlyData: Record<string, number> = {};
  data.forEach(t => {
    const date = safeTimestampToDate(t.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (t.quantity || 0);
  });

  const values = Object.values(monthlyData).reverse();
  if (values.length === 0) return null;
  
  // 1. Moving Average (N=3)
  const movingAverage = values.length >= 3 
    ? (values.slice(-3).reduce((a, b) => a + b, 0) / 3) 
    : (values.reduce((a, b) => a + b, 0) / (values.length || 1));

  // 2. Exponential Smoothing (alpha=0.3)
  let expSmoothing = values[0] || 0;
  const alpha = 0.3;
  for (let i = 1; i < values.length; i++) {
    expSmoothing = alpha * values[i] + (1 - alpha) * expSmoothing;
  }

  // 3. Linear Regression (y = mx + b)
  let m = 0, b = 0;
  if (values.length >= 2) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    b = (sumY - m * sumX) / n;
  }
  const linearRegression = m * values.length + b;

  return {
    historical: Object.entries(monthlyData).map(([month, qty]) => ({ month, qty })),
    movingAverage,
    expSmoothing,
    linearRegression: Math.max(0, linearRegression),
    recommended: Math.ceil(Math.max(movingAverage, expSmoothing, linearRegression))
  };
};

// --- Export Utils ---

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(obj => {
    return Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
  }).join("\n");
  
  const blob = new Blob(["\ufeff" + headers + "\n" + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Specialized Fetchers ---

export const getFullCollection = async (colName: string) => {
  if (!isFirebaseConfigured) {
    if (colName === "items") return seedDemoItems();
    if (colName === "requests") return getDemoRequests();
    if (colName === "stock_transactions") return getDemoTransactions();
    return [];
  }

  try {
    const snap = await getDocs(collection(db, colName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn(`Firebase getFullCollection(${colName}) failed:`, error);
    return [];
  }
};
