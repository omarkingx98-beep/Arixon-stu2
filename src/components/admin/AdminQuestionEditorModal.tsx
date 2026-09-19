import React, { useState } from 'react';
import { X, CheckCircle2, HelpCircle, AlertCircle } from 'lucide-react';
import { saveQuestionBankItem } from '../../lib/adminService';
import type { QuestionBankItem, SubjectId, QuestionType } from '../../types';

interface AdminQuestionEditorModalProps {
  questionToEdit?: QuestionBankItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export const AdminQuestionEditorModal: React.FC<AdminQuestionEditorModalProps> = ({
  questionToEdit,
  onClose,
  onSaved,
}) => {
  const [questionText, setQuestionText] = useState(questionToEdit?.questionText || '');
  const [subject, setSubject] = useState<SubjectId>(questionToEdit?.subject || 'physics');
  const [lesson, setLesson] = useState(questionToEdit?.lesson || '');
  const [topic, setTopic] = useState(questionToEdit?.topic || '');
  const [options, setOptions] = useState<string[]>(
    questionToEdit?.options && questionToEdit.options.length >= 2
      ? questionToEdit.options
      : ['', '', '', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState<number>(questionToEdit?.correctAnswer ?? 0);
  const [explanation, setExplanation] = useState(questionToEdit?.explanation || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(questionToEdit?.difficulty || 'medium');
  const [points, setPoints] = useState<number>(questionToEdit?.points || 5);
  const [source, setSource] = useState(questionToEdit?.source || 'أسئلة معتمدة 2009');
  const [status, setStatus] = useState<'active' | 'draft' | 'archived' | 'approved'>(questionToEdit?.status || 'active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjectNames: Record<SubjectId, string> = {
    all: 'الكل',
    physics: 'الفيزياء',
    math: 'الرياضيات',
    arabic: 'اللغة العربية',
    chemistry: 'الكيمياء',
    biology: 'العلوم الحياتية',
    english: 'اللغة الإنجليزية',
    islamic: 'التربية الإسلامية',
    history: 'التاريخ',
    geography: 'الجغرافيا',
    computer: 'تكنولوجيا المعلومات',
    financial: 'الثقافة المالية',
    social: 'الدراسات الاجتماعية',
    other: 'مبحث آخر',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questionText.trim()) {
      setError('يرجى كتابة نص السؤال.');
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('يجب إدخال خيارين على الأقل.');
      return;
    }
    if (correctAnswer < 0 || correctAnswer >= cleanOptions.length) {
      setError('يرجى تحديد الخيار الصحيح بدقة.');
      return;
    }
    if (!explanation.trim()) {
      setError('يرجى كتابة الشرح والتفسير العلمي للإجابة.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveQuestionBankItem({
        id: questionToEdit?.id,
        questionText: questionText.trim(),
        subject,
        subjectNameAr: subjectNames[subject] || 'الفيزياء',
        lesson: lesson.trim() || 'المنهاج العام',
        topic: topic.trim() || undefined,
        options: cleanOptions,
        correctAnswer,
        explanation: explanation.trim(),
        difficulty,
        points: Number(points) || 5,
        source: source.trim() || 'بنك أريكسون',
        questionType: 'multiple_choice',
        status,
        createdAt: questionToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: questionToEdit?.createdBy || 'admin',
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ السؤال في بنك الأسئلة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0c101c] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {questionToEdit ? 'تعديل السؤال في بنك الأسئلة' : 'إضافة سؤال جديد لبنك الأسئلة'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                المبحث الدراسي
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden"
              >
                <option value="physics">الفيزياء</option>
                <option value="math">الرياضيات</option>
                <option value="arabic">اللغة العربية</option>
                <option value="chemistry">الكيمياء</option>
                <option value="biology">العلوم الحياتية</option>
                <option value="english">اللغة الإنجليزية</option>
                <option value="islamic">التربية الإسلامية</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                الدرس أو الوحدة
              </label>
              <input
                type="text"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="مثال: التصادمات في بعد واحد"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              نص السؤال *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="اكتب نص السؤال بدقة وصياغة لغوية سليمة..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              الخيارات (حدد الدائرة بجانب الإجابة النموذجية الصحيحة)
            </label>
            {['أ', 'ب', 'ج', 'د'].map((letter, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2 rounded-xl border ${
                  correctAnswer === idx
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a]'
                }`}
              >
                <input
                  type="radio"
                  name="bank_correct"
                  checked={correctAnswer === idx}
                  onChange={() => setCorrectAnswer(idx)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400">{letter}.</span>
                <input
                  type="text"
                  value={options[idx] || ''}
                  onChange={(e) => {
                    const copy = [...options];
                    copy[idx] = e.target.value;
                    setOptions(copy);
                  }}
                  placeholder={`الخيار (${letter})`}
                  className="w-full bg-transparent text-xs focus:outline-hidden"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              الشرح والتفسير النموذجي *
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="اكتب توضيح الإجابة الصحيحة والقانون المعني..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                الصعوبة
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
              >
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                العلامات
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                الحالة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
              >
                <option value="active">نشط (جاهز للاستخدام)</option>
                <option value="draft">مسودة</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ في بنك الأسئلة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
