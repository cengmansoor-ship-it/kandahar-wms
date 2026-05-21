import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { getItemById, performStockTransaction, WarehouseItem, getItems } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";

export default function StockOut() {
  const { id } = useParams();
  const [item, setItem] = useState<WarehouseItem | null>(null);
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchItem(id);
    } else {
      fetchAllItems();
    }
  }, [id]);

  const fetchItem = async (itemId: string) => {
    setFetching(true);
    try {
      const data = await getItemById(itemId);
      setItem(data ?? null);
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setFetching(false);
    }
  };

  const fetchAllItems = async () => {
    setFetching(true);
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !profile) return;

    if (item && quantity > item.currentQuantity) {
      alert("خطا: له موجودۍ زیات مقدار نه شئ ایستلی. / خطا: از موجودی بیشتر نمیتوانید خارج کنید.");
      return;
    }
    
    setLoading(true);
    try {
      await performStockTransaction(id, 'OUT', quantity, reason, {
        uid: user.uid,
        name: profile.name,
        role: profile.role
      });
      navigate("/inventory/items");
    } catch (error: any) {
      alert("خطا: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center text-gray-500">بارول...</div>;

  // Case: No ID provided - Show selection list
  if (!id) {
    return (
      <>
        <PageMeta title="د ایستلو لپاره جنس انتخاب کړئ | Kandahar University WMS" description="د ایستلو لپاره جنس انتخاب کړئ" />
        <Breadcrumb pageTitle="د جنس انتخاب / انتخاب جنس" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">د ایستلو لپاره یو جنس انتخاب کړئ:</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(i => (
              <Link 
                key={i.id} 
                to={`/inventory/stock-out/${i.id}`}
                className="flex flex-col p-4 border rounded-xl hover:border-primary transition-colors dark:border-gray-700 disabled:opacity-50"
              >
                <span className="font-bold text-gray-800 dark:text-white/90 text-right">{i.name}</span>
                <span className={`text-sm text-right ${i.currentQuantity === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  موجودي: {i.currentQuantity} {i.unit}
                </span>
              </Link>
            ))}
          </div>
          {items.length === 0 && <p className="text-center text-gray-500">هیڅ جنس نشته.</p>}
        </div>
      </>
    );
  }

  if (!item) return <div className="p-10 text-center text-red-500">جنس ونه موندل شو. / جنس پیدا نشد.</div>;

  return (
    <>
      <PageMeta title="د جنس ایستل | Kandahar University WMS" description="له ګودام څخه د جنس ایستل" />
      <Breadcrumb pageTitle="د جنس ایستل / خروج جنس از ګدام" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] max-w-2xl mx-auto">
        <div className="mb-6 border-b pb-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 text-right">{item.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-right">اوسنۍ موجودي: <span className="font-bold">{item.currentQuantity} {item.unit}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>ایستل کېدونکی مقدار / مقدار خروجی <span className="text-error-500">*</span></Label>
            <Input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              min="1" 
              max={item.currentQuantity}
              required 
            />
          </div>
          
          <div>
            <Label>د ایستلو علت / دلیل خروج <span className="text-error-500">*</span></Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
              rows={3}
              placeholder="مثلاً: د کمپیوټر ساینس پوهنځي ته ورکړل شو"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
            <Button type="submit" variant="primary" disabled={loading || item.currentQuantity === 0}>
              {loading ? "ثبتېږي..." : "ایستل"}
            </Button>
          </div>
          {item.currentQuantity === 0 && (
            <p className="text-sm text-error-500 mt-2 text-center">په ګودام کې موجودي نشته. / موجودی در ګدام وجود ندارد.</p>
          )}
        </form>
      </div>
    </>
  );
}
