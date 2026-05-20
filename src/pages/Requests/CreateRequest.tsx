import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { getItems, WarehouseItem } from "../../firebase/inventory";
import { createRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const REQUEST_LEVELS_PS = ["ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];
const REQUEST_LEVELS_DR = ["بسیار عاجل", "بسیار مهم", "متوسط", "عادی", "کم‌اهمیت"];

interface RequestItemRow {
  mode: "existing" | "custom";
  itemId: string;
  name: string;
  unit: string;
  typeOrSpecification: string;
  quantity: number;
}

export default function CreateRequest() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<RequestItemRow[]>([]);
  const [formData, setFormData] = useState({
    faculty: "",
    departmentOrPerson: "",
    reason: "",
    requestLevel: "عادي",
  });
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, profile } = useAuth();
  const { pick, lang } = useLanguage();
  const navigate = useNavigate();

  const levels = lang === "dr" ? REQUEST_LEVELS_DR : REQUEST_LEVELS_PS;

  useEffect(() => {
    getItems().then(setItems).catch(console.error);
  }, []);

  const getFilteredItems = (idx: number) => {
    const q = (itemSearch[idx] || "").toLowerCase().trim();
    if (!q) return items;
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q) ||
      (i.typeOrSpecification || "").toLowerCase().includes(q)
    );
  };

  const addExistingItem = () => {
    setSelectedItems(prev => [...prev, { mode: "existing", itemId: "", name: "", unit: "", typeOrSpecification: "", quantity: 1 }]);
  };

  const addCustomItem = () => {
    setSelectedItems(prev => [...prev, { mode: "custom", itemId: "", name: "", unit: "", typeOrSpecification: "", quantity: 1 }]);
  };

  const handleExistingItemChange = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], itemId: item.id, name: item.name, unit: item.unit, typeOrSpecification: item.typeOrSpecification || "" };
    setSelectedItems(updated);
  };

  const handleFieldChange = (index: number, field: keyof RequestItemRow, value: any) => {
    const updated = [...selectedItems];
    (updated[index] as any)[field] = value;
    setSelectedItems(updated);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
    setItemSearch(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !profile) {
      setError(pick("د کاروونکي معلومات ونه موندل شول.", "اطلاعات کاربر یافت نشد."));
      return;
    }
    if (selectedItems.length === 0) {
      setError(pick("مهرباني وکړئ لږترلږه یو جنس اضافه کړئ.", "لطفاً حداقل یک جنس اضافه کنید."));
      return;
    }
    const invalid = selectedItems.find(i => !i.name.trim() || i.quantity < 1);
    if (invalid) {
      setError(pick("مهرباني وکړئ د هر جنس نوم او مقدار ډک کړئ.", "لطفاً نام و مقدار هر جنس را وارد کنید."));
      return;
    }
    if (!formData.requestLevel) {
      setError(pick("مهرباني وکړئ د غوښتنې درجه انتخاب کړئ.", "لطفاً درجه درخواست را انتخاب کنید."));
      return;
    }

    setLoading(true);
    try {
      const requestItems = selectedItems.map(i => ({
        itemId: i.itemId || "",
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
      }));
      const requestId = await createRequest(
        { ...formData, originalRequestLevel: formData.requestLevel, items: requestItems },
        user.uid,
        profile.name
      );
      navigate(`/requests/details/${requestId}`);
    } catch (err: any) {
      console.error("Error creating request:", err);
      setError(pick("د غوښتنې ثبتولو کې تېروتنه رامنځته شوه.", "خطایی در ثبت درخواست رخ داد."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title={pick("نوې غوښتنه", "درخواست جدید") + " | Kandahar University WMS"} description="" />
      <Breadcrumb pageTitle="نوې غوښتنه / درخواست جدید" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]" dir="rtl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pick("پوهنځی / فاکولته", "پوهنکده / فاکولتی")} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.faculty}
                onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                required placeholder={pick("مثلاً: کمپیوټر ساینس", "مثلاً: علوم کامپیوتر")}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pick("څانګه یا کس", "دیپارتمنت یا شخص")} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={formData.departmentOrPerson}
                onChange={e => setFormData({ ...formData, departmentOrPerson: e.target.value })}
                required placeholder={pick("مثلاً: تدریسي مدیریت", "مثلاً: مدیریت آموزشی")}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pick("د غوښتنې درجه", "درجه درخواست")} <span className="text-red-500">*</span>
              </label>
              <select className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90"
                value={formData.requestLevel}
                onChange={e => setFormData({ ...formData, requestLevel: e.target.value })}
                required>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {pick("د غوښتنې علت / دلیل", "دلیل درخواست")} <span className="text-red-500">*</span>
            </label>
            <textarea value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90"
              rows={3} required
              placeholder={pick("د غوښتنې لنډه توضیح...", "توضیح مختصر درخواست...")} />
          </div>

          <div className="border-t pt-6 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{pick("غوښتل شوي اجناس", "اجناس درخواست‌شده")}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={addExistingItem}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition">
                  + {pick("د ذخیرې جنس", "از انبار")}
                </button>
                <button type="button" onClick={addCustomItem}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition">
                  + {pick("نوی / ځانګړی جنس", "جنس جدید / سفارشی")}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {selectedItems.map((sItem, index) => (
                <div key={index} className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${sItem.mode === "existing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}`}>
                      {sItem.mode === "existing" ? pick("د ذخیرې جنس", "از انبار") : pick("نوی / ځانګړی جنس", "جنس جدید / سفارشی")}
                    </span>
                    <button type="button" onClick={() => removeItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {sItem.mode === "existing" ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("جنس انتخاب کړئ *", "انتخاب جنس *")}</label>
                        <div className="space-y-1">
                          <input type="text"
                            placeholder={pick("لټون... (نوم، کټګوري)", "جستجو... (نام، دسته‌بندی)")}
                            value={itemSearch[index] || ""}
                            onChange={e => setItemSearch(prev => ({ ...prev, [index]: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                          <select className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90"
                            value={sItem.itemId} onChange={e => handleExistingItemChange(index, e.target.value)} required>
                            <option value="">{pick("انتخاب...", "انتخاب کنید...")}</option>
                            {getFilteredItems(index).map(i => (
                              <option key={i.id} value={i.id}>
                                {i.name} — {pick("موجودي:", "موجودی:")} {i.currentQuantity} {i.unit}
                              </option>
                            ))}
                          </select>
                        </div>
                        {sItem.name && (
                          <p className="mt-1 text-xs text-gray-500">{pick("انتخاب شوی:", "انتخاب‌شده:")} <span className="font-medium text-primary">{sItem.name}</span></p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("مقدار *", "مقدار *")}</label>
                        <input type="number" value={sItem.quantity}
                          onChange={e => handleFieldChange(index, "quantity", Number(e.target.value))}
                          min="1" required
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                        {sItem.unit && <p className="mt-1 text-xs text-gray-400">{pick("واحد:", "واحد:")} {sItem.unit}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("د جنس نوم *", "نام جنس *")}</label>
                        <input type="text" value={sItem.name}
                          onChange={e => handleFieldChange(index, "name", e.target.value)}
                          required placeholder={pick("د جنس نوم ولیکئ", "نام جنس را بنویسید")}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("نوعیت / مشخصات", "نوع / مشخصات")}</label>
                        <input type="text" value={sItem.typeOrSpecification}
                          onChange={e => handleFieldChange(index, "typeOrSpecification", e.target.value)}
                          placeholder={pick("مثلاً: A4، 70 ګرامه", "مثلاً: A4، ۷۰ گرم")}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("واحد", "واحد")}</label>
                        <input type="text" value={sItem.unit}
                          onChange={e => handleFieldChange(index, "unit", e.target.value)}
                          placeholder={pick("مثلاً: دانه، ریمه، متر", "مثلاً: دانه، ریم، متر")}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("مقدار *", "مقدار *")}</label>
                        <input type="number" value={sItem.quantity}
                          onChange={e => handleFieldChange(index, "quantity", Number(e.target.value))}
                          min="1" required
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {selectedItems.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="mb-2">{pick("هیڅ جنس نه دی زیات شوی.", "هیچ جنسی اضافه نشده است.")}</p>
                  <p className="text-xs">{pick("د ذخیرې جنس انتخاب کړئ یا نوی / ځانګړی جنس اضافه کړئ.", "از انبار انتخاب کنید یا جنس جدید اضافه کنید.")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6 dark:border-gray-700">
            <button type="button" onClick={() => navigate("/requests")}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition font-medium">
              {pick("لغوه کول", "لغو")}
            </button>
            <Button type="submit" disabled={loading || selectedItems.length === 0}>
              {loading ? pick("ثبتېږي...", "در حال ثبت...") : pick("غوښتنه ثبتول", "ثبت درخواست")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
