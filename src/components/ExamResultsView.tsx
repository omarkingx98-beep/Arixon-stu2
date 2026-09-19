import React, { useState, useEffect } from 'react';
import type { ExamAttempt } from '../types';
import { fetchLeaderboard } from '../lib/firebase';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  FileText, 
  Share2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface ExamResultsViewProps {
  attempt: ExamAttempt;
  userId: string;
  onReviewAnswers: () => void;
  onBackToExams: () => void;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({
  attempt,
  userId,
  onReviewAnswers,
  onBackToExams,
}) => {
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoadingRank, setIsLoadingRank] = useState<boolean>(true);

  // Fetch real rank from leaderboard
  useEffect(() => {
    let isMounted = true;
    async function loadRank() {
      try {
        const entries = await fetchLeaderboard('all');
        if (isMounted) {
          const matchIndex = entries.findIndex(e => e.uid === userId);
          if (matchIndex !== -1) {
            setUserRank(matchIndex + 1);
          } else {
            setUserRank(null);
          }
        }
      } catch (err) {
        console.warn('Could not fetch user rank:', err);
      } finally {
        if (isMounted) setIsLoadingRank(false);
      }
    }
    loadRank();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const score = attempt.score ?? 0;
  const correctCount = attempt.correctAnswers ?? 0;
  const wrongCount = attempt.wrongAnswers ?? 0;
  const unansweredCount = attempt.unanswered ?? 0;
  const pointsEarned = attempt.pointsEarned ?? 0;

  // Format time spent
  const formatTimeSpent = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} ثانية`;
    return `${mins} دقيقة و ${secs} ثانية`;
  };

  // Performance tier evaluation
  const getPerformanceMessage = (scoreValue: number) => {
    if (scoreValue >= 90) return { title: 'أداء أسطوري استثنائي!', badge: 'ممتاز مرتفع', color: 'text-emerald-600 dark:text-emerald-400' };
    if (scoreValue >= 75) return { title: 'أداء رائع ومتقدم جداً!', badge: 'جيد جداً', color: 'text-blue-600 dark:text-blue-400' };
    if (scoreValue >= 50) return { title: 'بداية جيدة ومبشرة!', badge: 'ناجح', color: 'text-amber-600 dark:text-amber-400' };
    return { title: 'فرصة رائعة للمراجعة والتعلم!', badge: 'يحتاج تدريب', color: 'text-rose-600 dark:text-rose-400' };
  };

  const performance = getPerformanceMessage(score);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fadeIn pb-24 md:pb-12">
      {/* Header Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>تم تسجيل نتيجة الامتحان بنجاح</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          نتيجة الامتحان
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {attempt.examTitle || 'امتحان أريكسون'}
        </p>
      </div>

      {/* Main Radial Score Card */}
      <div 
        id="exam-result-score-card"
        className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5"
      >
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          {/* Circular SVG gauge */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-blue-600 transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray="264"
              strokeDashoffset={264 - (264 * score) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {score}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              {score} / 100
            </span>
          </div>
        </div>

        <div>
          <h2 className={`text-lg sm:text-xl font-bold ${performance.color}`}>
            {performance.title}
          </h2>
          <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            التقييم: {performance.badge}
          </span>
        </div>

        {/* Exact Formatted Results Breakdown Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-right space-y-2.5">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/80 pb-2">
            ملخص النتيجة الرسمية للوزاري:
          </div>
          <div className="space-y-2 font-mono text-sm sm:text-base">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
              <span className="font-sans">النتيجة النهائية:</span>
              <span className="text-blue-600 dark:text-blue-400 text-lg font-black">{score} / 100</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold">
              <span className="font-sans">الإجابات الصحيحة:</span>
              <span>{correctCount} / {attempt.totalQuestions || 20}</span>
            </div>
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold">
              <span className="font-sans">الإجابات الخاطئة:</span>
              <span>{wrongCount} / {attempt.totalQuestions || 20}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
              <span className="font-sans">الأسئلة غير المجاب عنها:</span>
              <span>{unansweredCount} / {attempt.totalQuestions || 20}</span>
            </div>
          </div>
        </div>

        {/* 4 Stats Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">صحيحة</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {correctCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-bold">خاطئة</span>
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
              {wrongCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-1">
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold">غير مجابة</span>
            </div>
            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
              {unansweredCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold">النقاط</span>
            </div>
            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
              +{pointsEarned}
            </div>
          </div>
        </div>

        {/* Time spent */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>الوقت المستغرق: {formatTimeSpent(attempt.durationSeconds || 0)}</span>
        </div>
      </div>

      {/* Real Ranking Section */}
      <div 
        id="exam-ranking-section"
        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              ترتيبك
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-400">
            لوحة الصدارة العامة
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          {userRank !== null ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                أنت الآن في المركز:
              </span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>#{userRank}</span>
                <span className="text-xs font-normal text-slate-400">على مستوى المنصة</span>
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-1">
              سيظهر ترتيبك بعد تحديث لوحة الصدارة.
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          id="review-answers-btn"
          onClick={onReviewAnswers}
          className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          <span>مراجعة الإجابات والحل النموذجي</span>
        </button>

        <button
          id="back-to-exams-btn"
          onClick={onBackToExams}
          className="w-full py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الامتحانات</span>
        </button>
      </div>
    </div>
  );
};
