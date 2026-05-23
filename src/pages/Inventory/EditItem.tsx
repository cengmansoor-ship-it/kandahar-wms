import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { apiClient } from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { budgetService, BudgetBab, BudgetFasl } from "../../services/budget";

interface LookupItem { id: number; name_ps: string; name_fa: string; }

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_ps: "",
    name_fa: "",
    description: "",
    category_id: "",
    unit_id: "",
    warehouse_id: "",
    minimum_stock: 0,
    unit_price: 0,
    supplier_source: "",
    bab_id: "",
    fasl_id: "",
  });

  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [units, setUnits] = useState<LookupItem[]>([]);
  const [warehouses, setWarehouses] = useState<LookupItem[]>([]);
  const [babs, setBabs] = useState<BudgetBab[]>([]);
  const [fasls, setFasls] = useState<BudgetFasl[]>([]);

  const selectCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  useEffect(() => {
    Promise.all([
      apiClient.get('/inventory/categories').then(setCategories).catch(() => {}),
      apiClient.get('/inventory/units').then(setUnits).catch(() => {}),
      apiClient.get('/inventory/warehouses').then(setWarehouses).catch(() => {}),
      budgetService.getBabs().then(setBabs).catch(() => setBabs([])),
    ]);
  }, []);

  useEffect(() => {
    if (!id) return;
    setFetching(true);
    apiClient.get(`/inventory/items/${id}`)
      .then((item: any) => {
        setFormData({
          name_ps: item.name_ps || item.name || "",
          name_fa: item.name_fa || "",
          description: item.description || "",
          category_id: item.category_id ? String(item.category_id) : "",
          unit_id: item.unit_id ? String(item.unit_id) : "",
          warehouse_id: item.warehouse_id ? String(item.warehouse_id) : "",
          minimum_stock: Number(item.minimum_stock) || 0,
          unit_price: Number(item.unit_price) || 0,
          supplier_source: item.supplier_source || "",
          bab_id: item.bab_id ? String(item.bab_id) : "",
          fasl_id: item.fasl_id ? String(item.fasl_id) : "",
        });
        if (item.bab_id) {
          budgetService.getFaslsByBab(Number(item.bab_id)).then(setFasls).catch(() => setFasls([]));
        }
      })
      .catch(() => setError("جنس ونه موندل شو."))
      .finally(() => setFetching(false));
  }, [id]);

  useEffect(() => {
    if (formData.bab_id) {
      budgetService.getFaslsByBab(Number(formData.bab_id)).then(setFasls).catch(() => setFasls([]));
    } else {
      setFasls([]);
    }
  }, [formData.bab_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "minimum_stock" || name === "unit_price") ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !profile) return;
    if (!formData.name_ps || !formData.category_id || !formData.unit_id) {
      alert("مهرباني وکړئ ټول اړین معلومات دننه کړئ.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.put(`/inventory/items/${id}`, {
        ...formData,
        category_id: Number(formData.category_id) || null,
        unit_id: Number(formData.unit_id) || null,
        warehouse_id: Number(formData.warehouse_id) || null,
        bab_id: formData.bab_id ? Number(formData.bab_id) : null,
        fasl_id: formData.fasl_id ? Number(formData.fasl_id) : null,
      });
      navigate("/inventory/items");
    } catch (err: any) {
      alert("خطا د سمولو کې: " + (err.message || "نامعلوم خطا"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center text-gray-500">بارول...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <>
      <PageMeta title="د جنس سمول | Kandahar University WMS" description="د جنس معلومات سمول" />
      <Breadcrumb pageTitle="د جنس سمول / ویرایش جنس" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>د جنس نوم (پښتو) <span className="text-error-500">*</span></Label>
              <Input name="name_ps" value={formData.name_ps} onChange={handleChange} placeholder="د جنس پښتو نوم" required />
            </div>
            <div>
              <Label>نام جنس (دری)</Label>
              <Input name="name_fa" value={formData.name_fa} onChange={handleChange} placeholder="نام جنس به دری" />
            </div>
          </div>

          <div>
            <Label>مشخصات / توضیحات</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="د جنس مشخصات..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>کټګوري / دسته‌بندی <span className="text-error-500">*</span></Label>
              <select name="category_id" value={formData.category_id} onChange={handleChange} className={selectCls} required>
                <option value="">-- کټګوري انتخاب کړئ --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name_ps || c.name_fa}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>واحد <span className="text-error-500">*</span></Label>
              <select name="unit_id" value={formData.unit_id} onChange={handleChange} className={selectCls} required>
                <option value="">-- واحد انتخاب کړئ --</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.name_ps || u.name_fa}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>ګدام / انبار</Label>
            <select name="warehouse_id" value={formData.warehouse_id} onChange={handleChange} className={selectCls}>
              <option value="">-- ګدام انتخاب کړئ --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name_ps || w.name_fa}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>کمترین حد / حداقل موجودی</Label>
              <Input type="number" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} min="0" />
            </div>
            <div>
              <Label>قیمت دانه / قیمت واحد (افغانۍ)</Label>
              <Input type="number" name="unit_price" value={formData.unit_price} onChange={handleChange} min="0" />
            </div>
          </div>

          <div>
            <Label>عرضه کوونکی / تامین‌کننده</Label>
            <Input name="supplier_source" value={formData.supplier_source} onChange={handleChange} placeholder="د عرضه کوونکي نوم" />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">د بودجې طبقه‌بندي (باب / فصل) — اختیاري</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>باب</Label>
                <select name="bab_id" value={formData.bab_id} onChange={handleChange} className={selectCls}>
                  <option value="">-- باب انتخاب کړئ --</option>
                  {babs.map(b => (
                    <option key={b.id} value={b.id}>{b.bab_code} — {b.name_ps}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>فصل</Label>
                <select name="fasl_id" value={formData.fasl_id} onChange={handleChange} className={selectCls} disabled={!formData.bab_id || fasls.length === 0}>
                  <option value="">-- فصل انتخاب کړئ --</option>
                  {fasls.map(f => (
                    <option key={f.id} value={f.id}>{f.fasl_code} — {f.name_ps}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "ساتل کیږي..." : "ساتل / ذخیره"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
