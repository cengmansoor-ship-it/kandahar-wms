import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../firebase/auth";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.replace("/signin");
    }
  };

  const firstLetter = profile?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" dir="rtl">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="ml-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gray-100">
          <span className="font-bold text-gray-500">{firstLetter}</span>
        </span>
        <span className="ml-1 block font-medium text-theme-sm">{profile?.name || "کارونکی"}</span>
        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute left-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {profile?.name || "کارونکی"}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {user?.email}
          </span>
          <span className="mt-1 inline-block rounded bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-500">
            {profile?.role || "User"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          وتل / خروج
        </button>
      </Dropdown>
    </div>
  );
}
