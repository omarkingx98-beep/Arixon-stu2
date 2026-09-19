import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Archive,
  Edit3,
  Copy,
  Users,
  Eye,
  Clock,
  Award,
  MoreVertical,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchAllAdminExams, setExamPublishStatus, archiveExam, saveExamWithValidation } from '../../lib/adminService';
import { useAdmin } from '../../context/AdminContext';
import { getExamQuestions } from '../../lib/examService';
import { AdminCreateExamModal } from './AdminCreateExamModal';
import { AdminExamResultsModal } from './AdminExamResultsModal';
import type { Exam, SubjectId } from '../../types';

interface AdminExamsViewProps {
  onOpenAiBuilder?: () => void;
}

export const AdminExamsView: React.FC<AdminExamsViewProps> = ({ onOpenAiBuilder }) => {
  const { adminProfile } = useAdmin();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);
  const [resultsExam, setResultsExam] = useState<Exam | null>(null);

  const [isSeedingFirstExam, setIsSeedingFirstExam] = useState(false);

  const loadExams = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAdminExams();
      setExams(data);
    } catch (err) {
      console.error('Error loading admin exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedFirstExam = async () => {
    if (!window.confirm('هل تريد تثبيت ونشر الامتحان الوزاري الأول (الفيزياء الشامل - الزخم والدفع) بكامل أسئلته الـ 20 في قاعدة البيانات؟')) return;
    setIsSeedingFirstExam(true);
    try {
      const resp = await fetch('/api/admin/seed-first-exam', { method: 'POST' });
      const data = await resp.json();
      if (resp.ok && data.success) {
        alert(`تم تثبيت ونشر الامتحان الأول بنجاح مع ${data.count} سؤالاً وزارياً!`);
        await loadExams();
      } else {
        throw new Error(data.error || 'فشل التثبيت');
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تثبيت الامتحان الأول.');
    } finally {
      setIsSeedingFirstExam(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleTogglePublish = async (exam: Exam) => {
    const nextStatus = !exam.published;
    const confirmMsg = nextStatus
      ? `هل أنت متأكد من رغبتك بنشر امتحان "${exam.title}" ليصبح متاحاً فوراً لجميع الطلاب؟`
      : `هل تريد إلغاء نشر امتحان "${exam.title}" وتحويله لمسودة خاصة؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await setExamPublishStatus(exam.id, nextStatus, exam.title);
      await loadExams();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تغيير حالة نشر الامتحان.');
    }
  };

  const handleArchive = async (exam: Exam) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك بأرشفة امتحان "${exam.title}"؟`)) return;

    try {
      await archiveExam(exam.id, exam.title);
      await loadExams();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء أرشفة الامتحان.');
    }
  };

  const handleDuplicate = async (exam: Exam) => {
    if (!window.confirm(`هل تريد نسخ وتكرار امتحان "${exam.title}"؟`)) return;

    try {
      const existingQs = await getExamQuestions(exam.id);
      const newTitle = `نسخة - ${exam.title}`;

      await saveExamWithValidation(
        {
          title: newTitle,
          subject: exam.subject,
          subjectNameAr: exam.subjectNameAr,
          lesson: exam.lesson,
          description: exam.description || '',
          durationMinutes: exam.durationMinutes,
          totalPoints: exam.totalPoints,
          difficulty: exam.difficulty,
          status: 'coming_soon',
          published: false,
          allowRetake: exam.allowRetake,
          questionCount: existingQs.length,
          createdBy: adminProfile?.email || exam.createdBy || 'super_admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        existingQs.map((q, idx) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer ?? 0,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          source: q.source || 'أريكسون',
          points: q.points || 5,
          order: idx + 1,
          questionType: q.questionType || 'multiple_choice',
        }))
      );

      await loadExams();
      alert('تم استنساخ الامتحان بنجاح كمسودة جديدة.');
    } catch (err: any) {
      alert(err.message || 'فشل استنساخ الامتحان.');
    }
  };

  // Filtered exams list
  const filteredExams = exams.filter((exam) => {
    if (selectedSubject !== 'all' && exam.subject !== selectedSubject) return false;
    if (selectedDifficulty !== 'all' && exam.difficulty !== selectedDifficulty) return false;
    if (selectedStatus === 'published' && !exam.published) return false;
    if (selectedStatus === 'draft' && exam.published) return false;
    if (selectedStatus === 'archived' && !(exam as any).isArchived) return false;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const matchTitle = exam.title.toLowerCase().includes(term);
      const matchLesson = exam.lesson?.toLowerCase().includes(term);
      const matchDesc = exam.description?.toLowerCase().includes(term);
      if (!matchTitle && !matchLesson && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>إدارة ونشر الامتحانات</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إجمالي الامتحانات المسجلة: {exams.length} (المنشورة: {exams.filter((e) => e.published).length})
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeedFirstExam}
            disabled={isSeedingFirstExam}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className={`w-4 h-4 text-emerald-600 ${isSeedingFirstExam ? 'animate-spin' : ''}`} />
            <span>{isSeedingFirstExam ? 'جارٍ التثبيت...' : 'تثبيت الامتحان الأول (الفيزياء الشامل)'}</span>
          </button>

          {onOpenAiBuilder && (
            <button
              onClick={onOpenAiBuilder}
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>توليد أسئلة بالذكاء الاصطناعي</span>
            </button>
          )}

          <button
            onClick={() => {
              setExamToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء امتحان يدوي</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#0c101c] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الامتحان أو الدرس..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">جميع المباحث الدراسية</option>
            <option value="physics">الفيزياء</option>
            <option value="math">الرياضيات</option>
            <option value="arabic">اللغة العربية</option>
            <option value="chemistry">الكيمياء</option>
            <option value="biology">العلوم الحياتية</option>
            <option value="english">اللغة الإنجليزية</option>
            <option value="islamic">التربية الإسلامية</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">جميع الحالات (منشور ومسودة)</option>
            <option value="published">الامتحانات المنشورة فقط</option>
            <option value="draft">المسودات غير المنشورة</option>
            <option value="archived">المؤرشفة</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">جميع المستويات</option>
            <option value="easy">سهل</option>
            <option value="medium">متوسط</option>
            <option value="hard">صعب</option>
          </select>
        </div>
      </div>

      {/* Exams Grid / Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          جارٍ تحميل قائمة الامتحانات من Firestore...
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لم يتم العثور على أي امتحانات تطابق خيارات البحث
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            يمكنك إنشاء امتحان جديد يدوياً أو استخدام منشئ الأسئلة الذكي لإنشاء نماذج امتحانية متكاملة فوراً.
          </p>
          <button
            onClick={() => {
              setExamToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول امتحان الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      exam.published
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {exam.published ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{exam.published ? 'منشور للطلبة' : 'مسودة خاصة'}</span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-400">
                    {exam.subjectNameAr || exam.subject}
                  </span>
                </div>

                {/* Exam Title & Lesson */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                    {exam.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    {exam.lesson}
                  </p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800/60 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">الأسئلة</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exam.questionCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">المدة</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exam.durationMinutes} د
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">العلامة</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exam.totalPoints}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setExamToEdit(exam);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => setResultsExam(exam)}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                    title="كشف نتائج الطلاب"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>النتائج</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(exam)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                    title="تكرار ونسخ الامتحان"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleArchive(exam)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 cursor-pointer"
                    title="أرشفة الامتحان"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleTogglePublish(exam)}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    exam.published
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {exam.published ? 'إلغاء النشر (تحويل لمسودة)' : 'نشر الامتحان للطلاب الآن'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <AdminCreateExamModal
          examToEdit={examToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setExamToEdit(null);
          }}
          onSaved={() => {
            loadExams();
          }}
        />
      )}

      {resultsExam && (
        <AdminExamResultsModal
          exam={resultsExam}
          onClose={() => setResultsExam(null)}
        />
      )}
    </div>
  );
};
