import React from "react";
import { PipelineRecord } from "../../firebase/requests";

interface PipelineTimelineProps {
  history: PipelineRecord[];
}

const PipelineTimeline: React.FC<PipelineTimelineProps> = ({ history }) => {
  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {history.map((record, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== history.length - 1 ? (
                <span className="absolute top-4 right-4 -mr-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3 space-x-reverse">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900 ${
                    record.status.includes('Rejected') ? 'bg-red-500' : 'bg-green-500'
                  }`}>
                    {record.status.includes('Rejected') ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5 space-x-reverse text-right">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white/90">{record.stage}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{record.actionByName} ({record.actionByRole})</p>
                    {record.comment && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-gray-800 italic">
                        "{record.comment}"
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-left text-xs text-gray-500">
                    <time dateTime={new Date(record.createdAt).toISOString()}>{record.createdAtHijriShamsi}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {history.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">تر اوسه هیڅ تاریخچه نشته.</p>
      )}
    </div>
  );
};

export default PipelineTimeline;
