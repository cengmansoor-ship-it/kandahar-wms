import React, { useEffect, useState } from "react";
import Label from "../form/Label";
import { updateRequestStage, checkStockAvailability, RequestItem } from "../../firebase/requests";

interface AdminDecisionPanelProps {
  requestId: string;
  items: RequestItem[];
  user: { uid: string, name: string, role: string };
  onUpdate: () => void;
}

interface StockStatus {
  itemId: string;
  name: string;
  requested: number;
  available: number;
  isAvailable: boolean;
  shortage: number;
}

const AdminDecisionPanel: React.FC<AdminDecisionPanelProps> = ({ requestId, items, user, onUpdate }) => {
  const [stockResults, setStockResults] = useState<StockStatus[]>([]);
  const [checking, setChecking] = useState(true);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performCheck();
  }, [items]);

  const performCheck = async () => {
    setChecking(true);
    const results = await checkStockAvailability(items);
    setStockResults(results);
    setChecking(false);
  };

  const allAvailable = stockResults.every(r => r.isAvailable);

  const handleDecision = async (decision: 'warehouse' | 'procurement') => {
    setLoading(true);
    try {
      const status = decision === 'warehouse' ? 'StockAvailable' : 'StockNotAvailable';
      const progress = 20;
      const stage = decision === 'warehouse' ? 'ګودام ته راجع شو / ارجاع به ګدام' : 'تدارکاتو ته راجع شو / ارجاع به تدارکات';
      
      await updateRequestStage(requestId, status, progress, stage, user, comment);
      onUpdate();
    } catch (error) {
      console.error("Decision failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">
        د اډمین پریکړه / پنل ادمین
      </h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-bold text-gray-500 mb-3">د موجودۍ ارزونه / بررسی موجودی:</h4>
          {checking ? (
            <p className="text-sm text-gray-500 italic">چک کېږي...</p>
          ) : (
            <div className="space-y-2">
              {stockResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <div className="text-sm font-medium text-gray-800 dark:text-white/90">{r.name}</div>
                  <div className="text-xs text-right">
                    <p>غوښتل شوی: <span className="font-bold">{r.requested}</span></p>
                    <p>موجود: <span className={`font-bold ${r.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{r.available}</span></p>
                    {!r.isAvailable && <p className="text-red-500 font-bold">کمښت: {r.shortage}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-4 rounded-xl text-center font-bold ${allAvailable ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
          {allAvailable 
            ? "ټول اجناس په ګودام کې موجود دي. / تمام اجناس در ګدام موجود است." 
            : "ځینې اجناس په ګودام کې نشته. / بعضی اجناس در ګدام موجود نیست."}
        </div>

        <div>
          <Label>توضیحات / یادښت:</Label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            rows={2}
            placeholder="یادښت دلته ولیکئ..."
          ></textarea>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleDecision('warehouse')}
            disabled={loading || !allAvailable}
            className="w-full px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            ګودام ته راجع کول / ارجاع به ګدام
          </button>
          <button
            onClick={() => handleDecision('procurement')}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            تدارکاتو ته راجع کول / ارجاع به تدارکات
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionPanel;
