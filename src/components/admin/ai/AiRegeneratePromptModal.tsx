import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import type { AiGeneratedQuestionDraft } from '../../../types';

interface AiRegeneratePromptModalProps {
  draft: AiGeneratedQuestionDraft | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRegenerate: (draft: AiGeneratedQuestionDraft, failureReason: string) => Promise<void>;
}

export const AiRegeneratePromptModal: React.FC<AiRegeneratePromptModalProps> = ({
  draft,
  isOpen,
  onClose,
  onConfirmRegenerate,
}) => {
  if (!isOpen || !draft) return null;

  const defaultReasons = [
    'خطأ في الحساب الرياضي أو ناتج المعادلة الفيزيائية',
    'الخيارات البديلة غامضة أو غير مميزة تربوياً',
    'السؤال غير مستند بدقة للمادة المصدرية المزودة',
    'مستوى الصعوبة غير مناسب (أسهل أو أصعب من المطلوب)',
    'الشرح والتبرير لا يتطابق مع الخيار الصحيح',
  ];

  const [selectedReason, setSelectedReason] = useState(defaultReasons[0]);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customNote.trim()
      ? `${selectedReason}: ${customNote.trim()}`
      : selectedReason;

    setLoading(true);
    try {
      await onConfirmRegenerate(draft, finalReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0c101c] rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              إعادة توليد السؤال وتصحيحه
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              السؤال المراد استبداله:
            </span>
            <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
              {draft.questionText}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              سبب الرفض أو التعديل المطلوب:
            </label>
            <div className="space-y-1.5">
              {defaultReasons.map((r, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedReason === r
                      ? 'border-purple-500 bg-purple-50/30 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              توجيه إضافي للذكاء الاصطناعي (اختياري):
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="مثال: ركّز على قانون حفظ الزخم في التصادم عديم المرونة..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'جارٍ إعادة التوليد والتدقيق...' : 'إعادة التوليد الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
