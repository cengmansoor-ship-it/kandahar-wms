import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { getItems, WarehouseItem } from "../../firebase/inventory";
import { createRequest } from "../../firebase/requests";
import { useAuth } from "../../context/AuthContext";

const REQUEST_LEVELS = [
  { ps: "ډېر عاجل", dr: "بسیار عاجل" },
  { ps: "ډېر مهم", dr: "بسیار مهم" },
  { ps: "متوسط", dr: "متوسط" },
  { ps: "عادي", dr: "عادی" },
  { ps: "لږ مهم", dr: "کماهمیت" },
];

export default function CreateRequest() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ itemId: string, name: string, unit: string, quantity: number }[]>([]);
  const [formData, setFormData] = useState({
    faculty: "",
    departmentOrPerson: "",
    reason: "",
    requestLevel: "عادي"
  });
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const data = await getItems();
    setItems(data);
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { itemId: "", name: "", unit: "", quantity: 1 }]);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const newItems = [...selectedItems];
    newItems[index] = { 
      itemId: item.id, 
      name: item.name, 
      unit: item.unit, 
      quantity: newItems[index].quantity 
    };
    setSelectedItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...selectedItems];
    newItems[index].quantity = quantity;
    setSelectedItems(newItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || selectedItems.length === 0) {
      alert("مهرباني وکړئ لږترلږه یو جنس انتخاب کړئ. / لطفا حداقل یک جنس را انتخاب کنید.");
      return;
    }

    setLoading(true);
    try {
      const requestId = await createRequest({
        ...formData,
        originalRequestLevel: formData.requestLevel,
        items: selectedItems
      }, user.uid, profile.name);
      navigate(`/requests/details/${requestId}`);
    } catch (error) {
      console.error("Error creating request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="نوې غوښتنه | Kandahar University WMS" description="د نوې غوښتنې ثبتول" />
      <Breadcrumb pageTitle="نوې غوښتنه / درخواست جدید" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>پوهنځی / فاکولته <span className="text-error-500">*</span></Label>
              <Input 
                value={formData.faculty} 
                onChange={(e) => setFormData({...formData, faculty: e.target.value})} 
                required 
                placeholder="مثلاً: کمپیوټر ساینس"
              />
            </div>
            <div>
              <Label>څانګه یا کس / شعبه یا شخص <span className="text-error-500">*</span></Label>
              <Input 
                value={formData.departmentOrPerson} 
                onChange={(e) => setFormData({...formData, departmentOrPerson: e.target.value})} 
                required 
                placeholder="مثلاً: تدریسي مدیریت"
              />
            </div>
            <div>
              <Label>د غوښتنې درجه / درجه درخواست <span className="text-error-500">*</span></Label>
              <select 
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
                value={formData.requestLevel}
                onChange={(e) => setFormData({...formData, requestLevel: e.target.value})}
              >
                {REQUEST_LEVELS.map(l => (
                  <option key={l.ps} value={l.ps}>{l.ps} / {l.dr}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>د غوښتنې علت / دلیل درخواست <span className="text-error-500">*</span></Label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
              rows={3}
              required
            ></textarea>
          </div>

          <div className="border-t pt-6 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">غوښتل شوي اجناس / اجناس درخواستی</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>+ جنس زیاتول</Button>
            </div>

            <div className="space-y-4">
              {selectedItems.map((sItem, index) => (
                <div key={index} className="flex flex-wrap gap-4 items-end bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                  <div className="flex-1 min-w-[200px]">
                    <Label>جنس انتخاب کړئ</Label>
                    <select 
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none focus:border-primary dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                      value={sItem.itemId}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      required
                    >
                      <option value="">انتخاب...</option>
                      {items.map(i => (
                        <option key={i.id} value={i.id}>{i.name} ({i.currentQuantity} {i.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <Label>مقدار</Label>
                    <Input 
                      type="number" 
                      value={sItem.quantity} 
                      onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                      min="1"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Label>واحد</Label>
                    <div className="px-4 py-2.5 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm">{sItem.unit || "-"}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                  هیڅ جنس نه دی زیات شوی.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={() => navigate("/requests")}>لغوه کول</Button>
            <Button type="submit" disabled={loading || selectedItems.length === 0}>
              {loading ? "ثبتېږي..." : "غوښتنه ثبتول"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
