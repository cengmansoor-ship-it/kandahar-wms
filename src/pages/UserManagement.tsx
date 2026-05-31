import { useEffect, useState, useMemo } from "react";
import PageMeta from "../components/common/PageMeta";
import Breadcrumb from "../components/common/Breadcrumb";
import { getDemoUsers, setLocalItem, getLocalItem } from "../firebase/localStore";
import type { UserProfile } from "../firebase/firestore";
import { ROLES, UserRole } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import { getCurrentHijriDates } from "../utils/dateUtils";

const ALL_ROLES = [
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

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<{
    name: string; email: string; role: UserRole;
    phone: string; active: boolean; password: string;
  }>({ name: "", email: "", role: ROLES.REQUESTER, phone: "", active: true, password: "" });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const { profile } = useAuth();

  useEffect(() => { setUsers(getDemoUsers()); }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (ROLE_LABELS[u.role] || "").includes(q)
    );
  }, [users, search]);

  const openAdd = () => {
    setEditUser(null);
    setFormData({ name: "", email: "", role: ROLES.REQUESTER, phone: "", active: true, password: "" });
    setShowPass(false);
    setShowForm(true);
    setMsg("");
  };

  const openEdit = (u: UserProfile) => {
    setEditUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, phone: u.phone || "", active: u.active, password: "" });
    setShowPass(false);
    setShowForm(true);
    setMsg("");
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setMsg("مهرباني وکړئ نوم او ایمیل ډک کړئ.");
      return;
    }
    if (!editUser && !formData.password.trim()) {
      setMsg("مهرباني وکړئ د نوي کاروونکي لپاره پټنوم ولیکئ.");
      return;
    }
    setSaving(true);
    const dates = getCurrentHijriDates();
    const allUsers = getDemoUsers();

    if (editUser) {
      const updated = allUsers.map(u =>
        u.uid === editUser.uid
          ? { ...u, name: formData.name, email: formData.email, role: formData.role, phone: formData.phone, active: formData.active, updatedAt: dates.timestamp }
          : u
      );
      setLocalItem("users", updated);
      setUsers(updated);

      if (formData.password.trim()) {
        const overrides = getLocalItem<{ email: string; password: string }[]>("password_overrides", []);
        const filtered = overrides.filter(o => o.email.toLowerCase() !== formData.email.trim().toLowerCase());
        setLocalItem("password_overrides", [...filtered, { email: formData.email.trim().toLowerCase(), password: formData.password.trim() }]);
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
      };
      const updatedUsers = [newUser, ...allUsers];
      setLocalItem("users", updatedUsers);
      setUsers(updatedUsers);

      const overrides = getLocalItem<{ email: string; password: string }[]>("password_overrides", []);
      setLocalItem("password_overrides", [...overrides, { email: formData.email.trim().toLowerCase(), password: formData.password.trim() }]);

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
  };

  return (
    <>
      <PageMeta title="د کاروونکو مدیریت | Kandahar University WMS" description="د کاروونکو مدیریت" />
      <Breadcrumb pageTitle="د کاروونکو مدیریت / مدیریت کاربران" />

      <div className="space-y-4 page-enter" dir="rtl">
        {msg && (
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
                          {ROLE_LABELS[u.role] || u.role}
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
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-xl">
              <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-white/90 text-right">
                {editUser ? "د کاروونکي سمون" : "نوی کاروونکی"}
              </h3>
              {msg && <p className="mb-3 text-sm text-red-600 dark:text-red-400 text-right">{msg}</p>}
              <div className="space-y-3" dir="rtl">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">نوم *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">برېښنالیک *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {editUser ? "نوی پټنوم (که بدلول غواړئ)" : "پټنوم *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editUser ? "خالي پرېږدئ که بدلول نه غواړئ" : "پټنوم"}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">ټلیفون</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">رول / صلاحیت</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white/90"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فعال</label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => { setShowForm(false); setMsg(""); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                >
                  لغوه
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90 transition disabled:opacity-60"
                >
                  {saving ? "خوندي کول..." : "ذخیره"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
