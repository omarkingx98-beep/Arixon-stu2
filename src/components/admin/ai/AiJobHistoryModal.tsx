import React, { useEffect, useState } from 'react';
import { X, History, Clock, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import type { AiGenerationJob } from '../../../types';
import { fetchAiGenerationJobs } from '../../../lib/adminService';
import { safeFormatDateTime } from '../../../lib/dateUtils';

interface AiJobHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadJob?: (job: AiGenerationJob) => void;
}

export const AiJobHistoryModal: React.FC<AiJobHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadJob,
}) => {
  const [jobs, setJobs] = useState<AiGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchAiGenerationJobs(20)
        .then((data) => setJobs(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0c101c] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              سجل مهام التوليد الذكي السابقة
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-500">جارٍ استرجاع السجل...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              لا توجد مهام توليد سابقة مسجلة في النظام حتى الآن.
            </div>
          ) : (
            jobs.map((j) => (
              <div
                key={j.jobId}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span>{j.subject}</span>
                    <span className="text-slate-400">•</span>
                    <span>{j.lesson}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {safeFormatDateTime(j.createdAt, 'ar-EG')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <span>النمط: {j.mode === 'source_based' ? 'من المصدر' : 'من المنهاج'}</span>
                  <span>العدد: {j.generatedQuestions?.length || 0}</span>
                  <span>المعتمد: {j.approvedCount || 0}</span>
                  <span>المرفوض: {j.rejectedCount || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
