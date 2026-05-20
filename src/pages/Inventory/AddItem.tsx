import React, { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Breadcrumb from "../../components/common/Breadcrumb";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { createItem } from "../../firebase/inventory";
import { useAuth } from "../../context/AuthContext";

export default function AddItem() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    typeOrSpecification: "",
    unit: "",
    initialQuantity: 0,
    minimumStockLevel: 0,
    unitPrice: 0,
    supplierOrSource: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: (name === 'minimumStockLevel' || name === 'unitPrice' || name === 'initialQuantity') ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!formData.name || !formData.category || !formData.unit) {
      alert("مهرباني وکړئ ټول اړین معلومات دننه کړئ. / لطفا تمام معلومات ضروری را وارد کنید.");
      return;
    }

    if (formData.initialQuantity < 0 || formData.minimumStockLevel < 0 || formData.unitPrice < 0) {
      alert("مقدار نه شي کولی منفي وي. / مقدار نمیتواند منفی باشد.");
      return;
    }
    
    setLoading(true);
    try {
      await createItem(formData as any, user.uid, profile.name, profile.role);
      navigate("/inventory/items");
    } catch (error) {
      console.error("Error creating item:", error);
      alert("خطا د جنس په ثبتولو کې: / خطا در ثبت جنس: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="نوی جنس اضافه کول | Kandahar University WMS" description="ګودام ته د نوي جنس زیاتول" />
      <Breadcrumb pageTitle="نوی جنس اضافه کول / اضافه کردن جنس جدید" />

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>د جنس نوم / نام جنس <span className="text-error-500">*</span></Label>
              <Input name="name" value={formData.name} onChange={handleChange} required placeholder="مثلاً: قلم، لپټاپ" />
            </div>
            <div>
              <Label>کټګوري / کتګوری <span className="text-error-500">*</span></Label>
              <Input name="category" value={formData.category} onChange={handleChange} required placeholder="مثلاً: قرطاسیه، برښنايي وسایل" />
            </div>
            <div>
              <Label>واحد / واحد <span className="text-error-500">*</span></Label>
              <Input name="unit" value={formData.unit} onChange={handleChange} required placeholder="مثلاً: دانه، کارتن، کیلو" />
            </div>
            <div>
              <Label>مقدار / مقدار (Initial Quantity) <span className="text-error-500">*</span></Label>
              <Input type="number" name="initialQuantity" value={formData.initialQuantity} onChange={handleChange} min="0" required />
            </div>
            <div>
              <Label>کم حد / حداقل موجودی (Minimum Stock)</Label>
              <Input type="number" name="minimumStockLevel" value={formData.minimumStockLevel} onChange={handleChange} min="0" />
            </div>
            <div>
              <Label>واحد قیمت / قیمت واحد</Label>
              <Input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} min="0" />
            </div>
            <div className="md:col-span-2">
              <Label>تهیه کوونکی / منبع یا تهیه کننده (Supplier)</Label>
              <Input name="supplierOrSource" value={formData.supplierOrSource} onChange={handleChange} placeholder="مثلاً: محلي بازار، مرکزی ذخیره" />
            </div>
          </div>
          
          <div>
            <Label>مشخصات / مشخصات (Specifications)</Label>
            <Input name="typeOrSpecification" value={formData.typeOrSpecification} onChange={handleChange} placeholder="ماډل، رنګ، اندازه، وغیره" />
          </div>

          <div>
            <Label>توضیحات / توضیحات</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-gray-800 outline-none transition focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/inventory/items")}>لغوه کول</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "ثبتېږي..." : "ثبتول"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
