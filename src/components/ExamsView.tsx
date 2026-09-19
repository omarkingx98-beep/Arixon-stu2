import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getExamsList, 
  startOrResumeAttempt,
  getExamById,
  getExamQuestions,
  getAttemptById
} from '../lib/examService';
import { ExamDetailsModal } from './ExamDetailsModal';
import { ExamActiveView } from './ExamActiveView';
import { ExamResultsView } from './ExamResultsView';
import { ExamReviewView } from './ExamReviewView';
import type { Exam, SubjectId, ExamAttempt, Question } from '../types';
import { 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Award, 
  Sparkles, 
  Filter, 
  Play, 
  CheckCircle2, 
  Eye, 
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';

const SUBJECT_FILTERS: { id: SubjectId; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'physics', label: 'الفيزياء' },
  { id: 'math', label: 'الرياضيات' },
  { id: 'chemistry', label: 'الكيمياء' },
  { id: 'biology', label: 'الأحياء' },
  { id: 'arabic', label: 'اللغة العربية' },
  { id: 'english', label: 'اللغة الإنجليزية' },
];

interface ExamsViewProps {
  initialAttempt?: ExamAttempt | null;
  initialViewMode?: 'list' | 'results' | 'review';
  onResetView?: () => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  initialAttempt = null,
  initialViewMode = 'list',
  onResetView,
}) => {
  const { profile, refreshProfile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('all');
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Workflow State Machine: 'list' | 'active' | 'results' | 'review'
  const [viewMode, setViewMode] = useState<'list' | 'active' | 'results' | 'review'>(initialViewMode);
  const [selectedExamForModal, setSelectedExamForModal] = useState<Exam | null>(null);
  const [isStartingAttempt, setIsStartingAttempt] = useState<boolean>(false);

  // Active or Viewed Attempt details
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(initialAttempt);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);

  // Load exams on filter change or view mode change back to 'list'
  useEffect(() => {
    let isMounted = true;
    async function loadExams() {
      if (viewMode !== 'list') return;
      setIsLoading(true);
      try {
        const fetched = await getExamsList(selectedSubject, profile?.uid);
        if (isMounted) {
          setExams(fetched);
        }
      } catch (err) {
        console.error('Error fetching exams from Firestore:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadExams();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject, profile?.uid, viewMode]);

  // Sync initialAttempt prop changes
  useEffect(() => {
    if (initialAttempt) {
      setCurrentAttempt(initialAttempt);
      setViewMode(initialViewMode);
    }
  }, [initialAttempt, initialViewMode]);

  // Handle clicking "Start Exam" or "Resume"
  const handleExamCardClick = (exam: Exam) => {
    if (exam.userAttemptStatus === 'completed' && exam.userLastAttemptId) {
      // View existing submitted attempt result directly
      openSubmittedAttempt(exam.userLastAttemptId, exam);
      return;
    }

    // Open details preview modal
    setSelectedExamForModal(exam);
  };

  // Open existing submitted attempt
  const openSubmittedAttempt = async (attemptId: string, exam?: Exam) => {
    if (!profile) return;
    try {
      setIsLoading(true);
      const att = await getAttemptById(attemptId, profile.uid);
      if (att) {
        setCurrentAttempt(att);
        if (exam) setCurrentExam(exam);
        setViewMode('results');
      }
    } catch (err) {
      console.error('Error loading submitted attempt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start or resume attempt from modal
  const handleStartExamFromModal = async (exam: Exam) => {
    if (!profile) return;
    setIsStartingAttempt(true);
    try {
      const { attempt, questions } = await startOrResumeAttempt(
        exam.id,
        profile.uid,
        profile.displayName
      );

      setCurrentExam(exam);
      setCurrentAttempt(attempt);
      setCurrentQuestions(questions);
      setSelectedExamForModal(null);

      // If already submitted (e.g. attempt completed), go to results
      if (attempt.status === 'submitted') {
        setViewMode('results');
      } else {
        setViewMode('active');
      }
    } catch (err: any) {
      console.error('Failed to start exam:', err);
      throw err;
    } finally {
      setIsStartingAttempt(false);
    }
  };

  // Called when student finishes/submits active exam
  const handleFinishExam = async (submittedAttempt: ExamAttempt) => {
    setCurrentAttempt(submittedAttempt);
    setViewMode('results');
    // Refresh user's profile points and stats in background
    if (refreshProfile) {
      try {
        await refreshProfile();
      } catch (err) {
        console.warn('Profile refresh after exam submit:', err);
      }
    }
  };

  // Return to exams list
  const handleBackToList = () => {
    setViewMode('list');
    setCurrentAttempt(null);
    setCurrentExam(null);
    if (onResetView) onResetView();
  };

  // 1. ACTIVE EXAM VIEW (Focused, full distraction-free screen)
  if (viewMode === 'active' && currentExam && currentAttempt && profile) {
    return (
      <ExamActiveView
        exam={currentExam}
        attempt={currentAttempt}
        questions={currentQuestions}
        userId={profile.uid}
        onFinishExam={handleFinishExam}
      />
    );
  }

  // 2. EXAM RESULTS VIEW
  if (viewMode === 'results' && currentAttempt && profile) {
    return (
      <ExamResultsView
        attempt={currentAttempt}
        userId={profile.uid}
        onReviewAnswers={() => setViewMode('review')}
        onBackToExams={handleBackToList}
      />
    );
  }

  // 3. EXAM REVIEW VIEW
  if (viewMode === 'review' && currentAttempt && profile) {
    return (
      <ExamReviewView
        attempt={currentAttempt}
        userId={profile.uid}
        onBack={() => setViewMode('results')}
      />
    );
  }

  // 4. MAIN EXAMS LIST VIEW
  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            الامتحانات التنافسية
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            توجيهي 2009
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          امتحانات إلكترونية مؤقتة مطابقة لأحدث مناهج التوجيهي، تصحيح فوري ونقاط مباشرة لرفع ترتيبك.
        </p>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">المادة:</span>
        </div>
        {SUBJECT_FILTERS.map((filter) => {
          const isSelected = selectedSubject === filter.id;
          return (
            <button
              key={filter.id}
              id={`filter-subject-${filter.id}`}
              onClick={() => setSelectedSubject(filter.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] animate-pulse space-y-4"
            >
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Real Exams Grid */}
      {!isLoading && exams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const isCompleted = exam.userAttemptStatus === 'completed' || exam.status === 'completed';
            const isInProgress = exam.userAttemptStatus === 'in_progress';

            const difficultyText = 
              exam.difficulty === 'easy' ? 'سهل' :
              exam.difficulty === 'hard' ? 'متقدم' : 'متوسط';

            const difficultyBadgeColor = 
              exam.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
              exam.difficulty === 'hard' ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
              'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';

            return (
              <div
                key={exam.id}
                id={`exam-card-${exam.id}`}
                className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111625] shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg">
                      {exam.subjectNameAr || exam.subject}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${difficultyBadgeColor}`}>
                        {difficultyText}
                      </span>

                      {isCompleted && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مكتمل</span>
                        </span>
                      )}

                      {isInProgress && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>قيد الحل</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Lesson */}
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 leading-snug">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                    {exam.lesson}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {exam.description}
                  </p>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.questionCount} سؤال</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{exam.totalPoints} نقطة</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div>
                  {isCompleted ? (
                    <div className="space-y-2">
                      {exam.userScore !== undefined && (
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="text-slate-500">درجتك المسجلة:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {exam.userScore} / 100 ({exam.userScore}%)
                          </span>
                        </div>
                      )}
                      <button
                        id={`review-exam-btn-${exam.id}`}
                        onClick={() => handleExamCardClick(exam)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>عرض النتيجة والمراجعة</span>
                      </button>
                    </div>
                  ) : isInProgress ? (
                    <button
                      id={`resume-exam-btn-${exam.id}`}
                      onClick={() => handleExamCardClick(exam)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>متابعة الامتحان (المؤقت نشط)</span>
                    </button>
                  ) : (
                    <button
                      id={`start-exam-btn-${exam.id}`}
                      onClick={() => handleExamCardClick(exam)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>بدء الامتحان</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Professional Empty State */}
      {!isLoading && exams.length === 0 && (
        <div
          id="exams-empty-state"
          className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto my-4"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            لا توجد امتحانات متاحة حاليًا لهذا التصنيف
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            اختر تصنيفاً آخر أو مادة أخرى من القائمة العلوية للاطلاع على بنك الامتحانات النشطة لجيل 2009.
          </p>

          <button
            onClick={() => setSelectedSubject('all')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            عرض جميع الامتحانات
          </button>
        </div>
      )}

      {/* Exam Details Preview Modal */}
      {selectedExamForModal && (
        <ExamDetailsModal
          exam={selectedExamForModal}
          isOpen={!!selectedExamForModal}
          onClose={() => setSelectedExamForModal(null)}
          onStartExam={handleStartExamFromModal}
          isLoading={isStartingAttempt}
        />
      )}
    </div>
  );
};
