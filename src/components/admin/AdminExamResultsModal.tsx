import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { safeFormatDateTime } from '../../lib/dateUtils';
import type { Exam, ExamAttempt } from '../../types';

interface AdminExamResultsModalProps {
  exam: Exam;
  onClose: () => void;
}

export const AdminExamResultsModal: React.FC<AdminExamResultsModalProps> = ({
  exam,
  onClose,
}) => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const colRef = collection(db, 'attempts');
        const q = query(
          colRef,
          where('examId', '==', exam.id),
          where('status', '==', 'submitted'),
          orderBy('submittedAt', 'desc')
        );
        const snap = await getDocs(q);
        const list: ExamAttempt[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExamAttempt, 'id'>) }));
        setAttempts(list);
      } catch (err) {
        console.error('Error fetching exam results:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [exam.id]);

  const exportResultsCsv = () => {
    if (attempts.length === 0) return;
    const header = ['اسم الطالب', 'العلامة', 'المجموع', 'النسبة المئوية', 'النقاط المكتسبة', 'تاريخ التسليم'];
    const rows = attempts.map(a => [
      a.userDisplayName || 'طالب أريكسون',
      a.score || 0,
      a.totalPoints || 100,
      `${a.percentage || 0}%`,
      a.pointsEarned || 0,
      a.submittedAt ? safeFormatDateTime(a.submittedAt, 'ar-EG') : '-',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `نتائج_امتحان_${exam.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0c101c] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              نتائج ومشاركات الطلبة في الامتحان
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {exam.title} ({attempts.length} مشاركة مكتملة)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {attempts.length > 0 && (
              <button
                onClick={exportResultsCsv}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              جارٍ تحميل نتائج الطلبة من قاعدة البيانات...
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                لم يقم أي طالب بتقديم هذا الامتحان بعد.
              </div>
              <p className="text-[11px] text-slate-400">
                بمجرد أن يجيب الطلاب على هذا الامتحان ستظهر كشوف علاماتهم وتفاصيل تسليمهم هنا مباشرة.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {attempts.map((att) => (
                <div key={att.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                      {att.userDisplayName ? att.userDisplayName.charAt(0) : 'S'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {att.userDisplayName || 'طالب مجهول'}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{att.submittedAt ? safeFormatDateTime(att.submittedAt, 'ar-EG') : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-left">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {att.score} / {att.totalPoints}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {att.percentage}% ({att.pointsEarned} نقطة)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
