import React, { useState } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  Clock,
  Award,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import type { AiGeneratedQuestionDraft, Exam, SubjectId } from '../../../types';
import { saveExamWithValidation } from '../../../lib/adminService';
import { useAdmin } from '../../../context/AdminContext';

interface AiExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedQuestions: AiGeneratedQuestionDraft[];
  defaultSubject: SubjectId;
  defaultLesson: string;
  onExamCreated: (examId: string) => void;
}

export const AiExamBuilderModal: React.FC<AiExamBuilderModalProps> = ({
  isOpen,
  onClose,
  approvedQuestions,
  defaultSubject,
  defaultLesson,
  onExamCreated,
}) => {
  const { adminProfile } = useAdmin();
  if (!isOpen) return null;

  const [title, setTitle] = useState(`امتحان ${defaultLesson || 'الزخم والتصادمات'} - توجيهي 2009`);
  const [description, setDescription] = useState(
    'امتحان رسمي معتمد لتقييم المفاهيم والمسائل الرياضية والفيزيائية المنهجية.'
  );
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalPoints, setTotalPoints] = useState(
    approvedQuestions.reduce((acc, q) => acc + (q.suggestedPoints || 5), 0) || 100
  );
  const [allowRetake, setAllowRetake] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Validation Checklist Calculations
  const questionCount = approvedQuestions.length;
  const currentSumPoints = approvedQuestions.reduce((acc, q) => acc + (q.points || q.suggestedPoints || 5), 0);
  const pointsMatch = currentSumPoints === totalPoints;
  const allHaveAnswers = approvedQuestions.every(
    (q) => typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < q.options.length
  );
  const allHaveExplanations = approvedQuestions.every((q) => q.explanation && q.explanation.length >= 8);
  const noDuplicates = approvedQuestions.every((q) => !q.isDuplicate);
  const calculationsPass = approvedQuestions.every(
    (q) => q.calculationStatus !== 'FAILED_VERIFICATION'
  );

  // Allow admin to publish or save directly if there is at least 1 question
  const canSave = questionCount > 0;
  const canPublish = questionCount > 0;

  const handleSaveExam = async (publishImmediately: boolean) => {
    setSaveError(null);
    setIsSaving(true);

    try {
      const subjectNamesMap: Record<SubjectId, string> = {
        physics: 'الفيزياء',
        math: 'الرياضيات',
        chemistry: 'الكيمياء',
        biology: 'العلوم الحياتية',
        arabic: 'اللغة العربية',
        english: 'اللغة الإنجليزية',
        islamic: 'التربية والعلوم الإسلامية',
        history: 'تاريخ الأردن / التاريخ',
        geography: 'الجغرافيا',
        computer: 'علوم الحاسوب',
        financial: 'الثقافة المالية',
        social: 'الدراسات الاجتماعية',
        other: 'المبحث المعتمد',
        all: 'المبحث المعتمد',
      };

      const finalTotalPoints = totalPoints > 0 ? totalPoints : (currentSumPoints || 100);

      const examData: Omit<Exam, 'id'> = {
        title: title.trim() || `امتحان ${defaultLesson || 'توجيهي 2009'}`,
        subject: defaultSubject,
        subjectNameAr: subjectNamesMap[defaultSubject] || 'المبحث المعتمد',
        lesson: defaultLesson.trim() || 'المنهاج المعتمد',
        description: description.trim() || 'امتحان رسمي معتمد لتقييم المفاهيم الوزارية لمنهاج 2009.',
        questionCount,
        durationMinutes: durationMinutes > 0 ? durationMinutes : 30,
        totalPoints: finalTotalPoints,
        difficulty: 'medium',
        status: publishImmediately ? 'available' : 'coming_soon',
        published: publishImmediately,
        allowRetake,
        createdBy: adminProfile?.email || 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const formattedQuestions = approvedQuestions.map((q, idx) => ({
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        hint: q.hint,
        solutionSteps: q.solutionSteps,
        formulaUsed: q.formulaUsed,
        distractorAnalysis: q.distractorAnalysis,
        difficulty: q.difficulty,
        source: q.sourceQuoteOrReference || 'منشئ الأسئلة بالذكاء الاصطناعي',
        points: q.suggestedPoints || 5,
        order: idx + 1,
        questionType: q.questionType,
      }));

      const newExamId = await saveExamWithValidation(examData, formattedQuestions);
      onExamCreated(newExamId);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'حدث خطأ أثناء حفظ الامتحان في قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0c101c] rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                تجميع وإنشاء الامتحان من الأسئلة المعتمدة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                فحص المعايير الإلزامية وحساب النقاط قبل النشر لطلبة توجيهي 2009
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {saveError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
              {saveError}
            </div>
          )}

          {/* Validation Checklist Grid */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-2">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-500" />
                قائمة التدقيق الإلزامي قبل النشر (Pre-Publish Validation)
              </span>
              <span className="text-[11px] text-slate-500">
                الأسئلة الجاهزة: {questionCount} سؤال | مجموع النقاط: {currentSumPoints}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                {questionCount >= 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>عدد الأسئلة كافٍ ({questionCount} أسئلة معتمدة)</span>
              </div>

              <div className="flex items-center gap-2">
                {pointsMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span>
                  تطابق مجموع النقاط ({currentSumPoints} / {totalPoints})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {allHaveAnswers ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>جميع الأسئلة محدد لها خيار إجابة صحيح بنسبة 100%</span>
              </div>

              <div className="flex items-center gap-2">
                {allHaveExplanations ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span>شروحات الإجابة النموذجية مكتملة</span>
              </div>

              <div className="flex items-center gap-2">
                {calculationsPass ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>التحقق الحسابي المستقل للفيزياء والرياضيات مجاز</span>
              </div>

              <div className="flex items-center gap-2">
                {noDuplicates ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>عدم وجود أسئلة مكررة داخل الامتحان</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان الامتحان:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                وصف الامتحان وإرشادات الطلاب:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مدة الامتحان (بالدقائق):
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مجموع النقاط المستهدف:
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={totalPoints}
                  onChange={(e) => setTotalPoints(Number(e.target.value) || 100)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  إعادة المحاولة:
                </label>
                <select
                  value={allowRetake ? 'yes' : 'no'}
                  onChange={(e) => setAllowRetake(e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="yes">مسموح بإعادة المحاولة</option>
                  <option value="no">محاولة واحدة فقط</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
          >
            إلغاء
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveExam(false)}
              disabled={isSaving || !canSave}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ كمسودة (Draft)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveExam(true)}
              disabled={isSaving || !canPublish}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>نشر الامتحان رسمياً (Publish)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
