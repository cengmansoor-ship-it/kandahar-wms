import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { getRequestById, InventoryRequest } from "../../firebase/requests";
import { addVendorOffer } from "../../firebase/procurement";
import { useAuth } from "../../context/AuthContext";

export default function VendorOffersPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<InventoryRequest | null>(null);
  const [formData, setFormData] = useState({
    vendorName: "",
    vendorPhone: "",
    vendorAddress: "",
    deliveryTime: "",
    warrantyOrNotes: "",
    items: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchRequest(id);
  }, [id]);

  const fetchRequest = async (requestId: string) => {
    const data = await getRequestById(requestId);
    if (data) {
      setRequest(data);
      setFormData(prev => ({
        ...prev,
        items: data.items.map(item => ({
          itemId: item.itemId,
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          totalPrice: 0
        }))
      }));
    }
  };

  const handlePriceChange = (index: number, price: number) => {
    const newItems = [...formData.items];
    newItems[index].unitPrice = price;
    newItems[index].totalPrice = price * newItems[index].quantity;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    
    if (!formData.vendorName || formData.items.some(i => i.unitPrice <= 0)) {
      alert("مهرباني وکړئ د شرکت نوم او ټول نرخونه سم ولیکئ.");
      return;
    }

    setLoading(true);
    try {
      await addVendorOffer({
        ...formData,
        requestId: id,
        procurementId: id
      }, { uid: user.uid, name: user.displayName || "Procurement Director" });
      
      alert("نرخ په بریالیتوب سره ثبت شو.");
      navigate(`/procurement/details/${id}`);
    } catch (error) {
      console.error("Error adding offer:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!request) return <div className="p-10 text-center">بارول...</div>;

  return (
    <>
      <PageMeta title="د نرخ ثبتول | Kandahar University WMS" description="د شرکت نرخ ثبتول" />
      <Breadcrumb pageTitle="د نرخ ثبتول / ثبت نرخ فروشنده" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label>د شرکت نوم / نام شرکت <span className="text-error-500">*</span></Label>
              <Input 
                value={formData.vendorName} 
                onChange={(e) => setFormData({...formData, vendorName: e.target.value})} 
                required 
              />
            </div>
            <div>
              <Label>د اړیکې شمیره</Label>
              <Input 
                value={formData.vendorPhone} 
                onChange={(e) => setFormData({...formData, vendorPhone: e.target.value})} 
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-bold text-gray-800 mb-4">د اجناسو نرخونه:</h4>
            <div className="space-y-4">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-xl">
                  <div className="flex-1 min-w-[200px]">
                    <Label>جنس</Label>
                    <div className="font-bold text-sm">{item.itemName} ({item.quantity} {item.unit})</div>
                  </div>
                  <div className="w-32">
                    <Label>واحد قیمت (افغانۍ)</Label>
                    <Input 
                      type="number" 
                      value={item.unitPrice} 
                      onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label>مجموعي قیمت</Label>
                    <div className="px-4 py-2.5 bg-gray-200 rounded-lg text-sm font-bold">{item.totalPrice}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
              <Label>د تسلیمۍ وخت (ورځې)</Label>
              <Input 
                value={formData.deliveryTime} 
                onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})} 
              />
            </div>
            <div>
              <Label>توضیحات یا تضمین</Label>
              <Input 
                value={formData.warrantyOrNotes} 
                onChange={(e) => setFormData({...formData, warrantyOrNotes: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(`/procurement/details/${id}`)}>لغوه کول</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "ثبتېږي..." : "نرخ ثبتول"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
