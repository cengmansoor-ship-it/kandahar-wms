import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { createItem } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";
import { budgetService, BudgetBab, BudgetFasl } from "../../services/budget";

export default function AddItem() {
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

  useEffect(() => {
    budgetService.getBabs().then(setBabs).catch(() => setBabs([]));
  }, []);

  useEffect(() => {
    if (formData.bab_id) {
      budgetService.getFaslsByBab(Number(formData.bab_id))
        .then(setFasls)
        .catch(() => setFasls([]));
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
      [name]: (name === 'minimumStockLevel' || name === 'unitPrice' || name === 'initialQuantity') ? Number(value) : value
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
      alert("مهرباني وکړئ ټول اړین معلومات دننه کړئ. / لطفا تمام معلومات ضروری را وارد کنید.");
      return;
    }
    if (formData.initialQuantity < 0 || formData.minimumStockLevel < 0 || formData.unitPrice < 0) {
      alert("مقدار نه شي کولی منفي وي. / مقدار نمیتواند منفی باشد.");
      return;
    }
    if (formData.fasl_id && !formData.bab_id) {
      alert("مهرباني وکړئ لومړی باب غوره کړئ. / لطفا ابتدا باب را انتخاب کنید.");
      return;
    }

    setLoading(true);
    try {
      await createItem(formData as any, user.uid, profile.name, profile.role);
      navigate("/inventory/items");
    } catch (error) {
      console.error("Error creating item:", error);
      alert("خطا د جنس په ثبتولو کې: / خطا در ثبت جنس: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedBab = babs.find(b => String(b.id) === formData.bab_id);
  const selectedFasl = fasls.find(f => String(f.id) === formData.fasl_id);

  return (
    <>
      <PageMeta title="نوی جنس اضافه کول | Kandahar University WMS" description="ګودام ته د نوي جنس زیاتول" />
      <Breadcrumb pageTitle="نوی جنس اضافه کول / اضافه کردن جنس جدید" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Bab / Fasl Section */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <h3 className="mb-3 text-sm font-semibold text-blue-800 dark:text-blue-300" dir="rtl">
              د بودجې طبقه‌بندي / طبقه‌بندی بودجه (باب / فصل)
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Bab Selector */}
              <div>
                <Label>باب (Bab)</Label>
                <input
                  type="text"
                  placeholder="د باب لټون... (کوډ یا نوم)"
                  value={babSearch}
                  onChange={e => setBabSearch(e.target.value)}
                  className="mb-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  dir="rtl"
                />
                <select
                  name="bab_id"
                  value={formData.bab_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  dir="rtl"
                  size={4}
                >
                  <option value="">-- باب غوره کړئ --</option>
                  {filteredBabs.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bab_code} - {b.name_ps}
                    </option>
                  ))}
                </select>
                {selectedBab && (
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300" dir="rtl">
                    ✓ {selectedBab.bab_code} — {selectedBab.name_ps} / {selectedBab.name_fa}
                  </p>
                )}
                {babs.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400" dir="rtl">د باب معلومات ندي ثبت شوي</p>
                )}
              </div>

              {/* Fasl Selector */}
              <div>
                <Label>فصل (Fasl)</Label>
                <input
                  type="text"
                  placeholder="د فصل لټون... (کوډ یا نوم)"
                  value={faslSearch}
                  onChange={e => setFaslSearch(e.target.value)}
                  disabled={!formData.bab_id}
                  className="mb-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  dir="rtl"
                />
                <select
                  name="fasl_id"
                  value={formData.fasl_id}
                  onChange={handleChange}
                  disabled={!formData.bab_id}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-primary disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  dir="rtl"
                  size={4}
                >
                  <option value="">-- فصل غوره کړئ --</option>
                  {filteredFasls.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.fasl_code} - {f.name_ps}
                    </option>
                  ))}
                </select>
                {selectedFasl && (
                  <p className="mt-1 text-xs text-blue-700 dark:text-blue-300" dir="rtl">
                    ✓ {selectedFasl.fasl_code} — {selectedFasl.name_ps} / {selectedFasl.name_fa}
                  </p>
                )}
                {formData.bab_id && fasls.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400" dir="rtl">د دې باب لپاره فصل ندی</p>
                )}
                {!formData.bab_id && (
                  <p className="mt-1 text-xs text-gray-400" dir="rtl">لومړی باب غوره کړئ</p>
                )}
              </div>
            </div>
          </div>

          {/* Main Fields */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>د جنس نوم / نام جنس <span className="text-error-500">*</span></Label>
              <Input name="name" value={formData.name} onChange={handleChange} required placeholder="مثلاً: قلم، لپټاپ" />
            </div>
            <div>
              <Label>کټګوري / کتګوری <span className="text-error-500">*</span></Label>
              <Input name="category" value={formData.category} onChange={handleChange} required placeholder="مثلاً: قرطاسیه، برښنايي وسایل" />
            </div>
            <div>
              <Label>واحد / واحد <span className="text-error-500">*</span></Label>
              <Input name="unit" value={formData.unit} onChange={handleChange} required placeholder="مثلاً: دانه، کارتن، کیلو" />
            </div>
            <div>
              <Label>مقدار / مقدار (Initial Quantity) <span className="text-error-500">*</span></Label>
              <Input type="number" name="initialQuantity" value={formData.initialQuantity} onChange={handleChange} min="0" required />
            </div>
            <div>
              <Label>کم حد / حداقل موجودی (Minimum Stock)</Label>
              <Input type="number" name="minimumStockLevel" value={formData.minimumStockLevel} onChange={handleChange} min="0" />
            </div>
            <div>
              <Label>واحد قیمت / قیمت واحد</Label>
              <Input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} min="0" />
            </div>
            <div className="md:col-span-2">
              <Label>تهیه کوونکی / منبع یا تهیه کننده (Supplier)</Label>
              <Input name="supplierOrSource" value={formData.supplierOrSource} onChange={handleChange} placeholder="مثلاً: محلي بازار، مرکزی ذخیره" />
            </div>
          </div>

          <div>
            <Label>مشخصات / مشخصات (Specifications)</Label>
            <Input name="typeOrSpecification" value={formData.typeOrSpecification} onChange={handleChange} placeholder="ماډل، رنګ، اندازه، وغیره" />
          </div>

          <div>
            <Label>توضیحات / توضیحات</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "ثبتېږي..." : "ثبتول"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
