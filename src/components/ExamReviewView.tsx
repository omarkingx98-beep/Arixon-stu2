import React, { useState, useEffect } from 'react';
import type { ExamAttempt, QuestionReview } from '../types';
import { getAttemptReviews } from '../lib/examService';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  Filter, 
  Loader2,
  AlertTriangle 
} from 'lucide-react';

interface ExamReviewViewProps {
  attempt: ExamAttempt;
  userId: string;
  onBack: () => void;
}

export const ExamReviewView: React.FC<ExamReviewViewProps> = ({
  attempt,
  userId,
  onBack,
}) => {
  const [reviews, setReviews] = useState<QuestionReview[]>((attempt as any).reviews || []);
  const [isLoading, setIsLoading] = useState<boolean>(!((attempt as any).reviews?.length));
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');

  useEffect(() => {
    let isMounted = true;
    if (!reviews || reviews.length === 0) {
      async function loadReviews() {
        setIsLoading(true);
        try {
          const loaded = await getAttemptReviews(attempt.id, userId);
          if (isMounted) {
            setReviews(loaded);
          }
        } catch (err) {
          console.error('Error loading attempt reviews:', err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
      loadReviews();
    }
    return () => {
      isMounted = false;
    };
  }, [attempt.id, userId]);

  const filteredReviews = (reviews || []).filter((q) => {
    if (filterMode === 'correct') return q.isCorrect;
    if (filterMode === 'wrong') return !q.isCorrect && !q.isUnanswered;
    if (filterMode === 'unanswered') return q.isUnanswered;
    return true;
  });

  const optionLetters = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeIn pb-28 md:pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            مراجعة الإجابات والحل النموذجي
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {attempt.examTitle} • درجتك: {attempt.score}% ({attempt.correctAnswers} صحيحة من {(reviews || []).length})
          </p>
        </div>

        <button
          id="back-from-review-btn"
          onClick={onBack}
          className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          جميع الأسئلة ({(reviews || []).length})
        </button>

        <button
          onClick={() => setFilterMode('correct')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterMode === 'correct'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>الصحيحة ({attempt.correctAnswers || 0})</span>
        </button>

        <button
          onClick={() => setFilterMode('wrong')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterMode === 'wrong'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>الخاطئة ({attempt.wrongAnswers || 0})</span>
        </button>

        <button
          onClick={() => setFilterMode('unanswered')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
            filterMode === 'unanswered'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>غير مجابة ({attempt.unanswered || 0})</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
          <p className="text-sm text-slate-500">جاري تحميل مراجعة الأسئلة والحل النموذجي...</p>
        </div>
      )}

      {/* Questions List */}
      {!isLoading && (
        <div className="space-y-6">
          {filteredReviews.map((q) => {
            const isCorrect = q.isCorrect;
            const isUnanswered = q.isUnanswered;

            return (
              <div
                key={q.questionId}
                id={`review-question-${q.questionId}`}
                className={`p-5 sm:p-7 rounded-3xl border transition-all ${
                  isCorrect
                    ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-950/70 shadow-sm'
                    : isUnanswered
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-950/70 shadow-sm'
                }`}
              >
                {/* Question Status Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      السؤال {q.questionNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({q.pointsEarned} / {q.points} نقاط)
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>إجابة صحيحة</span>
                      </span>
                    )}
                    {!isCorrect && !isUnanswered && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>إجابة خاطئة</span>
                      </span>
                    )}
                    {isUnanswered && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>لم تتم الإجابة</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 leading-relaxed">
                  {q.questionText}
                </h3>

                {/* Options Review */}
                <div className="space-y-2.5 mb-5">
                  {q.options.map((option, idx) => {
                    const isStudentPick = q.studentAnswer === idx;
                    const isRightAnswer = q.correctAnswer === idx;
                    const letter = optionLetters[idx] || (idx + 1).toString();

                    let optionStyle = 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    let badgeNode = null;

                    if (isRightAnswer) {
                      optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500/30';
                      badgeNode = (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>الإجابة النموذجية</span>
                        </span>
                      );
                    } else if (isStudentPick && !isCorrect) {
                      optionStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-100 font-medium';
                      badgeNode = (
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>إجابتك المختارة</span>
                        </span>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-right ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                            isRightAnswer
                              ? 'bg-emerald-600 text-white'
                              : isStudentPick
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-sm leading-relaxed">
                            {option}
                          </span>
                        </div>

                        {badgeNode}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/50 space-y-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
                      <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>التعليل والشرح التعليمي والنموذجي:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-950 dark:text-blue-200 leading-relaxed pr-5">
                      {q.explanation}
                    </p>

                    {/* Formula Used */}
                    {q.formulaUsed && (
                      <div className="mt-2 pr-5 pt-2 border-t border-blue-200/50 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
                        <span className="font-bold text-blue-700 dark:text-blue-400">القانون المستخدم:</span>
                        <code className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 font-mono text-xs font-semibold text-blue-950 dark:text-blue-100 dir-ltr">
                          {q.formulaUsed}
                        </code>
                      </div>
                    )}

                    {/* Step by Step Solution */}
                    {q.solutionSteps && q.solutionSteps.length > 0 && (
                      <div className="mt-2 pr-5 pt-2 border-t border-blue-200/50 dark:border-blue-900/50 space-y-1">
                        <span className="font-bold text-xs text-blue-800 dark:text-blue-300 block mb-1">
                          خطوات الحل النموذجية خطوة بخطوة:
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-950 dark:text-blue-200">
                          {q.solutionSteps.map((step, sIdx) => (
                            <li key={sIdx} className="leading-relaxed">{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {q.source && (
                      <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 pt-1 pr-5">
                        المصدر: {q.source}
                      </div>
                    )}
                  </div>
                )}

                {/* Traps & Distractor Analysis (فخاخ التغليط وكشف أسباب الخطأ) */}
                {q.distractorAnalysis && Object.keys(q.distractorAnalysis).length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>تحليل فخاخ التغليط والمموهات (لماذا وُضعت الخيارات الأخرى؟):</span>
                    </div>
                    <div className="space-y-2 pr-5">
                      {Object.entries(q.distractorAnalysis).map(([distractorKey, trapReason], dIdx) => {
                        const isStudentMistake = q.studentAnswer !== null && q.options[q.studentAnswer] === distractorKey;
                        return (
                          <div
                            key={dIdx}
                            className={`p-2.5 rounded-xl text-xs transition-all ${
                              isStudentMistake
                                ? 'bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 font-medium text-rose-900 dark:text-rose-200'
                                : 'bg-white/80 dark:bg-slate-900/60 border border-amber-200/50 dark:border-amber-800/40 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="font-bold block mb-0.5">
                              {isStudentMistake && '⚠️ الفخ الذي وقعت فيه: '}
                              خيار التغليط ({distractorKey}):
                            </span>
                            <p className="text-[11px] leading-relaxed opacity-90">{trapReason}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredReviews.length === 0 && (
            <div className="p-12 text-center text-slate-500 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              لا توجد أسئلة تطابق الفلتر المحدد.
            </div>
          )}
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="pt-4 text-center">
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          العودة لقائمة الامتحانات
        </button>
      </div>
    </div>
  );
};
