import React, { useState } from 'react';
import type { Exam } from '../types';
import { 
  X, 
  Clock, 
  HelpCircle, 
  Award, 
  AlertTriangle, 
  Play, 
  BookOpen, 
  BarChart2, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

interface ExamDetailsModalProps {
  exam: Exam;
  isOpen: boolean;
  onClose: () => void;
  onStartExam: (exam: Exam) => Promise<void>;
  isLoading?: boolean;
}

export const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({
  exam,
  isOpen,
  onClose,
  onStartExam,
  isLoading = false,
}) => {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    setError(null);
    try {
      await onStartExam(exam);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء بدء الامتحان. يرجى المحاولة مرة أخرى.');
    }
  };

  const difficultyText = 
    exam.difficulty === 'easy' ? 'سهل' :
    exam.difficulty === 'hard' ? 'متقدم' : 'متوسط';

  const difficultyColor = 
    exam.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
    exam.difficulty === 'hard' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        id="exam-details-modal"
        className="w-full max-w-lg bg-white dark:bg-[#111625] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
              {exam.subjectNameAr || exam.subject}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${difficultyColor}`}>
              المستوى: {difficultyText}
            </span>
          </div>

          <button
            id="close-exam-details-btn"
            onClick={onClose}
            disabled={isLoading}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              {exam.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5 mb-3">
              <BookOpen className="w-4 h-4" />
              <span>{exam.lesson}</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {exam.description}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-blue-100/70 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {exam.questionCount}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                سؤال
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {exam.durationMinutes}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                دقيقة
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <div className="w-8 h-8 mx-auto mb-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {exam.totalPoints}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                نقطة
              </div>
            </div>
          </div>

          {/* Exam Instructions */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>إرشادات وتعليمات الاختبار:</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside pr-1 leading-relaxed">
              <li>الأسئلة من نمط الاختيار من متعدد مع إمكانية التعديل قبل التسليم.</li>
              <li>يتم حفظ كل إجابة تختارها فورياً في قاعدة البيانات.</li>
              <li>عند انتهاء المؤقت، يتم تسليم إجاباتك آلياً واحتساب درجتك.</li>
              <li>بعد الانتهاء ستحصل على مراجعة شاملة لجميع الأسئلة مع التعليل العلمي.</li>
            </ul>
          </div>

          {/* Mandatory Critical Warning */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="text-xs sm:text-sm font-medium leading-relaxed">
              <strong>تنبيه هام:</strong> بمجرد بدء الامتحان سيبدأ احتساب الوقت تنازلياً ولا يمكن إيقاف المؤقت أو تجميده عند إغلاق المتصفح.
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
          <button
            id="confirm-start-exam-btn"
            onClick={handleStart}
            disabled={isLoading}
            className="flex-1 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تهيئة الامتحان...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>بدء الامتحان الآن</span>
              </>
            )}
          </button>

          <button
            id="cancel-exam-details-btn"
            onClick={onClose}
            disabled={isLoading}
            className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
