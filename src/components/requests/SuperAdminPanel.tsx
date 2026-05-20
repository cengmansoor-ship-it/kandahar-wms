import React, { useState } from "react";
import Label from "../form/Label";
import { updateRequestStage } from "../../firebase/requests";

interface SuperAdminPanelProps {
  requestId: string;
  user: { uid: string, name: string, role: string };
  onUpdate: () => void;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ requestId, user, onUpdate }) => {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const status = action === 'approve' ? 'ApprovedBySuperAdmin' : 'RejectedBySuperAdmin';
      const progress = action === 'approve' ? 10 : 0;
      const stage = action === 'approve' ? 'د مقام تایید / تایید مقام' : 'د مقام لخوا رد / رد مقام';
      
      await updateRequestStage(requestId, status, progress, stage, user, comment);
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
        د مقام تایید / پنل مقام
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label>توضیحات / احکام:</Label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-gray-700 dark:text-white/90 text-right"
            rows={3}
            placeholder="د مقام حکم یا ملاحظه دلته ولیکئ..."
          ></textarea>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleAction('approve')}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "بارول..." : "منظورول / منظور"}
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

export default SuperAdminPanel;
