import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import { getItems, WarehouseItem } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

export default function ItemList() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const canEdit = profile?.role === ROLES.SUPER_ADMIN || profile?.role === ROLES.ADMIN;

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

  return (
    <>
      <PageMeta
        title="د اجناسو لیست | Kandahar University WMS"
        description="د موجودي اجناسو لیست"
      />
      <Breadcrumb pageTitle="د موجودۍ لیست / لیست موجودی" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            ټول اجناس / تمام اجناس
          </h3>
          {canEdit && (
            <Link
              to="/inventory/add"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
            >
              <svg className="fill-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.75 3.75C8.75 3.33579 8.41421 3 8 3C7.58579 3 7.25 3.33579 7.25 3.75V7.25H3.75C3.33579 7.25 3 7.58579 3 8C3 8.41421 3.33579 8.75 3.75 8.75H7.25V12.25C7.25 12.6642 7.58579 13 8 13C8.41421 13 8.75 12.6642 8.75 12.25V8.75H12.25C12.6642 8.75 13 8.41421 13 8C13 7.58579 12.6642 7.25 12.25 7.25H8.75V3.75Z" fill="" />
              </svg>
              جنس اضافه کول
            </Link>
          )}
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-gray-800">
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">د جنس نوم</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">کټګوري</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">موجودي</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">واحد</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">کمترینه کچه</th>
                <th className="px-4 py-4 font-medium text-gray-800 dark:text-white/90 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">بارول...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">هیڅ جنس ونه موندل شو.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.name}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.category}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right font-bold">
                      <span className={item.currentQuantity <= item.minimumStockLevel ? "text-red-500" : "text-green-500"}>
                        {item.currentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.unit}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">{item.minimumStockLevel}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-400 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <Link to={`/inventory/stock-in/${item.id}`} className="text-primary hover:underline">داخلول</Link>
                        <Link to={`/inventory/stock-out/${item.id}`} className="text-error-500 hover:underline">ایستل</Link>
                        {canEdit && <Link to={`/inventory/edit/${item.id}`} className="text-gray-500 hover:underline">سمون</Link>}
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
