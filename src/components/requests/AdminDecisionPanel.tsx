import React, { useEffect, useState } from "react";
import Label from "../form/Label";
import { updateRequestStage, checkStockAvailability, RequestItem } from "../../firebase/requests";
import { useLanguage } from "../../context/LanguageContext";

interface AdminDecisionPanelProps {
  requestId: string;
  items: RequestItem[];
  currentStatus?: string;
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

const AdminDecisionPanel: React.FC<AdminDecisionPanelProps> = ({ requestId, items, currentStatus, user, onUpdate }) => {
  const [stockInfo, setStockInfo] = useState<{ allAvailable: boolean; results: StockStatus[] } | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { pick } = useLanguage();

  const isDeliveryMode = currentStatus === 'DeliveryApprovedBySuperAdmin';

  useEffect(() => {
    if (!isDeliveryMode) {
      (async () => {
        try {
          const results = await checkStockAvailability(items);
          setStockInfo({ allAvailable: results.every(r => r.isAvailable), results });
        } catch {
          setStockInfo({ allAvailable: true, results: [] });
        }
      })();
    }
  }, [items, isDeliveryMode]);

  const handleDecision = async (decision: 'warehouse' | 'procurement' | 'returnToSuperAdmin' | 'reject' | 'deliveryRouteWarehouse' | 'deliveryReturnToSuperAdmin' | 'deliveryReject') => {
    if ((decision === 'returnToSuperAdmin' || decision === 'reject' || decision === 'deliveryReturnToSuperAdmin' || decision === 'deliveryReject') && !comment.trim()) {
      alert('مهرباني وکړئ خپله ملاحظه ولیکئ. / لطفاً نظر خود را بنویسید.');
      return;
    }
    setLoading(true);
    try {
      let status, progress, stage;
      if (decision === 'warehouse') {
        status = 'StockAvailable'; progress = 20;
        stage = 'ګودام ته راجع شو / ارجاع به ګدام';
      } else if (decision === 'procurement') {
        status = 'StockNotAvailable'; progress = 20;
        stage = 'تدارکاتو ته راجع شو / ارجاع به تدارکات';
      } else if (decision === 'returnToSuperAdmin') {
        status = 'ReturnedToSuperAdmin'; progress = 10;
        stage = 'بیا کتنې ته سوپر اډمین ته راستانه شوه / به سوپر ادمین برگشت داده شد';
      } else if (decision === 'deliveryRouteWarehouse') {
        status = 'DeliveryReferredToWarehouse'; progress = 90;
        stage = 'د تسلیمۍ لپاره ګدام ته راجع شو / برای تحویلی به انبار ارجاع شد';
      } else if (decision === 'deliveryReturnToSuperAdmin') {
        status = 'DeliveryReturnedToSuperAdmin'; progress = 88;
        stage = 'د اډمین لخوا مقام ته د بیاکتنې لپاره راستانه شول / توسط ادمین برای بازبینی به مقام بازگردانده شد';
      } else {
        status = 'RejectedByAdmin'; progress = 0;
        stage = 'د اډمین لخوا رد شوه / توسط ادمین رد شد';
      }
      await updateRequestStage(requestId, status, progress, stage, user, comment);
      onUpdate();
    } catch (error) {
      console.error("Decision failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const shouldWarn = stockInfo && !stockInfo.allAvailable && stockInfo.results.length > 0;

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">
        {isDeliveryMode ? pick("د تسلیمۍ فورمونه — اډمین / پنل ادمین", "فرم‌های تحویلی — ادمین") : "د اډمین پریکړه / پنل ادمین"}
      </h3>
      
      <div className="space-y-6">
        {!isDeliveryMode && stockInfo && stockInfo.results.length > 0 && (
          <div className={`p-4 rounded-xl text-center font-bold border-2 ${
            shouldWarn
              ? 'bg-red-50 text-red-700 border-red-300'
              : 'bg-green-50 text-green-700 border-green-300'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {shouldWarn ? '⚠️' : '✅'}
              <span>
                {shouldWarn
                  ? "ځینې اجناس په ګدام کې نشته! / بعضی اجناس در ګدام موجود نیست!"
                  : "ټول اجناس په ګدام کې موجود دي. / تمام اجناس در ګدام موجود است."}
              </span>
            </div>
            {shouldWarn && (
              <div className="text-xs font-normal mt-1 space-y-1">
                {stockInfo.results.filter(r => !r.isAvailable).map((r, i) => (
                  <p key={i}>⚠ {r.name}: {r.shortage} {r.requested - r.available} کمښت / کمبود</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <Label>{pick("ملاحظه / یادښت (د بیرته راګرځولو او ردولو لپاره اړین):", "ملاحظه (برای بازگشت و رد الزامی است):")}</Label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            rows={2}
            placeholder="خپل نظر دلته ولیکئ..."
          ></textarea>
        </div>

        {isDeliveryMode ? (
          <div className="space-y-3">
            <button
              onClick={() => handleDecision('deliveryRouteWarehouse')}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
            >
              {loading ? 'بارول...' : '✔ ګدام ته راجع کول د تسلیمۍ لپاره / ارجاع به انبار برای تحویلی'}
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('deliveryReturnToSuperAdmin')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '↩ بیرته مقام ته راګرځول'}
              </button>
              <button
                onClick={() => handleDecision('deliveryReject')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '✗ ردول / رد'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('warehouse')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '✔ ګودام ته راجع کول / ارجاع به ګدام'}
              </button>
              <button
                onClick={() => handleDecision('procurement')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '🛒 تدارکاتو ته راجع کول / ارجاع به تدارکات'}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('returnToSuperAdmin')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '↩ بیرته سوپر اډمین ته راګرځول / برگشت به سوپر ادمین'}
              </button>
              <button
                onClick={() => handleDecision('reject')}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? 'بارول...' : '✗ ردول / رد'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDecisionPanel;
