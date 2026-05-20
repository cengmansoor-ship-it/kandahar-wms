import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { getItemById, performStockTransaction, WarehouseItem, getItems } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";

export default function StockIn() {
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
      setItem(data);
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
    
    setLoading(true);
    try {
      await performStockTransaction(id, 'IN', quantity, reason, {
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
        <PageMeta title="د جنس انتخاب | Kandahar University WMS" description="د داخلولو لپاره جنس انتخاب کړئ" />
        <Breadcrumb pageTitle="د جنس انتخاب / انتخاب جنس" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">د داخلولو لپاره یو جنس انتخاب کړئ:</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(i => (
              <Link 
                key={i.id} 
                to={`/inventory/stock-in/${i.id}`}
                className="flex flex-col p-4 border rounded-xl hover:border-primary transition-colors dark:border-gray-700"
              >
                <span className="font-bold text-gray-800 dark:text-white/90 text-right">{i.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-right">موجودي: {i.currentQuantity} {i.unit}</span>
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
      <PageMeta title="د جنس داخلول | Kandahar University WMS" description="ګودام ته د جنس داخلول" />
      <Breadcrumb pageTitle="د جنس داخلول / ورود جنس به ګدام" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] max-w-2xl mx-auto">
        <div className="mb-6 border-b pb-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">{item.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">اوسنۍ موجودي: <span className="font-bold">{item.currentQuantity} {item.unit}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>داخلېدونکی مقدار / مقدار ورودی <span className="text-error-500">*</span></Label>
            <Input 
              type="number" 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))} 
              min="1" 
              required 
            />
          </div>
          
          <div>
            <Label>د داخلېدو علت / دلیل ورود <span className="text-error-500">*</span></Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90"
              rows={3}
              placeholder="مثلاً: د تدارکاتو څخه پیرودل شوی"
              required
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "ثبتېږي..." : "ذخیره کول"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
