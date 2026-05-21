import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { createItem } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";
import { budgetService, BudgetBab, BudgetFasl } from "../../services/budget";
import { apiClient } from "../../api/apiClient";
import * as XLSX from "xlsx";
import { QRCodeSVG as QRCode } from "qrcode.react";

type TabMode = "manual" | "bulk";

interface BulkRow {
  name: string;
  typeOrSpecification: string;
  category: string;
  unit: string;
  warehouse: string;
  initialQuantity: number;
  minimumStock: number;
  bab?: string;
  fasl?: string;
  itemCode?: string;
  unitPrice?: number;
  totalPrice?: number;
  company?: string;
  supplier?: string;
  notes?: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  generatedCodes: number;
  errors: Array<{ row: number; reason: string }>;
  importedItems: Array<{ id: number; tracking_code: string; name: string }>;
}

const COL_MAP: Record<string, keyof BulkRow> = {
  "* د جنس نوم": "name",
  "* مشخصات": "typeOrSpecification",
  "* کټګوري": "category",
  "* واحد": "unit",
  "* ګدام": "warehouse",
  "* ابتدایي مقدار": "initialQuantity",
  "* کمترین حد": "minimumStock",
  "باب": "bab",
  "فصل": "fasl",
  "د جنس کود": "itemCode",
  "قیمت دانه": "unitPrice",
  "ټول قیمت": "totalPrice",
  "شرکت": "company",
  "عرضه کوونکی": "supplier",
  "یادښت": "notes",
};

export default function AddItem() {
  const [tab, setTab] = useState<TabMode>("manual");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    typeOrSpecification: "",
    unit: "",
    initialQuantity: 0,
    minimumStockLevel: 0,
    unitPrice: 0,
    supplierOrSource: "",
    description: "",
    bab_id: "",
    fasl_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [babs, setBabs] = useState<BudgetBab[]>([]);
  const [fasls, setFasls] = useState<BudgetFasl[]>([]);
  const [babSearch, setBabSearch] = useState("");
  const [faslSearch, setFaslSearch] = useState("");
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkPreviewReady, setBulkPreviewReady] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [printItems, setPrintItems] = useState<Array<{ id: number; tracking_code: string; name: string }>>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<{ id: string; tracking_code: string; name: string } | null>(null);

  useEffect(() => {
    budgetService.getBabs().then(setBabs).catch(() => setBabs([]));
  }, []);

  useEffect(() => {
    if (formData.bab_id) {
      budgetService.getFaslsByBab(Number(formData.bab_id)).then(setFasls).catch(() => setFasls([]));
      setFormData(prev => ({ ...prev, fasl_id: "" }));
      setFaslSearch("");
    } else {
      setFasls([]);
    }
  }, [formData.bab_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "minimumStockLevel" || name === "unitPrice" || name === "initialQuantity") ? Number(value) : value
    }));
  };

  const filteredBabs = babs.filter(b =>
    !babSearch || b.bab_code.includes(babSearch) || b.name_ps.includes(babSearch) || b.name_fa.includes(babSearch)
  );
  const filteredFasls = fasls.filter(f =>
    !faslSearch || f.fasl_code.includes(faslSearch) || f.name_ps.includes(faslSearch) || f.name_fa.includes(faslSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!formData.name || !formData.category || !formData.unit) {
      alert("مهرباني وکړئ ټول اړین معلومات دننه کړئ.");
      return;
    }
    if (formData.initialQuantity < 0 || formData.minimumStockLevel < 0 || formData.unitPrice < 0) {
      alert("مقدار نه شي کولی منفي وي.");
      return;
    }
    if (formData.fasl_id && !formData.bab_id) {
      alert("مهرباني وکړئ لومړی باب غوره کړئ.");
      return;
    }
    setLoading(true);
    try {
      const newId = await createItem(formData as any, user.uid, profile.name, profile.role);
      let tracking_code = "";
      try {
        const item = await apiClient.get(`/inventory/items/${newId}`);
        tracking_code = item?.tracking_code || "";
      } catch (_) {}
      setManualSuccess({ id: newId, tracking_code, name: formData.name });
    } catch (error) {
      console.error("Error creating item:", error);
      alert("خطا د جنس په ثبتولو کې: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = () => {
    const headers = [
      "* د جنس نوم", "* مشخصات", "* کټګوري", "* واحد", "* ګدام",
      "* ابتدایي مقدار", "* کمترین حد",
      "باب", "فصل", "د جنس کود", "قیمت دانه", "ټول قیمت", "شرکت", "عرضه کوونکی", "یادښت"
    ];
    const example = [
      "لپتاپ", "Dell Latitude 5420", "کمپیوټري وسایل", "دانه", "مرکزي ګدام",
      "5", "2",
      "۲۰۱", "۲۰۱۰۱", "ITEM-001", "45000", "225000", "Dell Inc.", "احمدي شرکت", "د دفتر لپاره"
    ];
    const guide = [
      "(اړین) د جنس بشپړ نوم", "(اړین) مشخصات یا نوعیت", "(اړین) کټګوري: باید سیستم کې شتون ولري", "(اړین) واحد: باید سیستم کې شتون ولري", "(اړین) ګدام: باید سیستم کې شتون ولري",
      "(اړین) عدد >= 0", "(اړین) عدد >= 0",
      "(اختیاري) د باب کود", "(اختیاري) د فصل کود", "(اختیاري) د جنس ځانګړی کود", "(اختیاري) قیمت دانه", "(اختیاري) ټول قیمت", "(اختیاري) شرکت", "(اختیاري) عرضه کوونکی", "(اختیاري) یادښتونه"
    ];

    const wb = XLSX.utils.book_new();
    const wsData = [headers, example, guide];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = headers.map(() => ({ wch: 22 }));

    XLSX.utils.book_append_sheet(wb, ws, "اجناس");
    XLSX.writeFile(wb, "kandahar-wms-template.xlsx");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setBulkPreviewReady(false);
    setImportResult(null);
    setBulkRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];

        if (raw.length < 2) { setFileError("فایل خالي دی."); return; }

        const headers = (raw[0] as string[]).map(h => String(h).trim());
        const rows: BulkRow[] = [];

        for (let i = 1; i < raw.length; i++) {
          const rowRaw = raw[i] as string[];
          if (rowRaw.every(v => !String(v).trim())) continue;
          const row: any = {
            name: "", typeOrSpecification: "", category: "", unit: "", warehouse: "",
            initialQuantity: 0, minimumStock: 0
          };
          headers.forEach((h, colIdx) => {
            const key = COL_MAP[h];
            if (key) {
              const val = String(rowRaw[colIdx] ?? "").trim();
              if (key === "initialQuantity" || key === "minimumStock" || key === "unitPrice" || key === "totalPrice") {
                row[key] = Number(val) || 0;
              } else {
                row[key] = val;
              }
            }
          });
          rows.push(row);
        }

        if (rows.length === 0) { setFileError("هیڅ کرښه نشته."); return; }
        setBulkRows(rows);
        setBulkPreviewReady(true);
      } catch (err: any) {
        setFileError("فایل لوستل ونشول: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkImport = async () => {
    if (!bulkRows.length) return;
    setBulkImporting(true);
    setImportResult(null);
    try {
      const result = await apiClient.post("/inventory/bulk-import", { rows: bulkRows });
      setImportResult(result);
      if (result.importedItems?.length > 0) {
        setPrintItems(result.importedItems);
      }
      setBulkPreviewReady(false);
    } catch (err: any) {
      setFileError("د وارد کولو خطا: " + err.message);
    } finally {
      setBulkImporting(false);
    }
  };

  const selectedBab = babs.find(b => String(b.id) === formData.bab_id);
  const selectedFasl = fasls.find(f => String(f.id) === formData.fasl_id);

  return (
    <>
      <PageMeta title="نوی جنس اضافه کول | Kandahar University WMS" description="ګودام ته د نوي جنس زیاتول" />
      <Breadcrumb pageTitle="نوی جنس اضافه کول / اضافه کردن جنس جدید" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab("manual")}
            className={`pb-3 px-4 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === "manual"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            dir="rtl"
          >
            د لاس له لارې اضافه کول
          </button>
          <button
            onClick={() => setTab("bulk")}
            className={`pb-3 px-4 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === "bulk"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            dir="rtl"
          >
            د اکسیل له لارې ډله‌ییز وارد کول
          </button>
        </div>

        {tab === "manual" && (
          <>
            {manualSuccess ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 p-5 text-right" dir="rtl">
                  <p className="text-green-700 dark:text-green-400 font-semibold text-base mb-1">✓ جنس "{manualSuccess.name}" ثبت شو!</p>
                  {manualSuccess.tracking_code && (
                    <p className="text-green-600 dark:text-green-300 text-sm">ترکینګ کوډ: <span className="font-mono font-bold">{manualSuccess.tracking_code}</span></p>
                  )}
                </div>
                {manualSuccess.tracking_code && (
                  <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300" dir="rtl">د چاپ لپاره QR کوډ</p>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <QRCode value={manualSuccess.tracking_code} size={130} level="M" includeMargin />
                    </div>
                    <p className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">{manualSuccess.tracking_code}</p>
                    <div className="flex gap-3">
                      <Button onClick={() => window.print()} variant="outline" className="text-sm">🖨️ د بارکوډ چاپ</Button>
                      <Button onClick={() => { setManualSuccess(null); setFormData({ name: "", category: "", typeOrSpecification: "", unit: "", initialQuantity: 0, minimumStockLevel: 0, unitPrice: 0, supplierOrSource: "", description: "", bab_id: "", fasl_id: "" }); }} variant="outline" className="text-sm">+ نوی جنس</Button>
                      <Button onClick={() => navigate("/inventory/items")} className="text-sm">لیست ته ورو</Button>
                    </div>
                  </div>
                )}
                {!manualSuccess.tracking_code && (
                  <div className="flex gap-3 justify-end">
                    <Button onClick={() => navigate("/inventory/items")}>د اجناسو لیست</Button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                  <h3 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300" dir="rtl">د بودجې طبقه‌بندي (باب / فصل)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>باب (Bab)</Label>
                      <input type="text" placeholder="د باب لټون..." value={babSearch} onChange={e => setBabSearch(e.target.value)}
                        className="mb-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" dir="rtl" />
                      <select name="bab_id" value={formData.bab_id} onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" dir="rtl" size={4}>
                        <option value="">-- باب غوره کړئ --</option>
                        {filteredBabs.map(b => <option key={b.id} value={b.id}>{b.bab_code} - {b.name_ps}</option>)}
                      </select>
                      {selectedBab && <p className="mt-1 text-xs text-blue-700 dark:text-blue-300" dir="rtl">✓ {selectedBab.bab_code} — {selectedBab.name_ps}</p>}
                    </div>
                    <div>
                      <Label>فصل (Fasl)</Label>
                      <input type="text" placeholder="د فصل لټون..." value={faslSearch} onChange={e => setFaslSearch(e.target.value)} disabled={!formData.bab_id}
                        className="mb-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" dir="rtl" />
                      <select name="fasl_id" value={formData.fasl_id} onChange={handleChange} disabled={!formData.bab_id}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" dir="rtl" size={4}>
                        <option value="">-- فصل غوره کړئ --</option>
                        {filteredFasls.map(f => <option key={f.id} value={f.id}>{f.fasl_code} - {f.name_ps}</option>)}
                      </select>
                      {selectedFasl && <p className="mt-1 text-xs text-blue-700 dark:text-blue-300" dir="rtl">✓ {selectedFasl.fasl_code} — {selectedFasl.name_ps}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>د جنس نوم / نام جنس <span className="text-error-500">*</span></Label>
                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="مثلاً: قلم، لپټاپ" />
                  </div>
                  <div>
                    <Label>کټګوري / کتګوری <span className="text-error-500">*</span></Label>
                    <Input name="category" value={formData.category} onChange={handleChange} required placeholder="مثلاً: قرطاسیه" />
                  </div>
                  <div>
                    <Label>واحد / واحد <span className="text-error-500">*</span></Label>
                    <Input name="unit" value={formData.unit} onChange={handleChange} required placeholder="مثلاً: دانه، کارتن" />
                  </div>
                  <div>
                    <Label>مقدار <span className="text-error-500">*</span></Label>
                    <Input type="number" name="initialQuantity" value={formData.initialQuantity} onChange={handleChange} min="0" required />
                  </div>
                  <div>
                    <Label>کم حد / حداقل موجودی</Label>
                    <Input type="number" name="minimumStockLevel" value={formData.minimumStockLevel} onChange={handleChange} min="0" />
                  </div>
                  <div>
                    <Label>واحد قیمت</Label>
                    <Input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} min="0" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>تهیه کوونکی / منبع</Label>
                    <Input name="supplierOrSource" value={formData.supplierOrSource} onChange={handleChange} placeholder="محلي بازار، مرکزی ذخیره" />
                  </div>
                </div>
                <div>
                  <Label>مشخصات</Label>
                  <Input name="typeOrSpecification" value={formData.typeOrSpecification} onChange={handleChange} placeholder="ماډل، رنګ، اندازه" />
                </div>
                <div>
                  <Label>توضیحات</Label>
                  <textarea name="description" value={formData.description} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right" rows={3} />
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
                  <Button type="submit" disabled={loading}>{loading ? "ثبتېږي..." : "ثبتول"}</Button>
                </div>
              </form>
            )}
          </>
        )}

        {tab === "bulk" && (
          <div className="space-y-5" dir="rtl">
            <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">لومړی ګام: د اکسیل فارمټ ښکته کول</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">د فارمټ ښکته کړئ، ډک کړئ، بیا پورته کړئ.</p>
              <Button onClick={handleExportTemplate} variant="outline" className="text-sm">
                ⬇ د اکسیل فارمټ ښکته کول / دانلود فورمت اکسیل
              </Button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">دویم ګام: د اکسیل فایل پورته کول</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="text-sm">
                📂 د اکسیل فایل غوره کول
              </Button>
              {fileError && <p className="text-xs text-red-500">{fileError}</p>}
            </div>

            {bulkPreviewReady && bulkRows.length > 0 && !importResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">د وارد کولو مخکتنه ({bulkRows.length} کرښه)</h4>
                  <Button onClick={handleBulkImport} disabled={bulkImporting} className="text-sm">
                    {bulkImporting ? "وارد کېږي..." : "✓ وارد کول / ثبت کول"}
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs" dir="rtl">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">#</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">نوم</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">مشخصات</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">کټګوري</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">واحد</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">ګدام</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">مقدار</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">کم حد</th>
                        <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">قیمت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, i) => {
                        const isInvalid = !row.name || !row.typeOrSpecification || !row.category || !row.unit || !row.warehouse;
                        return (
                          <tr key={i} className={`border-t border-gray-100 dark:border-gray-800 ${isInvalid ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                            <td className={`px-3 py-2 font-medium ${!row.name ? "text-red-500" : "text-gray-800 dark:text-white/90"}`}>{row.name || "❌ خالي"}</td>
                            <td className={`px-3 py-2 ${!row.typeOrSpecification ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>{row.typeOrSpecification || "❌"}</td>
                            <td className={`px-3 py-2 ${!row.category ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>{row.category || "❌"}</td>
                            <td className={`px-3 py-2 ${!row.unit ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>{row.unit || "❌"}</td>
                            <td className={`px-3 py-2 ${!row.warehouse ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>{row.warehouse || "❌"}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.initialQuantity}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.minimumStock}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.unitPrice || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard label="بریالي وارد شوي" value={importResult.imported} color="green" />
                  <StatCard label="جوړ شوي بارکوډونه" value={importResult.generatedCodes} color="blue" />
                  <StatCard label="تکراري (رد شوي)" value={importResult.duplicates} color="orange" />
                  <StatCard label="ناسم (رد شوي)" value={importResult.invalid} color="red" />
                </div>

                {importResult.errors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 p-4">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">خطاوې / ستونزې:</p>
                    <ul className="space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600 dark:text-red-300">
                          کرښه {err.row}: {err.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.importedItems.length > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">وارد شوي اجناس او بارکوډونه</p>
                      <Button onClick={() => setShowPrintPreview(v => !v)} variant="outline" className="text-xs">
                        🖨️ د بارکوډ چاپ ({importResult.importedItems.length})
                      </Button>
                    </div>
                    {showPrintPreview && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print-area">
                        {printItems.map((item, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 p-2 rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 text-center">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate w-full">{item.name}</p>
                            <div className="p-1.5 bg-white rounded">
                              <QRCode value={item.tracking_code} size={80} level="M" includeMargin={false} />
                            </div>
                            <p className="text-xs font-mono text-gray-500" style={{ fontSize: 9 }}>{item.tracking_code}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {showPrintPreview && (
                      <Button onClick={() => window.print()} className="w-full text-sm">🖨️ چاپ</Button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => { setImportResult(null); setBulkRows([]); setBulkPreviewReady(false); setShowPrintPreview(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    بیا وارد کول
                  </Button>
                  <Button onClick={() => navigate("/inventory/items")}>د اجناسو لیست</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "green" | "blue" | "orange" | "red" }) {
  const colors = {
    green: "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/10 text-green-700 dark:text-green-400",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400",
    orange: "border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400",
    red: "border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10 text-red-700 dark:text-red-400",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color]}`} dir="rtl">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}
