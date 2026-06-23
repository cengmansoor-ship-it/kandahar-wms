import { useEffect, useState, useMemo } from "react";
import PageMeta from "../components/common/PageMeta";
import Breadcrumb from "../components/common/Breadcrumb";
import { getDemoUsers, setLocalItem, getLocalItem, DEMO_SEED_USERS } from "../firebase/localStore";
import type { UserProfile } from "../firebase/firestore";
import { ROLES, UserRole } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { getCurrentHijriDates } from "../utils/dateUtils";
import CurrentDateBadge from "../components/common/CurrentDateBadge";

interface CustomRole {
  id: number;
  name: string;
  name_ps: string;
  name_dr: string;
  permissions: string[];
}

interface Faculty {
  id: number;
  name_ps: string;
  name_fa: string;
  level: string;
}

interface Department {
  id: number;
  name_ps: string;
  name_fa: string;
  department_type: string;
  faculty_id: number | null;
  faculty_name_ps?: string;
  faculty_level?: string;
}

const BUILTIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.PROCUREMENT_DIRECTOR,
  ROLES.WAREHOUSE_DIRECTOR,
  ROLES.WAREHOUSE_ENTRY_PERSON,
  ROLES.REQUEST_CONFIRMER,
  ROLES.REQUESTER,
];

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "سوپر اډمین",
  [ROLES.ADMIN]: "اډمین",
  [ROLES.PROCUREMENT_DIRECTOR]: "د تدارکاتو آمر",
  [ROLES.WAREHOUSE_DIRECTOR]: "د ګدام آمر",
  [ROLES.WAREHOUSE_ENTRY_PERSON]: "د ګدام ثبت کوونکی",
  [ROLES.REQUEST_CONFIRMER]: "د غوښتنې تاییدوونکی",
  [ROLES.REQUESTER]: "غوښتونکی",
};

const LEVELS = [
  { value: "Bachelor", label: "لېسانس" },
  { value: "Master",   label: "ماسټري" },
  { value: "PhD",      label: "دوکتورا" },
  { value: "General",  label: "عمومي" },
];

const emptyTraceForm = {
  section_type: "" as "" | "ADMIN" | "FACULTY",
  level: "",
  faculty_id: "",
  department_id: "",
  position: "",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<{
    name: string; email: string; role: UserRole;
    phone: string; active: boolean; password: string;
  }>({ name: "", email: "", role: ROLES.REQUESTER, phone: "", active: true, password: "" });
  const [traceForm, setTraceForm] = useState(emptyTraceForm);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const { profile } = useAuth();

  const loadCustomRoles = async () => {
    try {
      const res = await fetch("/api/custom-roles");
      const data = await res.json();
      if (data.success) setCustomRoles(data.data);
    } catch { /* ignore */ }
  };

  const loadTraceData = async () => {
    try {
      const [fRes, dRes] = await Promise.all([
        fetch("/api/management/faculties"),
        fetch("/api/management/departments"),
      ]);
      const fData = await fRes.json();
      const dData = await dRes.json();
      if (fData.success) setFaculties(fData.data);
      if (dData.success) setDepartments(dData.data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    setUsers(getDemoUsers());
    loadCustomRoles();
    loadTraceData();
  }, []);

  const allRoleLabels = useMemo(() => {
    const map: Record<string, string> = { ...ROLE_LABELS };
    customRoles.forEach(cr => { map[cr.name] = cr.name_ps || cr.name; });
    return map;
  }, [customRoles]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (allRoleLabels[u.role] || "").includes(q)
    );
  }, [users, search, allRoleLabels]);

  const adminDepts = useMemo(
    () => departments.filter(d => d.department_type === "ADMIN"),
    [departments]
  );

  const filteredFaculties = useMemo(() => {
    if (!traceForm.level) return faculties;
    return faculties.filter(f => f.level === traceForm.level);
  }, [faculties, traceForm.level]);

  const filteredFacultyDepts = useMemo(() => {
    if (!traceForm.faculty_id) return [];
    return departments.filter(
      d => d.department_type === "FACULTY" && String(d.faculty_id) === String(traceForm.faculty_id)
    );
  }, [departments, traceForm.faculty_id]);

  const openAdd = () => {
    setEditUser(null);
    setFormData({ name: "", email: "", role: ROLES.REQUESTER, phone: "", active: true, password: "" });
    setTraceForm(emptyTraceForm);
    setShowPass(false);
    setShowForm(true);
    setMsg("");
  };

  const openEdit = async (u: UserProfile) => {
    setEditUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, phone: u.phone || "", active: u.active, password: "" });
    setTraceForm(emptyTraceForm);
    setShowPass(false);
    setMsg("");
    // Try to load existing person linkage from backend by email
    try {
      const res = await fetch(`/api/management/people/find-by-email?email=${encodeURIComponent(u.email)}`);
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        if (p.department_id) {
          // Find which faculty this dept belongs to
          const deptObj = departments.find(d => d.id === p.department_id);
          const sectionType = deptObj?.department_type === "ADMIN" ? "ADMIN" : "FACULTY";
          setTraceForm({
            section_type: sectionType,
            level: deptObj?.faculty_level || "",
            faculty_id: deptObj?.faculty_id ? String(deptObj.faculty_id) : "",
            department_id: String(p.department_id),
            position: p.position || "",
          });
        } else if (p.direct_faculty_id || p.faculty_id) {
          const fid = p.direct_faculty_id || p.faculty_id;
          const facObj = faculties.find(f => f.id === fid);
          setTraceForm({
            section_type: "FACULTY",
            level: facObj?.level || "",
            faculty_id: String(fid),
            department_id: "",
            position: p.position || "",
          });
        }
      }
    } catch { /* non-blocking */ }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setMsg("مهرباني وکړئ نوم او ایمیل ډک کړئ.");
      return;
    }
    if (!editUser && !formData.password.trim()) {
      setMsg("مهرباني وکړئ د نوي کاروونکي لپاره پټنوم ولیکئ.");
      return;
    }

    const isConfirmer = formData.role === ROLES.REQUEST_CONFIRMER;
    if (traceForm.section_type === "ADMIN" && !traceForm.department_id) {
      setMsg("مهرباني وکړئ اداري ډیپارټمنټ غوره کړئ.");
      return;
    }
    if (traceForm.section_type === "FACULTY" && !isConfirmer && !traceForm.department_id) {
      setMsg("مهرباني وکړئ د پوهنځي ډیپارټمنټ غوره کړئ.");
      return;
    }
    if (traceForm.section_type === "FACULTY" && isConfirmer && !traceForm.faculty_id) {
      setMsg("مهرباني وکړئ پوهنځی غوره کړئ.");
      return;
    }

    setSaving(true);
    const dates = getCurrentHijriDates();
    const allUsers = getDemoUsers();

    if (editUser) {
      // Build faculty_id / department_id to persist on the user record (traceability linkage)
      const persistFacultyId  = traceForm.faculty_id  ? Number(traceForm.faculty_id)  : undefined;
      const persistDeptId     = traceForm.department_id ? Number(traceForm.department_id) : undefined;
      const updated = allUsers.map(u =>
        u.uid === editUser.uid
          ? {
              ...u,
              name: formData.name, email: formData.email, role: formData.role,
              phone: formData.phone, active: formData.active, updatedAt: dates.timestamp,
              ...(persistFacultyId !== undefined ? { faculty_id: persistFacultyId } : {}),
              ...(persistDeptId    !== undefined ? { department_id: persistDeptId } : {}),
            }
          : u
      );
      setLocalItem("users", updated);
      setUsers(updated);
      window.dispatchEvent(new Event("wms_profile_updated"));

      const oldEmail = editUser.email.trim().toLowerCase();
      const newEmail = formData.email.trim().toLowerCase();
      let overrides = getLocalItem<{ email: string; password: string }[]>("password_overrides", []);

      if (oldEmail !== newEmail) {
        const oldOverride = overrides.find(o => o.email.toLowerCase() === oldEmail);
        overrides = overrides.filter(o => o.email.toLowerCase() !== oldEmail && o.email.toLowerCase() !== newEmail);
        if (oldOverride && !formData.password.trim()) {
          overrides = [...overrides, { email: newEmail, password: oldOverride.password }];
        } else if (!oldOverride && !formData.password.trim()) {
          const seedByUid = DEMO_SEED_USERS.find(s => s.uid === editUser.uid);
          if (seedByUid) {
            overrides = [...overrides, { email: newEmail, password: seedByUid.password }];
          }
        }
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem("kandahar_wms_demo_auth_user");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.uid === editUser.uid) {
                window.localStorage.setItem("kandahar_wms_demo_auth_user", JSON.stringify({ ...parsed, email: newEmail }));
              }
            } catch { /* ignore */ }
          }
        }
      }

      if (formData.password.trim()) {
        overrides = overrides.filter(o => o.email.toLowerCase() !== newEmail);
        overrides = [...overrides, { email: newEmail, password: formData.password.trim() }];
      }

      setLocalItem("password_overrides", overrides);

      if (traceForm.section_type && (traceForm.department_id || traceForm.faculty_id)) {
        try {
          await fetch("/api/management/people", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: formData.name,
              ...(traceForm.department_id ? { department_id: Number(traceForm.department_id) } : {}),
              ...(traceForm.faculty_id    ? { faculty_id:    Number(traceForm.faculty_id)    } : {}),
              position: traceForm.position || allRoleLabels[formData.role] || formData.role,
              email: formData.email,
              phone: formData.phone || null,
            }),
          });
        } catch { /* non-blocking */ }
      }

      setMsg("کاروونکی بریالیتوب سره تازه شو.");
    } else {
      const existing = allUsers.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (existing) {
        setMsg("دا ایمیل دمخه ثبت شوی دی.");
        setSaving(false);
        return;
      }
      const newUser: UserProfile = {
        uid: `user_${Date.now()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        active: formData.active,
        forcePasswordChange: false,
        createdAt: dates.timestamp,
        updatedAt: dates.timestamp,
        ...(traceForm.faculty_id  ? { faculty_id:  Number(traceForm.faculty_id)  } : {}),
        ...(traceForm.department_id ? { department_id: Number(traceForm.department_id) } : {}),
      };
      const updatedUsers = [newUser, ...allUsers];
      setLocalItem("users", updatedUsers);
      setUsers(updatedUsers);
      window.dispatchEvent(new Event("wms_profile_updated"));

      const overrides = getLocalItem<{ email: string; password: string }[]>("password_overrides", []);
      setLocalItem("password_overrides", [...overrides, { email: formData.email.trim().toLowerCase(), password: formData.password.trim() }]);

      if (traceForm.section_type && (traceForm.department_id || traceForm.faculty_id)) {
        try {
          await fetch("/api/management/people", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: formData.name,
              ...(traceForm.department_id ? { department_id: Number(traceForm.department_id) } : {}),
              ...(traceForm.faculty_id    ? { faculty_id:    Number(traceForm.faculty_id)    } : {}),
              position: traceForm.position || allRoleLabels[formData.role] || formData.role,
              email: formData.email,
              phone: formData.phone || null,
            }),
          });
        } catch { /* non-blocking */ }
      }

      setMsg("کاروونکی بریالیتوب سره اضافه شو.");
    }

    setSaving(false);
    setShowForm(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleToggleActive = (uid: string) => {
    const all = getDemoUsers();
    const updated = all.map(u => u.uid === uid ? { ...u, active: !u.active } : u);
    setLocalItem("users", updated);
    setUsers(updated);
    window.dispatchEvent(new Event("wms_profile_updated"));
  };

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90";
  const labelCls = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <>
      <PageMeta title="د کاروونکو مدیریت | Kandahar University WMS" description="د کاروونکو مدیریت" />
      <Breadcrumb pageTitle="د کاروونکو مدیریت / مدیریت کاربران" />
      <div className="flex justify-end mb-2" dir="rtl"><CurrentDateBadge /></div>

      <div className="space-y-4 page-enter" dir="rtl">
        {msg && !showForm && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-green-700 text-sm dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 animate-slide-down">
            {msg}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] animate-slide-up">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">کاروونکي / کاربران</h3>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-md btn-press"
            >
              + نوی کاروونکی
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="لټون... (نوم، ایمیل، رول)"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-right text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              />
            </div>
            {search && <p className="mt-1 text-xs text-gray-400">{filteredUsers.length} پایله</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/60">
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-white/80 text-right text-sm">نوم</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-white/80 text-right text-sm">برېښنالیک</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-white/80 text-right text-sm">رول</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-white/80 text-right text-sm">حالت</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-white/80 text-right text-sm">عمل</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 animate-fade-in">
                      {search ? `"${search}" لپاره هیڅ کاروونکی ونه موندل شو.` : "هیڅ کاروونکی نشته."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={u.uid}
                      className="border-b border-gray-100 table-row-hover dark:border-gray-800 animate-slide-up"
                      style={{ animationDelay: `${Math.min(idx, 15) * 35}ms` }}>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 text-right">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{u.email}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {allRoleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${u.active ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                          {u.active ? "فعال" : "غیر فعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(u)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition"
                          >
                            سمون
                          </button>
                          {profile?.uid !== u.uid && (
                            <button
                              onClick={() => handleToggleActive(u.uid)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition ${u.active ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"}`}
                            >
                              {u.active ? "غیر فعالول" : "فعالول"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-xl flex flex-col max-h-[92vh]">
              <div className="px-6 pt-6 pb-2 shrink-0">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 text-right">
                  {editUser ? "✏️ د کاروونکي سمون" : "➕ نوی کاروونکی"}
                </h3>
              </div>

              <div className="overflow-y-auto flex-1 px-6 pb-2">
                {msg && <p className="mb-3 text-sm text-red-600 dark:text-red-400 text-right bg-red-50 dark:bg-red-900/20 rounded-lg p-2">{msg}</p>}

                <div className="space-y-3" dir="rtl">
                  <div>
                    <label className={labelCls}>نوم *</label>
                    <input type="text" value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>برېښنالیک *</label>
                    <input type="email" value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>{editUser ? "نوی پټنوم (که بدلول غواړئ)" : "پټنوم *"}</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editUser ? "خالي پرېږدئ که بدلول نه غواړئ" : "پټنوم"}
                        className={inputCls}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>ټلیفون</label>
                    <input type="text" value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>رول / صلاحیت</label>
                    <select value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className={inputCls}>
                      <optgroup label="— سیستم رولونه —">
                        {BUILTIN_ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                        ))}
                      </optgroup>
                      {customRoles.length > 0 && (
                        <optgroup label="— ځانګړي رولونه —">
                          {customRoles.map(cr => (
                            <option key={`custom_${cr.id}`} value={cr.name}>{cr.name_ps || cr.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فعال</label>
                    <input type="checkbox" checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300" />
                  </div>

                  {/* ─── Traceability Section ─────────────────────────────── */}
                  <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 mt-1">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                      <span>🔗</span> د اجناسو تعقیب سره نښلول (د ټریسیبلیټي لپاره)
                    </p>

                    <div className="mb-3">
                      <label className={labelCls}>بخش / سکتور</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: "" as const,       label: "نه — بې ارتباطه",  icon: "🚫" },
                          { val: "ADMIN" as const,   label: "اداري",           icon: "🏛️" },
                          { val: "FACULTY" as const, label: "پوهنځی",          icon: "🎓" },
                        ].map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => setTraceForm({ ...emptyTraceForm, section_type: opt.val })}
                            className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all
                              ${traceForm.section_type === opt.val
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400"
                              }`}
                          >
                            <span className="text-lg">{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {traceForm.section_type === "ADMIN" && (
                      <div className="space-y-3 animate-slide-up">
                        <div>
                          <label className={labelCls}>اداري ډیپارټمنټ *</label>
                          {adminDepts.length === 0 ? (
                            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                              ⚠️ اداري ډیپارټمنټونه نشته — لومړی د ټریسیبلیټي مینیو کې اضافه کړئ
                            </div>
                          ) : (
                            <select value={traceForm.department_id}
                              onChange={e => setTraceForm({ ...traceForm, department_id: e.target.value })}
                              className={inputCls}>
                              <option value="">— ډیپارټمنټ غوره کړئ —</option>
                              {adminDepts.map(d => (
                                <option key={d.id} value={d.id}>{d.name_ps}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          <label className={labelCls}>دنده / وظیفه</label>
                          <input type="text" value={traceForm.position}
                            onChange={e => setTraceForm({ ...traceForm, position: e.target.value })}
                            placeholder="مثال: د ګدام مسؤل، د اطلاعاتو آمر..."
                            className={inputCls} />
                        </div>
                      </div>
                    )}

                    {traceForm.section_type === "FACULTY" && (
                      <div className="space-y-3 animate-slide-up">
                        <div>
                          <label className={labelCls}>کچه / سطح *</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {LEVELS.map(lv => (
                              <button key={lv.value} type="button"
                                onClick={() => setTraceForm({ ...traceForm, level: lv.value, faculty_id: "", department_id: "" })}
                                className={`py-2 rounded-lg border text-xs font-semibold transition-all
                                  ${traceForm.level === lv.value
                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400"
                                  }`}>
                                {lv.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {traceForm.level && (
                          <div>
                            <label className={labelCls}>پوهنځی *</label>
                            {filteredFaculties.length === 0 ? (
                              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                                ⚠️ پوهنځیانه نشته — لومړی د ټریسیبلیټي مینیو کې اضافه کړئ
                              </div>
                            ) : (
                              <select value={traceForm.faculty_id}
                                onChange={e => setTraceForm({ ...traceForm, faculty_id: e.target.value, department_id: "" })}
                                className={inputCls}>
                                <option value="">— پوهنځی غوره کړئ —</option>
                                {filteredFaculties.map(f => (
                                  <option key={f.id} value={f.id}>{f.name_ps}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* Department dropdown — hidden for REQUEST_CONFIRMER (faculty dean, not dept-level) */}
                        {traceForm.faculty_id && formData.role !== ROLES.REQUEST_CONFIRMER && (
                          <div>
                            <label className={labelCls}>ډیپارټمنټ *</label>
                            {filteredFacultyDepts.length === 0 ? (
                              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                                ⚠️ ډیپارټمنټونه نشته — لومړی د ټریسیبلیټي مینیو کې اضافه کړئ
                              </div>
                            ) : (
                              <select value={traceForm.department_id}
                                onChange={e => setTraceForm({ ...traceForm, department_id: e.target.value })}
                                className={inputCls}>
                                <option value="">— ډیپارټمنټ غوره کړئ —</option>
                                {filteredFacultyDepts.map(d => (
                                  <option key={d.id} value={d.id}>{d.name_ps}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                        {/* Informational note for REQUEST_CONFIRMER */}
                        {traceForm.faculty_id && formData.role === ROLES.REQUEST_CONFIRMER && (
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 p-2.5 text-xs text-blue-700 dark:text-blue-300">
                            ℹ️ د تاییدوونکي (رئیس پوهنځی) لپاره یوازې پوهنځي کچه کافي ده — د ټول پوهنځي ټولې غوښتنې ورته ولاړ سي.
                          </div>
                        )}

                        <div>
                          <label className={labelCls}>دنده / وظیفه</label>
                          <input type="text" value={traceForm.position}
                            onChange={e => setTraceForm({ ...traceForm, position: e.target.value })}
                            placeholder="مثال: استاد، د پوهنځي مرستیال..."
                            className={inputCls} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex gap-3" dir="ltr">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-all shadow-sm"
                  >
                    {saving ? "⏳ خوندي کول..." : "✔ ثبت / ذخیره"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setMsg(""); }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    لغوه
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
