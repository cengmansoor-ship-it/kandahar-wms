import { useState } from "react";
import Label from "../form/Label";
import { updateRequestStage, changeRequestLevel } from "../../firebase/requests";
import { useLanguage } from "../../context/LanguageContext";

interface ConfirmerPanelProps {
  requestId: string;
  currentStatus: string;
  currentLevel: string;
  user: { uid: string; name: string; role: string };
  onUpdate: () => void;
  superAdminComment?: string;
}

const REQUEST_LEVELS = [
  { ps: "ډېر عاجل", dr: "بسیار عاجل" },
  { ps: "ډېر مهم", dr: "بسیار مهم" },
  { ps: "متوسط", dr: "متوسط" },
  { ps: "عادي", dr: "عادی" },
  { ps: "لږ مهم", dr: "کماهمیت" },
];

const ConfirmerPanel: React.FC<ConfirmerPanelProps> = ({
  requestId, currentStatus, currentLevel, user, onUpdate, superAdminComment
}) => {
  const [comment, setComment] = useState("");
  const [nextLayerNote, setNextLayerNote] = useState("");
  const [newLevel, setNewLevel] = useState(currentLevel);
  const [loading, setLoading] = useState(false);
  const [showCorrectMode, setShowCorrectMode] = useState(false);
  const { pick } = useLanguage();

  const isPendingReview      = currentStatus === "PendingReview";
  const isSubmitted          = currentStatus === "Submitted";
  const isReturnedToConfirmer = currentStatus === "ReturnedToConfirmer";

  const handleAction = async (
    action: "approveReview" | "returnReview" | "confirm" | "reject" | "returnToRequester" | "correctWithNote"
  ) => {
    if ((action === "returnReview" || action === "reject" || action === "returnToRequester") && !comment.trim()) {
      alert(pick("مهرباني وکړئ خپله ملاحظه ولیکئ.", "لطفاً نظر خود را بنویسید."));
      return;
    }
    if (action === "correctWithNote" && !nextLayerNote.trim()) {
      alert(pick("مهرباني وکړئ د مقام لپاره یادښت ولیکئ.", "لطفاً یادداشت برای مقام بنویسید."));
      return;
    }
    setLoading(true);
    try {
      if (newLevel !== currentLevel) {
        await changeRequestLevel(requestId, newLevel, currentLevel, user, pick("درجه بدلون", "تغییر درجه"));
      }

      let status = "";
      let progress = 0;
      let stage = "";
      let finalComment = comment.trim();

      if (action === "approveReview") {
        status   = "Submitted";
        progress = 0;
        stage    = pick("بیاکتنه تاییده شوه — رسمي واستول شوه", "پیش‌بررسی تأیید شد — ارسال رسمی شد");
      } else if (action === "returnReview") {
        status   = "ReviewReturned";
        progress = 0;
        stage    = pick("بیرته د سمولو لپاره راستانه شوه", "برای اصلاح بازگردانده شد");
      } else if (action === "returnToRequester") {
        status   = "ReviewReturned";
        progress = 0;
        stage    = pick("تایید کوونکي لخوا غوښتونکي ته بیرته راستانه شوه", "توسط تأییدکننده به درخواست‌دهنده بازگردانده شد");
      } else if (action === "correctWithNote") {
        status   = "ConfirmedByRequestConfirmer";
        progress = 5;
        stage    = pick("تایید کوونکي لخوا تایید شوه — د مقام لپاره یادښت", "توسط تأییدکننده تأیید شد — یادداشت برای مقام");
        finalComment = `[د مقام لپاره یادښت / یادداشت برای مقام]: ${nextLayerNote.trim()}`;
      } else if (action === "confirm") {
        status   = "ConfirmedByRequestConfirmer";
        progress = 5;
        stage    = pick("تاییدوونکي لخوا تایید شوه", "توسط تأییدکننده تأیید شد");
      } else {
        status   = "RejectedByRequestConfirmer";
        progress = 0;
        stage    = pick("تاییدوونکي لخوا رد شوه", "توسط تأییدکننده رد شد");
      }

      await updateRequestStage(requestId, status, progress, stage, user, finalComment);
      onUpdate();
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">

      {/* Pre-review mode banner */}
      {isPendingReview && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/40 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🔍</span>
            <div>
              <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                {pick("د لومړني بیاکتنې حالت", "حالت پیش‌بررسی")}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {pick(
                  "دا غوښتنه د لومړني بیاکتنې لپاره راستانه شوه. که سم وه نو منظور کړئ چي رسمي واستول سي. که کومه ملاحظه وي نو ورته ولیکئ او بیرته یې راستانه کړئ.",
                  "این درخواست برای پیش‌بررسی ارسال شده است. اگر درست است تأیید کنید تا رسماً ارسال شود. اگر نظری دارید بنویسید و بازگردانید."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Returned from SuperAdmin banner */}
      {isReturnedToConfirmer && superAdminComment && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">↩️</span>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                {pick("د مقام لخوا ستاسو ته راستانه شوه", "توسط مقام به شما بازگردانده شد")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
                {pick("د مقام ملاحظه:", "نظر مقام:")} {superAdminComment}
              </p>
            </div>
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">
        {isPendingReview
          ? pick("پینل بیاکتنه / لومړنۍ بررسي", "پنل پیش‌بررسی")
          : isReturnedToConfirmer
            ? pick("د مقام ملاحظه — بیا واستوئ", "نظر مقام — دوباره ارسال کنید")
            : pick("د تایید کوونکي عمل", "پنل تأییدکننده")}
      </h3>

      <div className="space-y-4">
        <div>
          <Label>{pick("د غوښتنې درجه بدلون (اختیاري):", "تغییر درجه درخواست (اختیاری):")}</Label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            value={newLevel}
            onChange={e => setNewLevel(e.target.value)}
          >
            {REQUEST_LEVELS.map(l => (
              <option key={l.ps} value={l.ps}>{l.ps} / {l.dr}</option>
            ))}
          </select>
        </div>

        {/* Normal comment field (for return/reject) */}
        {!showCorrectMode && (
          <div>
            <Label>
              {isPendingReview
                ? pick("ملاحظه (که بیرته راستانه کوئ نو لازمي دي):", "نظر (در صورت بازگشت الزامی است):")
                : pick("ملاحظه / توضیحات:", "ملاحظه / توضیحات:")}
            </Label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
              rows={3}
              placeholder={
                isPendingReview
                  ? pick("ستاسو ملاحظات دلته ولیکئ...", "نظرات خود را اینجا بنویسید...")
                  : pick("خپل نظر دلته ولیکئ...", "نظر خود را اینجا بنویسید...")
              }
            />
          </div>
        )}

        {/* صحیح دی mode - note for next layer */}
        {showCorrectMode && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-green-800 dark:text-green-200">
              {pick("✅ صحیح دی — د مقام لپاره یادښت ولیکئ", "✅ درست است — یادداشت برای مقام بنویسید")}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {pick(
                "دا یادښت به له غوښتنې سره یوځای مقام ته ولاړ سي چي مقام یې وویني.",
                "این یادداشت همراه درخواست به مقام می‌رود تا مقام آن را ببیند."
              )}
            </p>
            <textarea
              value={nextLayerNote}
              onChange={e => setNextLayerNote(e.target.value)}
              className="w-full rounded-lg border border-green-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-500 dark:border-green-700 dark:bg-gray-900 dark:text-white/90 text-right"
              rows={3}
              placeholder={pick("د مقام لپاره یادښت دلته ولیکئ...", "یادداشت برای مقام اینجا بنویسید...")}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction("correctWithNote")}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? pick("بارول...", "در حال ارسال...") : pick("✅ واستوئ — مقام ته", "✅ ارسال به مقام")}
              </button>
              <button
                onClick={() => { setShowCorrectMode(false); setNextLayerNote(""); }}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition text-sm"
              >
                {pick("لغوه", "لغو")}
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        {!showCorrectMode && (
          <>
            {isPendingReview ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction("approveReview")}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                >
                  {loading ? pick("بارول...", "در حال بارگذاری...")
                    : pick("✅ منظور — رسمي واستول", "✅ تأیید — ارسال رسمی")}
                </button>
                <button
                  onClick={() => handleAction("returnReview")}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                >
                  {loading ? pick("بارول...", "در حال بارگذاری...")
                    : pick("↩ بیرته سمولو ته", "↩ بازگشت برای اصلاح")}
                </button>
              </div>
            ) : (
              /* Submitted or ReturnedToConfirmer — 4 buttons */
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("confirm")}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
                  >
                    {loading ? pick("بارول...", "بارگذاری...") : pick("✔ تاییدول", "✔ تأیید")}
                  </button>
                  <button
                    onClick={() => setShowCorrectMode(true)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
                  >
                    {pick("✅ صحیح دی", "✅ درست است")}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("returnToRequester")}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition disabled:opacity-50 text-sm"
                  >
                    {loading ? pick("بارول...", "بارگذاری...") : pick("↩ بیرته راګرځول", "↩ بازگشت به درخواست‌دهنده")}
                  </button>
                  <button
                    onClick={() => handleAction("reject")}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm"
                  >
                    {loading ? pick("بارول...", "بارگذاری...") : pick("✗ ردول", "✗ رد")}
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-right dark:text-gray-400">
                  {pick(
                    "• تاییدول: فوري مقام ته | • صحیح دی: د مقام لپاره یادښت سره | • بیرته راګرځول: غوښتونکي ته ملاحظه سره | • ردول: دایمي رد",
                    "• تأیید: مستقیم به مقام | • درست است: با یادداشت به مقام | • بازگشت: به درخواست‌دهنده با نظر | • رد: رد دائمی"
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmerPanel;
