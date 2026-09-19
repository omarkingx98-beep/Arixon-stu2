import React, { useState } from 'react';
import { X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AiGeneratedQuestionDraft } from '../../../types';

interface AiEditQuestionModalProps {
  draft: AiGeneratedQuestionDraft | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: AiGeneratedQuestionDraft) => void;
}

export const AiEditQuestionModal: React.FC<AiEditQuestionModalProps> = ({
  draft,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !draft) return null;

  const [questionText, setQuestionText] = useState(draft.questionText);
  const [options, setOptions] = useState<string[]>([...draft.options]);
  const [correctAnswer, setCorrectAnswer] = useState(draft.correctAnswer);
  const [explanation, setExplanation] = useState(draft.explanation);
  const [hint, setHint] = useState(draft.hint || '');
  const [formulaUsed, setFormulaUsed] = useState(draft.formulaUsed || '');
  const [difficulty, setDifficulty] = useState(draft.difficulty);
  const [points, setPoints] = useState(draft.suggestedPoints || 5);
  const [sourceRef, setSourceRef] = useState(draft.sourceQuoteOrReference || '');

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const updated: AiGeneratedQuestionDraft = {
      ...draft,
      questionText: questionText.trim(),
      options: options.map((o) => o.trim()),
      correctAnswer,
      explanation: explanation.trim(),
      hint: hint.trim() || undefined,
      formulaUsed: formulaUsed.trim() || undefined,
      difficulty,
      suggestedPoints: Number(points) || 5,
      sourceQuoteOrReference: sourceRef.trim() || undefined,
      validationErrors: [], // Cleared on manual admin review/edit
      generationStatus: 'validated',
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0c101c] rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              تعديل بيانات السؤال قبل الاعتماد
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              يمكنك تصحيح أي نص، تبديل الإجابة الصحيحة، أو صياغة الشرح يدوياً
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              نص السؤال:
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              الخيارات (حدد الخيار الصحيح بالنقر على الدائرة):
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(idx)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      correctAnswer === idx
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {idx === 0 ? 'أ' : idx === 1 ? 'ب' : idx === 2 ? 'ج' : 'د'}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl border text-xs sm:text-sm ${
                      correctAnswer === idx
                        ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 dark:border-emerald-500/60'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                    } text-slate-900 dark:text-white`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الشرح والتفسير العلمي للإجابة النموذجية:
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تلميح السؤال (إرشاد الطالب دون حل):
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="تلميح يوجه الطالب للقانون أو المفهوم..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                القانون المستخدم (إن وجد):
              </label>
              <input
                type="text"
                value={formulaUsed}
                onChange={(e) => setFormulaUsed(e.target.value)}
                placeholder="مثل: p = m * v"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-mono dir-ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                مستوى الصعوبة:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب / قدرات تفكير</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                النقاط المقترحة:
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                المرجع من المصدر:
              </label>
              <input
                type="text"
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="رقم الفقرة أو المرجع..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات واعتماد السؤال</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
