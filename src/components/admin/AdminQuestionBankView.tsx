import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  Upload,
  Sparkles,
  Archive,
  Edit3,
  CheckCircle2,
  HelpCircle,
  Tag,
  BookOpen,
} from 'lucide-react';
import { fetchQuestionBank, archiveQuestionBankItem } from '../../lib/adminService';
import { AdminQuestionEditorModal } from './AdminQuestionEditorModal';
import { AdminImportQuestionsModal } from './AdminImportQuestionsModal';
import type { QuestionBankItem, SubjectId } from '../../types';

interface AdminQuestionBankViewProps {
  onOpenAiBuilder?: () => void;
}

export const AdminQuestionBankView: React.FC<AdminQuestionBankViewProps> = ({ onOpenAiBuilder }) => {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<QuestionBankItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuestionBank({
        subject: selectedSubject,
        difficulty: selectedDifficulty,
        status: selectedStatus,
        search: searchQuery,
      });
      setQuestions(data);
    } catch (err) {
      console.error('Error loading question bank:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedSubject, selectedDifficulty, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadQuestions();
  };

  const handleArchive = async (q: QuestionBankItem) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك بأرشفة هذا السؤال؟`)) return;

    try {
      await archiveQuestionBankItem(q.id, q.questionText);
      await loadQuestions();
    } catch (err: any) {
      alert(err.message || 'فشلت أرشفة السؤال.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-indigo-600" />
            <span>بنك الأسئلة المركزي</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مستودع الأسئلة المصنفة حسب المباحث، الدروس، ومستويات الصعوبة مع الشروحات النموذجية
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenAiBuilder && (
            <button
              onClick={onOpenAiBuilder}
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>توليد بالذكاء الاصطناعي</span>
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>استيراد جماعي (CSV/JSON)</span>
          </button>

          <button
            onClick={() => {
              setQuestionToEdit(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white dark:bg-[#0c101c] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بنص السؤال أو الدرس..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value as SubjectId)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
        >
          <option value="all">جميع المباحث</option>
          <option value="physics">الفيزياء</option>
          <option value="math">الرياضيات</option>
          <option value="arabic">اللغة العربية</option>
          <option value="chemistry">الكيمياء</option>
          <option value="biology">العلوم الحياتية</option>
          <option value="english">اللغة الإنجليزية</option>
          <option value="islamic">التربية الإسلامية</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
        >
          <option value="all">جميع مستويات الصعوبة</option>
          <option value="easy">سهل</option>
          <option value="medium">متوسط</option>
          <option value="hard">صعب</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="draft">مسودة</option>
          <option value="archived">مؤرشف</option>
        </select>
      </form>

      {/* Questions List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          جارٍ تحميل أسئلة بنك الأسئلة...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-3">
          <FileQuestion className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            بنك الأسئلة فارغ حالياً أو لا توجد نتائج مطابقة
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            يمكنك إضافة أسئلة فردية، أو استيراد ملف CSV/JSON، أو توليد حزمة أسئلة تعليمية بالذكاء الاصطناعي.
          </p>
          <button
            onClick={() => {
              setQuestionToEdit(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول سؤال لبنك الأسئلة</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white dark:bg-[#0c101c] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                    {q.subjectNameAr || q.subject}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {q.lesson}
                  </span>
                  {q.isAiGenerated && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>مولد بالذكاء الاصطناعي</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setQuestionToEdit(q);
                      setIsEditorOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                    title="تعديل السؤال"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchive(q)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500"
                    title="أرشفة السؤال"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                {q.questionText}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options?.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                      q.correctAnswer === oIdx
                        ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111625] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {q.correctAnswer === oIdx && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                    <span>{opt}</span>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111625] border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">
                      التفسير النموذجي:
                    </strong>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isEditorOpen && (
        <AdminQuestionEditorModal
          questionToEdit={questionToEdit}
          onClose={() => {
            setIsEditorOpen(false);
            setQuestionToEdit(null);
          }}
          onSaved={() => {
            loadQuestions();
          }}
        />
      )}

      {isImportModalOpen && (
        <AdminImportQuestionsModal
          onClose={() => setIsImportModalOpen(false)}
          onImported={() => {
            loadQuestions();
          }}
        />
      )}
    </div>
  );
};
