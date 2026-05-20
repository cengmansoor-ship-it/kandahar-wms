import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getItems, WarehouseItem } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

export default function ItemList() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  const canEdit = profile?.role === ROLES.SUPER_ADMIN || profile?.role === ROLES.ADMIN;
  const canStockIn = canEdit || profile?.role === ROLES.WAREHOUSE_ENTRY_PERSON;
  const canStockOut = canEdit || profile?.role === ROLES.WAREHOUSE_DIRECTOR;

  const filterParam = searchParams.get("filter");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let list = items;

    if (filterParam === "low") {
      list = list.filter(i => i.currentQuantity > 0 && i.currentQuantity <= i.minimumStockLevel);
    } else if (filterParam === "out") {
      list = list.filter(i => i.currentQuantity === 0);
    }

    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(item =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.unit || "").toLowerCase().includes(q) ||
      (item.typeOrSpecification || "").toLowerCase().includes(q) ||
      (item.supplierOrSource || "").toLowerCase().includes(q) ||
      String(item.currentQuantity).includes(q)
    );
  }, [items, search, filterParam]);

  const filterLabel = filterParam === "low" ? "کمه موجودي" : filterParam === "out" ? "ختم شوي اجناس" : null;

  return (
    <>
      <PageMeta
        title="د اجناسو لیست | Kandahar University WMS"
        description="د موجودي اجناسو لیست"
      />
      <Breadcrumb pageTitle="د موجودۍ لیست / لیست موجودی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {filterLabel ? `${filterLabel} / ټول اجناس` : "ټول اجناس / تمام اجناس"}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {filterParam && (
              <Link to="/inventory/items" className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition">
                ✕ فلتر لرې کول
              </Link>
            )}
            {canEdit && (
              <Link
                to="/inventory/add"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
              >
                <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8.75 3.75C8.75 3.33579 8.41421 3 8 3C7.58579 3 7.25 3.33579 7.25 3.75V7.25H3.75C3.33579 7.25 3 7.58579 3 8C3 8.41421 3.33579 8.75 3.75 8.75H7.25V12.25C7.25 12.6642 7.58579 13 8 13C8.41421 13 8.75 12.6642 8.75 12.25V8.75H12.25C12.6642 8.75 13 8.41421 13 8C13 7.58579 12.6642 7.25 12.25 7.25H8.75V3.75Z" fill="" />
                </svg>
                جنس اضافه کول
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="لټون... (نوم، کټګوري، واحد)"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pr-10 pl-4 text-sm text-right text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              dir="rtl"
            />
          </div>
          {search && (
            <p className="mt-1 text-xs text-gray-400 text-right">
              {filteredItems.length} پایله / نتیجه
            </p>
          )}
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-gray-800">
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">د جنس نوم</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">کټګوري</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">نوعیت</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">موجودي</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">واحد</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">کمترینه کچه</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">بارول...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    {search ? `"${search}" لپاره هیڅ جنس ونه موندل شو.` : "هیڅ جنس ونه موندل شو."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 text-gray-800 dark:text-white/90 text-right font-medium">{item.name}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.category || "-"}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right text-xs">{item.typeOrSpecification || "-"}</td>
                    <td className="px-4 py-4 text-right font-bold">
                      <span className={
                        item.currentQuantity === 0
                          ? "text-red-500"
                          : item.currentQuantity <= item.minimumStockLevel
                          ? "text-orange-500"
                          : "text-green-600"
                      }>
                        {item.currentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.unit}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.minimumStockLevel}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        {canStockIn && (
                          <Link to={`/inventory/stock-in/${item.id}`} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition">داخلول</Link>
                        )}
                        {canStockOut && (
                          <Link to={`/inventory/stock-out/${item.id}`} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition">ایستل</Link>
                        )}
                        <Link to={`/inventory/ledger?item=${item.id}`} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 transition">لیجر</Link>
                        {canEdit && (
                          <Link to={`/inventory/edit/${item.id}`} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 transition">سمون</Link>
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
    </>
  );
}
