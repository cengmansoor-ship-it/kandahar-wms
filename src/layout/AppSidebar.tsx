import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { BoxCubeIcon, ChevronDownIcon, GridIcon, HorizontaLDots, ListIcon, PageIcon, PieChartIcon, TableIcon, UserCircleIcon } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { canAccessMenu } from "../utils/permissions";
import { ROLES } from "../constants/roles";

const kuLogo = "/kandahar-university-logo.png";

type NavItem = {
  id: string;
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; roles?: string[] }[];
};

// ---- Super Admin: Monitoring-oriented navigation (no data entry) ----
const getSuperAdminNavItems = (): NavItem[] => [
  { id: "superadmin_home", icon: <GridIcon />, name: "د نظارت مرکز / مرکز نظارتی", path: "/superadmin" },
  { id: "superadmin_inventory", icon: <BoxCubeIcon />, name: "موجودي / موجودی", path: "/superadmin/inventory" },
  { id: "superadmin_requests", icon: <PageIcon />, name: "غوښتنې / درخواست‌ها", path: "/superadmin/requests" },
  { id: "superadmin_procurement", icon: <TableIcon />, name: "تدارکات / تدارکات", path: "/superadmin/procurement" },
  { id: "superadmin_receiving", icon: <ListIcon />, name: "ترلاسه کول / تحویل‌گیری", path: "/superadmin/receiving" },
  { id: "forms", icon: <PageIcon />, name: "فورمونه / فرم‌ها", path: "/official-forms" },
  { id: "notifications", icon: <UserCircleIcon />, name: "خبرتیاوې / اعلانات", path: "/notifications" },
  { id: "reports", icon: <PieChartIcon />, name: "راپورونه / گزارش‌ها", subItems: [
    { name: "د راپورونو عمومي پاڼه / داشبورد گزارش", path: "/reports" },
    { name: "د موجودۍ راپور / گزارش موجودی", path: "/reports/inventory" },
    { name: "د غوښتنو راپور / گزارش درخواست‌ها", path: "/reports/requests" },
    { name: "د تدارکاتو راپور / گزارش تدارکات", path: "/reports/procurement" },
    { name: "د ترلاسه کولو راپور / گزارش تحویل", path: "/reports/delivery" },
    { name: "پوهنځي راپور / گزارش دانشکده", path: "/reports/faculty" },
    { name: "ریاست راپور / گزارش ریاست", path: "/reports/department" },
    { name: "د کسانو راپور / گزارش اشخاص", path: "/reports/person-assignment" },
    { name: "کلنۍ اړتیاوې / نیازمندی‌های سالانه", path: "/reports/needs" },
    { name: "وړاندوینه / پیش‌بینی", path: "/reports/forecast" },
    { name: "د سیستم فعالیتونه / فعالیت‌های سیستم", path: "/reports/audit" },
  ] },
  { id: "traceability_sa", icon: <ListIcon />, name: "د اجناسو تعقیب / ردیابی اجناس", path: "/traceability" },
  { id: "settings", icon: <BoxCubeIcon />, name: "تنظیمات / تنظیمات", subItems: [
    { name: "کاروونکي / کاربران", path: "/user-management" },
    { name: "صلاحیتونه / دسترسی‌ها", path: "/role-management" },
    { name: "د سیستم تنظیمات / تنظیمات سیستم", path: "/settings" },
    { name: "د بودجې طبقه‌بندي / طبقه‌بندی بودجه", path: "/settings/budget-codes" },
    { name: "حذف شوي معلومات / اطلاعات حذف‌شده", path: "/maintenance/trash" },
    { name: "بیکپ / پشتیبان‌گیری", path: "/maintenance/backup" },
    { name: "د بیا رغونې تاریخچه / تاریخچه بازیابی", path: "/maintenance/recovery-history" },
    { name: "د سیستم روغتیا / سلامت سیستم", path: "/maintenance/health" },
    { name: "وروستی کتنه / بررسی نهایی", path: "/maintenance/final-qa" },
  ] },
  { id: "about_us", icon: <UserCircleIcon />, name: "زموږ په اړه / درباره ما", path: "/about" },
];

// ---- Other Roles: Standard operational navigation ----
const getStandardNavItems = (): NavItem[] => [
  { id: "dashboard", icon: <GridIcon />, name: "عمومي پاڼه / صفحه اصلی", path: "/dashboard" },
  { id: "inventory", icon: <BoxCubeIcon />, name: "موجودي / موجودی", subItems: [
    { name: "د موجودۍ عمومي پاڼه / داشبورد موجودی", path: "/inventory", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON, ROLES.WAREHOUSE_DIRECTOR] },
    { name: "د اجناسو لیست / لیست موجودی", path: "/inventory/items", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON, ROLES.WAREHOUSE_DIRECTOR] },
    { name: "جنس اضافه کول / اضافه کردن جنس", path: "/inventory/add", roles: [ROLES.ADMIN] },
    { name: "د ګدام داخل / ورود به انبار", path: "/inventory/stock-in", roles: [ROLES.ADMIN, ROLES.WAREHOUSE_ENTRY_PERSON] },
    { name: "د ګدام خارج / خروج از انبار", path: "/inventory/stock-out", roles: [ROLES.ADMIN] },
    { name: "د راکړې ورکړې ثبت / ثبت معاملات", path: "/inventory/ledger", roles: [ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR] },
    { name: "د بارکوډ سکین / اسکن بارکد", path: "/inventory/barcode-scanner", roles: [ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR] },
  ] },
  { id: "receiving", icon: <ListIcon />, name: "ترلاسه کول / تحویل‌گیری", subItems: [
    { name: "د رسید او ف، س، ۵ غوښتنې / مدیریت تحویل", path: "/receiving", roles: [ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR] },
  ] },
  { id: "procurement", icon: <TableIcon />, name: "تدارکات / تدارکات", subItems: [
    { name: "تدارکاتي غوښتنې / درخواست‌های تدارکاتی", path: "/procurement", roles: [ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR] },
  ] },
  { id: "requests", icon: <PageIcon />, name: "غوښتنې / درخواست‌ها", subItems: [
    { name: "د غوښتنو لیست / لیست درخواست‌ها", path: "/requests", roles: [ROLES.REQUESTER, ROLES.ADMIN, ROLES.REQUEST_CONFIRMER] },
    { name: "نوې غوښتنه / درخواست جدید", path: "/requests/create", roles: [ROLES.REQUESTER] },
  ] },
  { id: "forms", icon: <PageIcon />, name: "فورمونه / فرم‌ها", path: "/official-forms" },
  { id: "notifications", icon: <UserCircleIcon />, name: "خبرتیاوې / اعلانات", path: "/notifications" },
  { id: "reports", icon: <PieChartIcon />, name: "راپورونه / گزارش‌ها", subItems: [
    { name: "د راپورونو عمومي پاڼه / داشبورد گزارش", path: "/reports", roles: [ROLES.ADMIN, ROLES.PROCUREMENT_DIRECTOR, ROLES.WAREHOUSE_DIRECTOR] },
    { name: "د موجودۍ راپور / گزارش موجودی", path: "/reports/inventory", roles: [ROLES.ADMIN, ROLES.WAREHOUSE_DIRECTOR] },
    { name: "د غوښتنو راپور / گزارش درخواست‌ها", path: "/reports/requests", roles: [ROLES.ADMIN] },
    { name: "د تدارکاتو راپور / گزارش تدارکات", path: "/reports/procurement", roles: [ROLES.PROCUREMENT_DIRECTOR] },
    { name: "کلنۍ اړتیاوې / نیازمندی‌های سالانه", path: "/reports/needs", roles: [ROLES.ADMIN] },
    { name: "وړاندوینه / پیش‌بینی", path: "/reports/forecast", roles: [ROLES.ADMIN] },
  ] },
  { id: "traceability", icon: <ListIcon />, name: "تعقیب د اجناسو / ردیابی اجناس", path: "/traceability" },
  { id: "about_us", icon: <UserCircleIcon />, name: "زموږ په اړه / درباره ما", path: "/about" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { profile } = useAuth();
  const { splitPick, lang } = useLanguage();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isSuperAdmin = profile?.role === ROLES.SUPER_ADMIN;

  const isActive = useCallback(
    (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path)),
    [location.pathname]
  );

  const mainNavItems: NavItem[] = isSuperAdmin
    ? getSuperAdminNavItems()
    : getStandardNavItems().filter((item) => canAccessMenu(profile?.role, item.id));

  useEffect(() => {
    mainNavItems.forEach((nav, index) => {
      nav.subItems?.forEach((subItem) => {
        if (location.pathname === subItem.path) setOpenSubmenu({ type: "main", index });
      });
    });
  }, [location.pathname, lang]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      setSubMenuHeight((prev) => ({ ...prev, [key]: subMenuRefs.current[key]?.scrollHeight || 0 }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: string) => {
    setOpenSubmenu((prev) => (prev?.type === menuType && prev.index === index ? null : { type: menuType, index }));
  };

  const isOpen = (menuType: string, index: number) =>
    openSubmenu?.type === menuType && openSubmenu?.index === index;

  const renderMenuItems = (items: NavItem[], menuType: string) => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => (
        <li key={nav.id}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`relative flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}
                ${isOpen(menuType, index)
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              <span className={`shrink-0 [&_svg]:size-5 ${isOpen(menuType, index) ? "text-white" : "text-white/50 group-hover:text-white"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="flex-1 text-right">{splitPick(nav.name)}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`mr-auto h-4 w-4 transition-transform duration-200 ${isOpen(menuType, index) ? "rotate-180 text-white" : "text-white/40"}`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`relative flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive(nav.path)
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                <span className={`shrink-0 [&_svg]:size-5 ${isActive(nav.path) ? "text-white" : "text-white/50"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="flex-1 text-right">{splitPick(nav.name)}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{ height: isOpen(menuType, index) ? `${subMenuHeight[`${menuType}-${index}`]}px` : "0px" }}
            >
              <ul className="mt-1 space-y-0.5 mr-9">
                {(isSuperAdmin
                  ? nav.subItems
                  : nav.subItems.filter((sub) => !sub.roles || (profile && sub.roles.includes(profile.role)))
                ).map((subItem) => (
                  <li key={subItem.name + subItem.path}>
                    <Link
                      to={subItem.path}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
                        ${isActive(subItem.path)
                          ? "bg-white/20 text-white font-semibold"
                          : "text-white/60 hover:bg-white/10 hover:text-white font-medium"}`}
                    >
                      {splitPick(subItem.name)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const brandName = splitPick("د کندهار پوهنتون / پوهنتون کندهار");
  const brandSub = splitPick("ګدام او تدارکات / انبار و تدارکات");
  const menuLabel = isSuperAdmin
    ? splitPick("د نظارت مینو / منوی نظارتی")
    : splitPick("اصلي مینو / منوی اصلی");

  return (
    <aside
      dir="rtl"
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 right-0 bg-brand-950 text-white h-screen transition-all duration-300 ease-in-out z-50 border-l border-brand-900
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-5 flex border-b border-white/10 mb-4 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to={isSuperAdmin ? "/superadmin" : "/dashboard"} className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 p-1 overflow-hidden">
            <img src={kuLogo} alt="KU" className="h-full w-full object-contain rounded-full" />
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="block text-sm font-bold leading-5 text-white text-right">
              {brandName}
              <br />
              <span className="text-xs font-medium text-white/50">{brandSub}</span>
            </span>
          )}
        </Link>
      </div>

      {/* Super Admin badge */}
      {isSuperAdmin && (isExpanded || isHovered || isMobileOpen) && (
        <div className="mb-3 mx-1 rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 text-center">
          <span className="text-xs font-semibold text-white/80">
            🔐 {splitPick("سوپر اډمین — نظارت / سوپر ادمین — نظارت")}
          </span>
        </div>
      )}

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear custom-scrollbar [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        <nav className="mb-6">
          <h2
            className={`mb-3 flex text-xs leading-[20px] text-white/30 uppercase tracking-wider ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
          >
            {isExpanded || isHovered || isMobileOpen ? menuLabel : <HorizontaLDots className="size-5 text-white/30" />}
          </h2>
          {renderMenuItems(mainNavItems, "main")}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
