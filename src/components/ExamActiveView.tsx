import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Exam, Question, ExamAttempt } from '../types';
import { 
  saveQuestionAnswer, 
  getSavedAnswersForAttempt, 
  submitExamAttempt 
} from '../lib/examService';
import { safeGetTime } from '../lib/dateUtils';
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Send, 
  Loader2, 
  Grid, 
  X,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface ExamActiveViewProps {
  exam: Exam;
  attempt: ExamAttempt;
  questions: Question[];
  userId: string;
  onFinishExam: (submittedAttempt: ExamAttempt) => void;
  onCancelExit?: () => void;
}

export const ExamActiveView: React.FC<ExamActiveViewProps> = ({
  exam,
  attempt,
  questions,
  userId,
  onFinishExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showPaletteModal, setShowPaletteModal] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const end = safeGetTime(attempt.expectedEndAt);
    const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return remaining;
  });

  const currentQuestion = questions[currentIndex] || questions[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSubmitted = useRef<boolean>(false);

  // Reset hint view when moving to another question
  useEffect(() => {
    setShowHint(false);
  }, [currentIndex]);

  // Load existing saved answers on mount
  useEffect(() => {
    let isMounted = true;
    async function loadAnswers() {
      try {
        const saved = await getSavedAnswersForAttempt(attempt.id);
        if (isMounted) {
          setAnswers(saved);
        }
      } catch (err) {
        console.warn('Could not load saved answers on mount:', err);
      }
    }
    loadAnswers();
    return () => {
      isMounted = false;
    };
  }, [attempt.id]);

  // Server-authoritative timer: calculates against expectedEndAt every second
  useEffect(() => {
    const updateCountdown = () => {
      const end = safeGetTime(attempt.expectedEndAt);
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      // Auto submit when timer reaches 0
      if (remaining <= 0 && !hasAutoSubmitted.current && !isSubmitting) {
        hasAutoSubmitted.current = true;
        handleFinalSubmit(true);
      }
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [attempt.expectedEndAt]);

  // Handle student selecting an option
  const handleSelectOption = async (optionIndex: number) => {
    if (!currentQuestion || isSubmitting) return;

    // Optimistic local state update
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionIndex,
    };
    setAnswers(newAnswers);
    setSavingStatus('saving');

    try {
      await saveQuestionAnswer(attempt.id, currentQuestion.id, optionIndex);
      setSavingStatus('saved');
    } catch (err) {
      console.error('Failed to save answer:', err);
      setSavingStatus('error');
    }
  };

  // Submission handler
  const handleFinalSubmit = async (isAutoExpire = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const submitted = await submitExamAttempt(attempt.id, userId, answers);
      onFinishExam(submitted);
    } catch (err) {
      console.error('Error submitting exam:', err);
      alert('حدث خطأ أثناء إرسال الامتحان. يرجى المحاولة مرة أخرى.');
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalCount = questions.length;
  const answeredCount = useMemo(() => {
    return questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
  }, [questions, answers]);
  const unansweredCount = totalCount - answeredCount;

  // Format timer MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeCritical = secondsRemaining <= 60;
  const isTimeWarning = secondsRemaining <= 180 && !isTimeCritical;

  const currentSelectedOption = currentQuestion ? answers[currentQuestion.id] : null;

  const optionLetters = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-24 md:pb-8">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Exam & Question Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="open-question-palette-btn"
              onClick={() => setShowPaletteModal(true)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="قائمة الأسئلة"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">الأسئلة</span>
            </button>

            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {exam.title}
              </div>
              <div className="text-[11px] sm:text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                <span>{totalCount} سؤالًا</span>
                <span>•</span>
                <span>{exam.totalPoints || 100} علامة</span>
                <span>•</span>
                <span>{exam.durationMinutes} دقيقة</span>
              </div>
            </div>
          </div>

          {/* Real-time Timer & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auto-saving status indicator */}
            <div className="hidden sm:flex items-center text-[11px] text-slate-400">
              {savingStatus === 'saving' && (
                <span className="flex items-center gap-1 text-blue-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري الحفظ...
                </span>
              )}
              {savingStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3 h-3" />
                  تم الحفظ
                </span>
              )}
            </div>

            {/* Timer Badge (Clear 25-minute countdown) */}
            <div 
              id="exam-active-timer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold transition-all ${
                isTimeCritical
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                  : isTimeWarning
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
              }`}
              title="الوقت المتبقي للامتحان"
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'animate-spin' : ''}`} />
              <span dir="ltr">{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Finish Exam Button */}
            <button
              id="top-submit-exam-btn"
              onClick={() => setShowSubmitModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
            >
              إنهاء الامتحان
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Question Body */}
      <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col justify-between">
        {currentQuestion ? (
          <div className="space-y-6">
            {/* Question Header Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  السؤال {currentIndex + 1} من {totalCount}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {currentQuestion.points} علامات
                </span>
              </div>

              {currentQuestion.source && (
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {currentQuestion.source}
                </span>
              )}
            </div>

            {/* Question Text Box */}
            <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
                {currentQuestion.questionText}
              </h2>

              {/* Educational Hint Toggle */}
              {currentQuestion.hint && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {!showHint ? (
                    <button
                      type="button"
                      id="show-hint-btn"
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>إظهار التلميح</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span>التلميح:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowHint(false)}
                          className="text-[11px] text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 font-semibold cursor-pointer underline"
                        >
                          إخفاء التلميح
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
                        {currentQuestion.hint}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentSelectedOption === idx;
                const letter = optionLetters[idx] || (idx + 1).toString();

                return (
                  <button
                    key={idx}
                    id={`question-option-${idx}`}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 sm:p-5 rounded-2xl border text-right transition-all flex items-center justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm shadow-blue-500/10 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {/* Option Letter Circle */}
                      <span className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {letter}
                      </span>

                      {/* Option Text */}
                      <span className={`text-sm sm:text-base font-medium leading-relaxed ${
                        isSelected 
                          ? 'text-blue-950 dark:text-blue-100 font-semibold' 
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {option}
                      </span>
                    </div>

                    {/* Radio Checkmark */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p className="text-sm text-slate-500">جاري تحميل السؤال...</p>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3">
          {/* Previous Button */}
          <button
            id="prev-question-btn"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || isSubmitting}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          {/* Direct Finish Exam Button */}
          <button
            id="finish-exam-direct-btn"
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إنهاء الامتحان</span>
          </button>

          {/* Next / Submit Button */}
          {currentIndex < totalCount - 1 ? (
            <button
              id="next-question-btn"
              onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="submit-exam-final-btn"
              onClick={() => setShowSubmitModal(true)}
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إنهاء وتسليم</span>
            </button>
          )}
        </div>
      </main>

      {/* Question Palette Drawer Modal */}
      {showPaletteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                فهرس أسئلة الامتحان
              </h3>
              <button
                onClick={() => setShowPaletteModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>تمت الإجابة ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span>غير مجاب ({unansweredCount})</span>
              </div>
            </div>

            {/* Questions Grid 1..20 */}
            <div className="grid grid-cols-5 gap-2.5 max-h-60 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowPaletteModal(false);
                    }}
                    className={`h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowPaletteModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
            >
              إغلاق الفهرس
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submission Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div 
            id="confirm-submit-dialog"
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              {unansweredCount > 0 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {unansweredCount > 0 ? 'تنبيه: تسليم الامتحان' : 'تأكيد تسليم الامتحان'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {unansweredCount > 0
                  ? `لديك ${unansweredCount} أسئلة غير مجابة من أصل ${totalCount}. هل أنت متأكد من رغبتك في تسليم الامتحان الآن؟`
                  : 'لقد أجبت على جميع الأسئلة! هل أنت متأكد من رغبتك في تسليم الامتحان واحتساب النتيجة؟'}
              </p>
            </div>

            {/* Breakdown summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-around">
              <div>
                <span className="text-slate-400">المجابة: </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div>
                <span className="text-slate-400">غير المجابة: </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                id="confirm-submit-button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري رصد الدرجات...</span>
                  </>
                ) : (
                  <span>تأكيد التسليم</span>
                )}
              </button>

              <button
                id="cancel-submit-button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
              >
                متابعة الحل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && !showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xl space-y-4 max-w-sm mx-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              جاري تسليم الامتحان...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يتم الآن تدقيق الإجابات وحساب النقاط وتحديث إحصائياتك في قاعدة البيانات.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
