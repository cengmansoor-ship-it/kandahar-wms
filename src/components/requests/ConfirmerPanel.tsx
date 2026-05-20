import { useState } from "react";
import Label from "../form/Label";
import { updateRequestStage, changeRequestLevel } from "../../firebase/requests";

interface ConfirmerPanelProps {
  requestId: string;
  currentLevel: string;
  user: { uid: string, name: string, role: string };
  onUpdate: () => void;
}

const REQUEST_LEVELS = [
  { ps: "ډېر عاجل", dr: "بسیار عاجل" },
  { ps: "ډېر مهم", dr: "بسیار مهم" },
  { ps: "متوسط", dr: "متوسط" },
  { ps: "عادي", dr: "عادی" },
  { ps: "لږ مهم", dr: "کماهمیت" },
];

const ConfirmerPanel: React.FC<ConfirmerPanelProps> = ({ requestId, currentLevel, user, onUpdate }) => {
  const [comment, setComment] = useState("");
  const [newLevel, setNewLevel] = useState(currentLevel);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'confirm' | 'reject') => {
    setLoading(true);
    try {
      if (newLevel !== currentLevel) {
        await changeRequestLevel(requestId, newLevel, currentLevel, user, "درجه بدلون");
      }

      const status = action === 'confirm' ? 'ConfirmedByRequestConfirmer' : 'RejectedByRequestConfirmer';
      const progress = action === 'confirm' ? 5 : 0;
      const stage = action === 'confirm' ? 'د غوښتنې تایید کوونکي تایید / تایید تایید کننده درخواست' : 'د غوښتنې تایید کوونکي رد / رد تایید کننده درخواست';
      
      await updateRequestStage(requestId, status, progress, stage, user, comment);
      onUpdate();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white/90 mb-4 border-b pb-2 dark:border-gray-700">
        د تایید کوونکي عمل / پنل تایید کننده
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label>د غوښتنې درجه بدلون (اختیاري):</Label>
          <select 
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
          >
            {REQUEST_LEVELS.map(l => (
              <option key={l.ps} value={l.ps}>{l.ps} / {l.dr}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>توضیحات / نظر:</Label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            rows={3}
            placeholder="خپل نظر دلته ولیکئ..."
          ></textarea>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleAction('confirm')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "بارول..." : "تاییدول / تایید"}
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "بارول..." : "ردول / رد"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmerPanel;
