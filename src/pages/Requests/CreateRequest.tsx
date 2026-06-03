import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Button from "../../components/ui/button/Button";
import { createRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { managementService } from "../../services/management";
import { apiClient } from "../../api/apiClient";

const REQUEST_LEVELS_PS = ["ډېر عاجل", "ډېر مهم", "متوسط", "عادي", "لږ مهم"];
const REQUEST_LEVELS_DR = ["بسیار عاجل", "بسیار مهم", "متوسط", "عادی", "کم‌اهمیت"];

interface ChecklistItem {
  id: number;
  category: string;
  item_name: string;
  description: string;
  unit: string;
  estimated_price: number;
  item_code: string;
}

interface RequestItemRow {
  checklistId: string;
  name: string;
  unit: string;
  typeOrSpecification: string;
  quantity: number;
  searchText: string;
  showDropdown: boolean;
}

export default function CreateRequest() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistCategories, setChecklistCategories] = useState<string[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<RequestItemRow[]>([]);

  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [facultyMode, setFacultyMode] = useState<"dropdown" | "text">("dropdown");
  const [departmentMode, setDepartmentMode] = useState<"dropdown" | "text">("dropdown");

  const [formData, setFormData] = useState({
    faculty: "",
    faculty_id: "",
    departmentOrPerson: "",
    department_id: "",
    reason: "",
    requestLevel: "عادي",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, profile } = useAuth();
  const { pick, lang } = useLanguage();
  const navigate = useNavigate();

  const levels = lang === "dr" ? REQUEST_LEVELS_DR : REQUEST_LEVELS_PS;

  useEffect(() => {
    setChecklistLoading(true);
    Promise.all([
      apiClient.get("/checklist?active_only=true"),
      apiClient.get("/checklist/categories"),
    ]).then(([itemsRes, catsRes]) => {
      setChecklistItems(Array.isArray(itemsRes) ? itemsRes : []);
      setChecklistCategories(Array.isArray(catsRes) ? catsRes : []);
    }).catch(() => {}).finally(() => setChecklistLoading(false));

    setLoadingFaculties(true);
    managementService.getFaculties()
      .then((data: any[]) => {
        setFaculties(data || []);
        setFacultyMode(data && data.length > 0 ? "dropdown" : "text");
      })
      .catch(() => setFacultyMode("text"))
      .finally(() => setLoadingFaculties(false));
  }, []);

  useEffect(() => {
    if (!formData.faculty_id) { setDepartments([]); return; }
    managementService.getDepartments()
      .then((data: any[]) => {
        const filtered = (data || []).filter((d: any) => String(d.faculty_id) === String(formData.faculty_id));
        setDepartments(filtered);
        setDepartmentMode(filtered.length > 0 ? "dropdown" : "text");
        setFormData(prev => ({ ...prev, departmentOrPerson: "", department_id: "" }));
      })
      .catch(() => setDepartmentMode("text"));
  }, [formData.faculty_id]);

  const addItem = () => {
    setSelectedItems(prev => [...prev, {
      checklistId: "", name: "", unit: "", typeOrSpecification: "",
      quantity: 1, searchText: "", showDropdown: false,
    }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const getFilteredChecklist = (search: string, excludeIds: string[]) => {
    const q = search.trim().toLowerCase();
    return checklistItems.filter(ci => {
      if (!q) return true;
      return ci.item_name.toLowerCase().includes(q) ||
        (ci.description || "").toLowerCase().includes(q) ||
        ci.category.toLowerCase().includes(q) ||
        (ci.item_code || "").toLowerCase().includes(q);
    }).slice(0, 30);
  };

  const selectChecklistItem = (index: number, ci: ChecklistItem) => {
    const updated = [...selectedItems];
    updated[index] = {
      ...updated[index],
      checklistId: String(ci.id),
      name: ci.item_name,
      unit: ci.unit || "",
      typeOrSpecification: ci.description || "",
      searchText: ci.item_name,
      showDropdown: false,
    };
    setSelectedItems(updated);
  };

  const handleFacultySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fid = e.target.value;
    const fac = faculties.find((f: any) => String(f.id) === fid);
    setFormData(prev => ({
      ...prev,
      faculty_id: fid,
      faculty: fac ? (lang === "dr" ? fac.name_fa : fac.name_ps) : "",
      departmentOrPerson: "",
      department_id: "",
    }));
  };

  const handleDepartmentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const did = e.target.value;
    const dept = departments.find((d: any) => String(d.id) === did);
    setFormData(prev => ({
      ...prev,
      department_id: did,
      departmentOrPerson: dept ? (lang === "dr" ? dept.name_fa : dept.name_ps) : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user || !profile) {
      setError(pick("د کاروونکي معلومات ونه موندل شول.", "اطلاعات کاربر یافت نشد."));
      return;
    }
    if (!formData.faculty.trim()) {
      setError(pick("مهرباني وکړئ پوهنځی انتخاب کړئ.", "لطفاً پوهنکده را انتخاب کنید."));
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

    setLoading(true);
    try {
      const requestItems = selectedItems.map(i => ({
        itemId: i.checklistId || "",
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        specifications: i.typeOrSpecification,
      }));
      const requestId = await createRequest(
        {
          faculty: formData.faculty,
          departmentOrPerson: formData.departmentOrPerson,
          reason: formData.reason,
          originalRequestLevel: formData.requestLevel,
          currentRequestLevel: formData.requestLevel,
          items: requestItems,
        },
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

  const inputCls = "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90";
  const selCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white/90";

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
              {facultyMode === "dropdown" ? (
                <>
                  <select value={formData.faculty_id} onChange={handleFacultySelect} required disabled={loadingFaculties} className={inputCls}>
                    <option value="">{loadingFaculties ? pick("بارگذاری...", "بارگذاری...") : pick("پوهنځی غوره کړئ...", "پوهنکده انتخاب کنید...")}</option>
                    {faculties.map((f: any) => (
                      <option key={f.id} value={f.id}>{lang === "dr" ? f.name_fa : f.name_ps}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { setFacultyMode("text"); setFormData(p => ({ ...p, faculty_id: "", faculty: "" })); }}
                    className="mt-1 text-xs text-blue-500 hover:underline">{pick("لاسي ولیکئ", "تایپ کنید")}</button>
                </>
              ) : (
                <>
                  <input type="text" value={formData.faculty}
                    onChange={e => setFormData({ ...formData, faculty: e.target.value, faculty_id: "" })}
                    required placeholder={pick("مثلاً: کمپیوټر ساینس", "مثلاً: علوم کامپیوتر")} className={inputCls} />
                  {faculties.length > 0 && (
                    <button type="button" onClick={() => setFacultyMode("dropdown")}
                      className="mt-1 text-xs text-blue-500 hover:underline">{pick("د لیست نه غوره کړئ", "از لیست انتخاب کنید")}</button>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pick("څانګه یا کس", "دیپارتمنت یا شخص")} <span className="text-red-500">*</span>
              </label>
              {departmentMode === "dropdown" && formData.faculty_id && departments.length > 0 ? (
                <>
                  <select value={formData.department_id} onChange={handleDepartmentSelect} required className={inputCls}>
                    <option value="">{pick("څانګه غوره کړئ...", "دیپارتمنت انتخاب کنید...")}</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{lang === "dr" ? d.name_fa : d.name_ps}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => { setDepartmentMode("text"); setFormData(p => ({ ...p, department_id: "", departmentOrPerson: "" })); }}
                    className="mt-1 text-xs text-blue-500 hover:underline">{pick("لاسي ولیکئ", "تایپ کنید")}</button>
                </>
              ) : formData.faculty_id && departments.length === 0 ? (
                <>
                  <input type="text" value={formData.departmentOrPerson}
                    onChange={e => setFormData({ ...formData, departmentOrPerson: e.target.value })}
                    required placeholder={pick("لاسي ولیکئ", "تایپ کنید")} className={inputCls} />
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {pick("د دې پوهنځي لپاره ډیپارتمنت ثبت نه دی", "برای این پوهنکده دیپارتمنت ثبت نشده است")}
                  </p>
                </>
              ) : (
                <>
                  <input type="text" value={formData.departmentOrPerson}
                    onChange={e => setFormData({ ...formData, departmentOrPerson: e.target.value })}
                    required placeholder={pick("مثلاً: تدریسي مدیریت", "مثلاً: مدیریت آموزشی")} className={inputCls} />
                  {departments.length > 0 && (
                    <button type="button" onClick={() => setDepartmentMode("dropdown")}
                      className="mt-1 text-xs text-blue-500 hover:underline">{pick("د لیست نه غوره کړئ", "از لیست انتخاب کنید")}</button>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {pick("د غوښتنې درجه", "درجه درخواست")} <span className="text-red-500">*</span>
              </label>
              <select className={inputCls} value={formData.requestLevel}
                onChange={e => setFormData({ ...formData, requestLevel: e.target.value })} required>
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
              className={inputCls} rows={3} required
              placeholder={pick("د غوښتنې لنډه توضیح...", "توضیح مختصر درخواست...")} />
          </div>

          <div className="border-t pt-6 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">{pick("غوښتل شوي اجناس", "اجناس درخواست‌شده")}</h3>
                {checklistLoading && (
                  <p className="text-xs text-gray-400 mt-0.5">{pick("د چکلیسټ بارول...", "بارگذاری چک‌لیست...")}</p>
                )}
                {!checklistLoading && checklistItems.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pick(`${checklistItems.length} جنسونه د چکلیسټ کې`, `${checklistItems.length} جنس در چک‌لیست`)}
                  </p>
                )}
              </div>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition">
                + {pick("جنس اضافه کول", "افزودن جنس")}
              </button>
            </div>

            <div className="space-y-4">
              {selectedItems.map((sItem, index) => (
                <div key={index} className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {pick("جنس", "جنس")} #{index + 1}
                    </span>
                    <button type="button" onClick={() => removeItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        {pick("جنس انتخاب کړئ *", "انتخاب جنس *")}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={pick("لټون... (نوم، کټګوري، کوډ)", "جستجو... (نام، دسته، کد)")}
                          value={sItem.searchText}
                          onChange={e => {
                            const updated = [...selectedItems];
                            updated[index] = { ...updated[index], searchText: e.target.value, showDropdown: true, checklistId: "", name: e.target.value };
                            setSelectedItems(updated);
                          }}
                          onFocus={() => {
                            const updated = [...selectedItems];
                            updated[index] = { ...updated[index], showDropdown: true };
                            setSelectedItems(updated);
                          }}
                          onBlur={() => setTimeout(() => {
                            const updated = [...selectedItems];
                            updated[index] = { ...updated[index], showDropdown: false };
                            setSelectedItems(updated);
                          }, 200)}
                          className={selCls}
                        />
                        {sItem.showDropdown && (
                          <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            {checklistLoading ? (
                              <div className="px-3 py-2 text-xs text-gray-400">{pick("بارول...", "در حال بارگذاری...")}</div>
                            ) : (
                              <>
                                {getFilteredChecklist(sItem.searchText, []).length === 0 ? (
                                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                    {pick("هیڅ جنس ونه موندل شو", "جنسی یافت نشد")}
                                  </div>
                                ) : (
                                  getFilteredChecklist(sItem.searchText, []).map(ci => (
                                    <button key={ci.id} type="button"
                                      onMouseDown={() => selectChecklistItem(index, ci)}
                                      className="w-full text-right px-3 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-gray-800 dark:text-white/90">{ci.item_name}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shrink-0">{ci.category}</span>
                                      </div>
                                      {ci.description && (
                                        <div className="text-xs text-gray-400 mt-0.5 truncate">{ci.description}</div>
                                      )}
                                      <div className="flex gap-2 mt-0.5">
                                        {ci.unit && <span className="text-xs text-gray-400">{pick("واحد:", "واحد:")} {ci.unit}</span>}
                                        {ci.item_code && <span className="text-xs font-mono text-gray-300 dark:text-gray-600">{ci.item_code}</span>}
                                      </div>
                                    </button>
                                  ))
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {sItem.checklistId && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {pick("انتخاب شوی:", "انتخاب‌شده:")} <span className="font-medium text-primary">{sItem.name}</span>
                          {sItem.typeOrSpecification && <> — <span className="text-gray-400">{sItem.typeOrSpecification}</span></>}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">{pick("مقدار *", "مقدار *")}</label>
                      <input type="number" value={sItem.quantity}
                        onChange={e => {
                          const updated = [...selectedItems];
                          updated[index] = { ...updated[index], quantity: Number(e.target.value) };
                          setSelectedItems(updated);
                        }}
                        min="1" required className={selCls} />
                      {sItem.unit && <p className="mt-1 text-xs text-gray-400">{pick("واحد:", "واحد:")} {sItem.unit}</p>}
                    </div>
                  </div>
                </div>
              ))}

              {selectedItems.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="mb-2">{pick("هیڅ جنس نه دی زیات شوی.", "هیچ جنسی اضافه نشده است.")}</p>
                  <p className="text-xs">{pick("د جنس اضافه کولو بټن ووهئ.", "دکمه افزودن جنس را بزنید.")}</p>
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
              {loading ? pick("ثبتیږي...", "در حال ثبت...") : pick("غوښتنه ثبتول", "ثبت درخواست")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
