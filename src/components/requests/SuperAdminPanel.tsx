import React, { useState } from "react";
import Label from "../form/Label";
import { updateRequestStage } from "../../firebase/requests";
import { useLanguage } from "../../context/LanguageContext";

interface SuperAdminPanelProps {
  requestId: string;
  currentStatus?: string;
  user: { uid: string, name: string, role: string };
  onUpdate: () => void;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ requestId, currentStatus, user, onUpdate }) => {
  const [comment, setComment] = useState("");
  const [nextLayerNote, setNextLayerNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCorrectMode, setShowCorrectMode] = useState(false);
  const { pick } = useLanguage();

  const isDeliveryMode = currentStatus === 'DeliveryConfirmedByRequestConfirmer' || currentStatus === 'DeliveryReturnedToSuperAdmin';

  const handleAction = async (action: 'approve' | 'reject' | 'returnToConfirmer' | 'correctWithNote' | 'deliveryApprove' | 'deliveryReject' | 'deliveryReturn') => {
    if ((action === 'reject' || action === 'returnToConfirmer' || action === 'deliveryReject' || action === 'deliveryReturn') && !comment.trim()) {
      alert("مهرباني وکړئ ملاحظه ولیکئ. / لطفاً نظر بنویسید.");
      return;
    }
    if (action === 'correctWithNote' && !nextLayerNote.trim()) {
      alert("مهرباني وکړئ د اډمین لپاره یادښت ولیکئ. / لطفاً یادداشت برای ادمین بنویسید.");
      return;
    }
    setLoading(true);
    try {
      let status = "";
      let progress = 0;
      let stage = "";
      let finalComment = comment.trim();

      if (action === 'approve') {
        status   = 'ApprovedBySuperAdmin';
        progress = 10;
        stage    = 'د مقام تایید / تایید مقام';
      } else if (action === 'correctWithNote') {
        status   = 'ApprovedBySuperAdmin';
        progress = 10;
        stage    = 'د مقام تایید — د اډمین لپاره یادښت / تایید مقام با یادداشت';
        finalComment = `[د اډمین لپاره یادښت / یادداشت برای ادمین]: ${nextLayerNote.trim()}`;
      } else if (action === 'returnToConfirmer') {
        status   = 'ReturnedToConfirmer';
        progress = 2;
        stage    = 'د مقام لخوا تایید کوونکي ته راستانه شوه / توسط مقام به تأییدکننده بازگردانده شد';
      } else if (action === 'deliveryApprove') {
        status   = 'DeliveryApprovedBySuperAdmin';
        progress = 88;
        stage    = 'د تسلیمۍ فورمونه د مقام لخوا منظور شول / فرم‌های تحویلی توسط مقام منظور شد';
      } else if (action === 'deliveryReject') {
        status   = 'DeliveryRejectedBySuperAdmin';
        progress = 82;
        stage    = 'د تسلیمۍ فورمونه د مقام لخوا رد شول / فرم‌های تحویلی توسط مقام رد شد';
      } else if (action === 'deliveryReturn') {
        status   = 'DeliveryReturnedToConfirmer';
        progress = 84;
        stage    = 'د مقام لخوا تایید کوونکي ته د تسلیمۍ فورمونه بیرته راستانه شول / فرم‌های تحویلی توسط مقام به تاییدکننده بازگردانده شد';
      } else {
        status   = 'RejectedBySuperAdmin';
        progress = 0;
        stage    = 'د مقام لخوا رد / رد مقام';
      }

      await updateRequestStage(requestId, status, progress, stage, user, finalComment);
      onUpdate();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm border-t-4 border-t-primary">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">
        {isDeliveryMode ? pick("د تسلیمۍ فورمونه — مقام / لوی مدیر", "فرم‌های تحویلی — مقام") : "د مقام تایید / پنل مقام"}
      </h3>

      <div className="space-y-4">
        {isDeliveryMode ? (
          <>
            <div>
              <Label>{pick("ملاحظه (د بیرته راګرځولو او ردولو لپاره اړین):", "ملاحظه (برای بازگشت و رد الزامی است):")}</Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
                rows={2}
                placeholder={pick("خپل نظر دلته ولیکئ...", "نظر خود را اینجا بنویسید...")}
              />
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('deliveryApprove')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "✔ منظور د تسلیمۍ فورمونه / منظور فرم‌های تحویلی"}
                </button>
                <button
                  onClick={() => handleAction('deliveryReject')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "✗ رد د تسلیمۍ فورمونه / رد فرم‌های تحویلی"}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('deliveryReturn')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "↩ بیرته تایید کوونکي ته / بازگشت به تأییدکننده"}
                </button>
              </div>
            </div>
          </>
        ) : showCorrectMode ? (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-green-800 dark:text-green-200">
              ✅ صحیح دی — د اډمین لپاره یادښت ولیکئ
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              دا یادښت به له غوښتنې سره یوځای اډمین ته ولاړ سي چي اډمین یې وویني. / این یادداشت همراه درخواست به ادمین می‌رود.
            </p>
            <textarea
              value={nextLayerNote}
              onChange={e => setNextLayerNote(e.target.value)}
              className="w-full rounded-lg border border-green-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-500 dark:border-green-700 dark:bg-gray-900 dark:text-white/90 text-right"
              rows={3}
              placeholder="د اډمین لپاره یادښت دلته ولیکئ..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("correctWithNote")}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? "بارول..." : "✅ واستوئ — اډمین ته"}
              </button>
              <button
                onClick={() => { setShowCorrectMode(false); setNextLayerNote(""); }}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition text-sm"
              >
                لغوه
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <Label>ملاحظه / احکام (د رد او بیرته راستلو لپاره لازمي دي):</Label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
                rows={3}
                placeholder="د مقام حکم یا ملاحظه دلته ولیکئ..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "✔ منظورول / منظور"}
                </button>
                <button
                  onClick={() => setShowCorrectMode(true)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                >
                  ✅ صحیح دی
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('returnToConfirmer')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "↩ بیرته راګرځول"}
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? "بارول..." : "✗ ردول / رد"}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-right dark:text-gray-400">
                • منظورول: فوري اډمین ته | • صحیح دی: د اډمین لپاره یادښت سره | • بیرته راګرځول: تایید کوونکي ته ملاحظه سره | • ردول: دایمي رد
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;
