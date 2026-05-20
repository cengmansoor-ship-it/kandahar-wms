import { ROLES } from "../constants/roles";
import type { UserProfile } from "./firestore";
import type { WarehouseItem, StockTransaction } from "./inventory";
import type { InventoryRequest, PipelineRecord, RequestLevelRecord } from "./requests";

const PREFIX = "kandahar_wms_";
const BASE_TS = new Date(2026, 4, 14, 8, 0, 0).getTime();

const now = () => Date.now();
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export type DemoEmailLog = {
  id: string;
  to: string;
  subject: string;
  body: string;
  relatedRequestId?: string;
  requestLevel?: string;
  status: "Draft" | "Sent" | "Queued";
  createdAt: number;
  createdAtHijriShamsi: string;
  createdAtHijriQamari: string;
};

export const DEMO_USER_PROFILE: UserProfile = {
  uid: "demo-super-admin",
  name: "Enayatullah Mansoor",
  email: "enayatullahmansoor070@gmail.com",
  phone: "0704243811",
  role: ROLES.SUPER_ADMIN,
  active: true,
  forcePasswordChange: false,
  createdAt: now(),
  updatedAt: now(),
};

export const DEMO_SEED_USERS: UserProfile[] = [
  { uid: "seed_super_admin", name: "Enayatullah Mansoor", email: "enayatullahmansoor070@gmail.com", phone: "0704243811", role: ROLES.SUPER_ADMIN, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_admin", name: "Fazalrahman Mayar", email: "fazalrahmanmayar2024@gmail.com", phone: "0709009890", role: ROLES.ADMIN, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_procurement", name: "Abdulhadi Rahimi", email: "adhadirahimi623@gmail.com", phone: "0700362405", role: ROLES.PROCUREMENT_DIRECTOR, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_warehouse_director", name: "Nazirahmad Bashare", email: "nazirbashare@gmail.com", phone: "0708611400", role: ROLES.WAREHOUSE_DIRECTOR, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_entry", name: "Mansoor", email: "cengmansoor@gmail.com", phone: "0749031594", role: ROLES.WAREHOUSE_ENTRY_PERSON, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_confirmer", name: "Doostyar Sahib", email: "enayatkhanmansoor@gmail.com", phone: "0747552032", role: ROLES.REQUEST_CONFIRMER, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
  { uid: "seed_requester", name: "Afghan Sahib", email: "enayatzoon@gmail.com", phone: "", role: ROLES.REQUESTER, active: true, forcePasswordChange: true, createdAt: BASE_TS, updatedAt: BASE_TS },
];

export function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function getDemoUserProfile(email?: string | null): UserProfile {
  const normalized = (email || "").trim().toLowerCase();
  const matched = DEMO_SEED_USERS.find((user) => user.email.toLowerCase() === normalized);
  const profile = matched || { ...DEMO_USER_PROFILE, email: email || DEMO_USER_PROFILE.email, updatedAt: now() };
  setLocalItem("demo_profile", profile);
  return profile;
}

export function getDemoUsers(): UserProfile[] {
  const saved = getLocalItem<UserProfile[]>("users", []);
  if (saved.length > 0) return saved;
  setLocalItem("users", DEMO_SEED_USERS);
  return DEMO_SEED_USERS;
}

export function seedDemoItems(): WarehouseItem[] {
  const existing = getLocalItem<WarehouseItem[]>("items", []);
  if (existing.length > 0) return existing;

  const timestamp = BASE_TS;
  const items: WarehouseItem[] = [
    { id: "demo_item_1", name: "A4 کاغذ", category: "قرطاسیه", typeOrSpecification: "۷۰ ګرامه", unit: "ریمه", currentQuantity: 25, minimumStockLevel: 10, unitPrice: 250, supplierOrSource: "مرکزي ګدام", description: "د دفترونو لپاره سپین کاغذ", createdBy: "seed_super_admin", updatedBy: "seed_super_admin", createdAt: timestamp, updatedAt: timestamp, createdAtHijriShamsi: "۱۴۰۴/۰۲/۲۴", createdAtHijriQamari: "۱۴۴۶/۱۱/۰۶", updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", isDeleted: false },
    { id: "demo_item_2", name: "قلم", category: "قرطاسیه", typeOrSpecification: "آبي رنګ", unit: "دانه", currentQuantity: 120, minimumStockLevel: 30, unitPrice: 15, supplierOrSource: "محلي بازار", description: "د ورځني اداري کار لپاره قلمونه", createdBy: "seed_super_admin", updatedBy: "seed_super_admin", createdAt: timestamp, updatedAt: timestamp, createdAtHijriShamsi: "۱۴۰۴/۰۳/۱۲", createdAtHijriQamari: "۱۴۴۶/۱۲/۲۴", updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", isDeleted: false },
    { id: "demo_item_3", name: "پرنټر ټونر", category: "کمپیوټري وسایل", typeOrSpecification: "HP LaserJet 12A", unit: "دانه", currentQuantity: 8, minimumStockLevel: 5, unitPrice: 1800, supplierOrSource: "کندهار تخنیکي شرکت", description: "د اداري چاپ لپاره ټونر", createdBy: "seed_super_admin", updatedBy: "seed_super_admin", createdAt: timestamp, updatedAt: timestamp, createdAtHijriShamsi: "۱۴۰۴/۰۴/۰۷", createdAtHijriQamari: "۱۴۴۷/۰۱/۱۵", updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", isDeleted: false },
    { id: "demo_item_4", name: "چوکي", category: "فرنیچر", typeOrSpecification: "فلزي اداري چوکي", unit: "دانه", currentQuantity: 15, minimumStockLevel: 6, unitPrice: 2200, supplierOrSource: "احمدي فرنیچر", description: "د صنفونو او دفترونو لپاره چوکي", createdBy: "seed_super_admin", updatedBy: "seed_super_admin", createdAt: timestamp, updatedAt: timestamp, createdAtHijriShamsi: "۱۴۰۴/۰۵/۲۱", createdAtHijriQamari: "۱۴۴۷/۰۲/۲۸", updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", isDeleted: false },
    { id: "demo_item_5", name: "شبکې کیبل", category: "شبکه", typeOrSpecification: "Cat6", unit: "متر", currentQuantity: 300, minimumStockLevel: 80, unitPrice: 25, supplierOrSource: "IT بازار", description: "د شبکې د ترمیم لپاره کیبل", createdBy: "seed_super_admin", updatedBy: "seed_super_admin", createdAt: timestamp, updatedAt: timestamp, createdAtHijriShamsi: "۱۴۰۴/۰۶/۱۸", createdAtHijriQamari: "۱۴۴۷/۰۴/۰۱", updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", isDeleted: false },
  ];
  setLocalItem("items", items);
  return items;
}

export function seedDemoTransactions(): StockTransaction[] {
  const existing = getLocalItem<StockTransaction[]>("stock_transactions", []);
  if (existing.length > 0) return existing;
  const shamsiMonths = ["۱۴۰۴/۰۳/۱۰", "۱۴۰۴/۰۴/۱۰", "۱۴۰۴/۰۵/۱۰", "۱۴۰۴/۰۶/۱۰", "۱۴۰۴/۰۷/۱۰", "۱۴۰۴/۰۸/۱۰", "۱۴۰۴/۰۹/۱۰", "۱۴۰۴/۱۰/۱۰", "۱۴۰۴/۱۱/۱۰", "۱۴۰۴/۱۲/۱۰", "۱۴۰۵/۰۱/۱۰", "۱۴۰۵/۰۲/۱۰"];
  const qamariMonths = ["۱۴۴۶/۱۲/۲۲", "۱۴۴۷/۰۱/۲۳", "۱۴۴۷/۰۲/۲۴", "۱۴۴۷/۰۳/۲۴", "۱۴۴۷/۰۴/۲۵", "۱۴۴۷/۰۵/۲۵", "۱۴۴۷/۰۶/۲۵", "۱۴۴۷/۰۷/۲۶", "۱۴۴۷/۰۸/۲۶", "۱۴۴۷/۰۹/۲۶", "۱۴۴۷/۱۰/۲۷", "۱۴۴۷/۱۱/۲۷"];
  const transactions: StockTransaction[] = [];
  const items = seedDemoItems();
  items.forEach((item, itemIndex) => {
    let balance = 80 + itemIndex * 40;
    shamsiMonths.forEach((date, monthIndex) => {
      const inQty = itemIndex === 4 ? 50 : 8 + itemIndex + (monthIndex % 3);
      transactions.push({ id: `demo_in_${item.id}_${monthIndex}`, itemId: item.id, itemName: item.name, type: "IN", quantity: inQty, unit: item.unit, stockBefore: balance, stockAfter: balance + inQty, reason: "د میاشتني بیکپ ډیټا لپاره د ګدام داخل", performedBy: "seed_entry", performedByName: "Mansoor", performedByRole: ROLES.WAREHOUSE_ENTRY_PERSON, createdAt: BASE_TS + monthIndex * 2629800000 + itemIndex * 10000, createdAtHijriShamsi: date, createdAtHijriQamari: qamariMonths[monthIndex] });
      balance += inQty;
      const outQty = itemIndex === 4 ? 20 + (monthIndex % 4) : 3 + ((monthIndex + itemIndex) % 5);
      transactions.push({ id: `demo_out_${item.id}_${monthIndex}`, itemId: item.id, itemName: item.name, type: "OUT", quantity: outQty, unit: item.unit, stockBefore: balance, stockAfter: Math.max(0, balance - outQty), reason: "د غوښتنې له مخې تسلیمي", requestId: `demo_req_${(monthIndex % 4) + 1}`, performedBy: "seed_warehouse_director", performedByName: "Nazirahmad Bashare", performedByRole: ROLES.WAREHOUSE_DIRECTOR, createdAt: BASE_TS + monthIndex * 2629800000 + itemIndex * 10000 + 5000, createdAtHijriShamsi: date, createdAtHijriQamari: qamariMonths[monthIndex] });
      balance = Math.max(0, balance - outQty);
    });
  });
  transactions.sort((a, b) => b.createdAt - a.createdAt);
  setLocalItem("stock_transactions", transactions);
  return transactions;
}

export function getDemoTransactions(): StockTransaction[] {
  return seedDemoTransactions();
}

export function saveDemoTransactions(transactions: StockTransaction[]): void {
  setLocalItem("stock_transactions", transactions);
}

function seedDemoRequests(): InventoryRequest[] {
  const existing = getLocalItem<InventoryRequest[]>("requests", []);
  if (existing.length > 0) return existing;
  const requests: InventoryRequest[] = [
    { id: "demo_req_1", requesterId: "seed_requester", requesterName: "Afghan Sahib", faculty: "د کمپیوټر ساینس پوهنځی", departmentOrPerson: "د معلوماتي سیستمونو څانګه", reason: "د لابراتوار لپاره قرطاسیه او ټونر ته اړتیا ده.", items: [{ itemId: "demo_item_1", name: "A4 کاغذ", unit: "ریمه", quantity: 4 }, { itemId: "demo_item_3", name: "پرنټر ټونر", unit: "دانه", quantity: 1 }], status: "Delivered", progress: 100, currentStage: "بشپړ شو", originalRequestLevel: "ډېر مهم", currentRequestLevel: "ډېر مهم", createdAt: BASE_TS + 1000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۱۸", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۴", updatedAt: BASE_TS + 5000, updatedAtHijriShamsi: "۱۴۰۵/۰۱/۲۰", updatedAtHijriQamari: "۱۴۴۷/۱۰/۰۶", formInstances: { proposalId: "demo_form_proposal_1", si9Id: "demo_form_si9_1" } },
    { id: "demo_req_2", requesterId: "seed_requester", requesterName: "Afghan Sahib", faculty: "د انجینري پوهنځی", departmentOrPerson: "اداري مدیریت", reason: "د نوې شعبې لپاره اداري چوکیو ته اړتیا ده.", items: [{ itemId: "demo_item_4", name: "چوکي", unit: "دانه", quantity: 10 }], status: "PurchaseOrderCreated", progress: 50, currentStage: "آمر خریداري جوړ شو", originalRequestLevel: "متوسط", currentRequestLevel: "ډېر مهم", createdAt: BASE_TS + 2000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۰۳", createdAtHijriQamari: "۱۴۴۷/۱۱/۰۶", updatedAt: BASE_TS + 6000, updatedAtHijriShamsi: "۱۴۰۵/۰۲/۱۳", updatedAtHijriQamari: "۱۴۴۷/۱۱/۱۶", formInstances: { proposalId: "demo_form_proposal_2", si9Id: "demo_form_si9_2" } },
    { id: "demo_req_3", requesterId: "seed_requester", requesterName: "Afghan Sahib", faculty: "د طب پوهنځی", departmentOrPerson: "کتابتون", reason: "د محصلینو لپاره د ورځني کار قرطاسیه.", items: [{ itemId: "demo_item_2", name: "قلم", unit: "دانه", quantity: 30 }], status: "Submitted", progress: 0, currentStage: "غوښتنه ثبت شوه", originalRequestLevel: "عادي", currentRequestLevel: "عادي", createdAt: BASE_TS + 3000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۲۰", createdAtHijriQamari: "۱۴۴۷/۱۱/۲۳", updatedAt: BASE_TS + 3000, updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۰", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۳", formInstances: { proposalId: "demo_form_proposal_3", si9Id: "demo_form_si9_3" } },
    { id: "demo_req_4", requesterId: "seed_requester", requesterName: "Afghan Sahib", faculty: "د اقتصاد پوهنځی", departmentOrPerson: "شبکه او IT", reason: "د شبکې د ترمیم لپاره کیبل ته اړتیا ده.", items: [{ itemId: "demo_item_5", name: "شبکې کیبل", unit: "متر", quantity: 100 }], status: "StockAvailable", progress: 20, currentStage: "ګدام ته واستول شوه", originalRequestLevel: "ډېر عاجل", currentRequestLevel: "ډېر عاجل", createdAt: BASE_TS + 4000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۲۳", createdAtHijriQamari: "۱۴۴۷/۱۱/۲۶", updatedAt: BASE_TS + 7000, updatedAtHijriShamsi: "۱۴۰۵/۰۲/۲۴", updatedAtHijriQamari: "۱۴۴۷/۱۱/۲۷", formInstances: { proposalId: "demo_form_proposal_4", si9Id: "demo_form_si9_4" } },
  ];
  setLocalItem("requests", requests);
  return requests;
}

export function getDemoRequests(): InventoryRequest[] {
  return seedDemoRequests();
}

export function saveDemoRequests(requests: InventoryRequest[]): void {
  setLocalItem("requests", requests);
}

function seedDemoPipeline(): PipelineRecord[] {
  const existing = getLocalItem<PipelineRecord[]>("request_pipeline", []);
  if (existing.length > 0) return existing;
  const records: PipelineRecord[] = [
    { id: "pipe_1", requestId: "demo_req_1", stage: "غوښتنه ثبت شوه", status: "Submitted", progress: 0, actionBy: "seed_requester", actionByName: "Afghan Sahib", actionByRole: ROLES.REQUESTER, comment: "لومړنۍ غوښتنه او درجه ثبت شوه.", createdAt: BASE_TS + 1000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۱۸", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۴" },
    { id: "pipe_2", requestId: "demo_req_1", stage: "د تاییدوونکي تایید", status: "ConfirmedByRequestConfirmer", progress: 5, actionBy: "seed_confirmer", actionByName: "Doostyar Sahib", actionByRole: ROLES.REQUEST_CONFIRMER, comment: "درجه تایید شوه.", createdAt: BASE_TS + 2000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۱۸", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۴" },
    { id: "pipe_3", requestId: "demo_req_1", stage: "د سوپر اډمین تایید", status: "ApprovedBySuperAdmin", progress: 10, actionBy: "seed_super_admin", actionByName: "Enayatullah Mansoor", actionByRole: ROLES.SUPER_ADMIN, comment: "اداري اجازه ورکړل شوه.", createdAt: BASE_TS + 3000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۱۹", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۵" },
    { id: "pipe_4", requestId: "demo_req_1", stage: "ګدام ته استول", status: "StockAvailable", progress: 20, actionBy: "seed_admin", actionByName: "Fazalrahman Mayar", actionByRole: ROLES.ADMIN, comment: "جنس په ګدام کې موجود و.", createdAt: BASE_TS + 4000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۱۹", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۵" },
    { id: "pipe_5", requestId: "demo_req_1", stage: "ف س ۵ او تسلیمي", status: "Delivered", progress: 100, actionBy: "seed_warehouse_director", actionByName: "Nazirahmad Bashare", actionByRole: ROLES.WAREHOUSE_DIRECTOR, comment: "جنس وسپارل شو او موجودي یو ځل کمه شوه.", createdAt: BASE_TS + 5000, createdAtHijriShamsi: "۱۴۰۵/۰۱/۲۰", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۶" },
    { id: "pipe_6", requestId: "demo_req_2", stage: "تدارکاتو ته استول", status: "StockNotAvailable", progress: 20, actionBy: "seed_admin", actionByName: "Fazalrahman Mayar", actionByRole: ROLES.ADMIN, comment: "موجودي کمه وه، تدارکاتو ته واستول شوه.", createdAt: BASE_TS + 6000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۰۴", createdAtHijriQamari: "۱۴۴۷/۱۱/۰۷" },
    { id: "pipe_7", requestId: "demo_req_2", stage: "جګړه پاڼه او قیمتونه", status: "TenderCreated", progress: 25, actionBy: "seed_procurement", actionByName: "Abdulhadi Rahimi", actionByRole: ROLES.PROCUREMENT_DIRECTOR, comment: "درې قیمتونه ترلاسه شول.", createdAt: BASE_TS + 7000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۰۷", createdAtHijriQamari: "۱۴۴۷/۱۱/۱۰" },
    { id: "pipe_8", requestId: "demo_req_2", stage: "مقایسوي فورم", status: "WinnerSelected", progress: 40, actionBy: "seed_procurement", actionByName: "Abdulhadi Rahimi", actionByRole: ROLES.PROCUREMENT_DIRECTOR, comment: "تر ټولو ټیټه بیه انتخاب شوه.", createdAt: BASE_TS + 8000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۱۰", createdAtHijriQamari: "۱۴۴۷/۱۱/۱۳" },
    { id: "pipe_9", requestId: "demo_req_2", stage: "آمر خریداري", status: "PurchaseOrderCreated", progress: 50, actionBy: "seed_procurement", actionByName: "Abdulhadi Rahimi", actionByRole: ROLES.PROCUREMENT_DIRECTOR, comment: "آمر خریداري جوړ شو.", createdAt: BASE_TS + 9000, createdAtHijriShamsi: "۱۴۰۵/۰۲/۱۳", createdAtHijriQamari: "۱۴۴۷/۱۱/۱۶" },
  ];
  setLocalItem("request_pipeline", records);
  return records;
}

export function getDemoPipeline(): PipelineRecord[] {
  return seedDemoPipeline();
}

export function saveDemoPipeline(records: PipelineRecord[]): void {
  setLocalItem("request_pipeline", records);
}

export function getDemoLevelHistory(): RequestLevelRecord[] {
  const saved = getLocalItem<RequestLevelRecord[]>("request_level_history", []);
  if (saved.length > 0) return saved;
  const history: RequestLevelRecord[] = [
    { id: "level_1", requestId: "demo_req_2", oldLevel: "متوسط", newLevel: "ډېر مهم", changedBy: "seed_procurement", changedByName: "Abdulhadi Rahimi", changedByRole: ROLES.PROCUREMENT_DIRECTOR, comment: "د صنفي اړتیا له امله درجه لوړه شوه.", changedAt: BASE_TS + 6500, changedAtHijriShamsi: "۱۴۰۵/۰۲/۰۶", changedAtHijriQamari: "۱۴۴۷/۱۱/۰۹" },
  ];
  setLocalItem("request_level_history", history);
  return history;
}

export function getDemoEmailLogs(): DemoEmailLog[] {
  const saved = getLocalItem<DemoEmailLog[]>("email_logs", []);
  if (saved.length > 0) return saved;
  const logs: DemoEmailLog[] = [
    { id: "email_1", to: "enayatzoon@gmail.com", subject: "ستاسې د غوښتنې اجناس رسېدلي دي", body: "ستاسې غوښتنه ګدام ته رسېدلې ده. مهرباني وکړئ د تسلیمۍ لپاره مراجعه وکړئ.", relatedRequestId: "demo_req_1", requestLevel: "ډېر مهم", status: "Sent", createdAt: BASE_TS + 9800, createdAtHijriShamsi: "۱۴۰۵/۰۱/۲۰", createdAtHijriQamari: "۱۴۴۷/۱۰/۰۶" },
  ];
  setLocalItem("email_logs", logs);
  return logs;
}

export function saveDemoEmailLogs(logs: DemoEmailLog[]): void {
  setLocalItem("email_logs", logs);
}

export function makeLocalId(prefix: string): string {
  return uid(prefix);
}
