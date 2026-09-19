import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Edit3,
  Trash2,
  Calculator,
  ShieldCheck,
  BookOpen,
  Eye,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AiGeneratedQuestionDraft } from '../../../types';

interface AiQuestionReviewCardProps {
  draft: AiGeneratedQuestionDraft;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (draft: AiGeneratedQuestionDraft) => void;
  onRegenerate: (draft: AiGeneratedQuestionDraft) => void;
}

export const AiQuestionReviewCard: React.FC<AiQuestionReviewCardProps> = ({
  draft,
  index,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const score = draft.qualityScores?.overallScore ?? 80;
  const isApproved = draft.generationStatus === 'approved';
  const isRejected = draft.generationStatus === 'rejected';
  const hasErrors = draft.validationErrors?.length > 0;
  const isDuplicate = draft.isDuplicate;
  const calcStatus = draft.calculationStatus;

  // Status badge styling
  let badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  let badgeText = 'بحاجة لمراجعة';
  if (isApproved) {
    badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    badgeText = 'معتمد';
  } else if (isRejected) {
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    badgeText = 'مرفوض';
  } else if (draft.generationStatus === 'regenerated') {
    badgeColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    badgeText = 'مُعاد توليده';
  } else if (!hasErrors && score >= 90) {
    badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    badgeText = 'مُدقق بنجاح';
  }

  const optionLetters = ['أ', 'ب', 'ج', 'د'];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 ${
        isApproved
          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-500/30'
          : isRejected
          ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-500/20 opacity-70'
          : isSelected
          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/40 shadow-xs'
          : 'bg-white dark:bg-[#0c101c] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(draft.id)}
            disabled={isRejected}
            className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            #{index + 1}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {badgeText}
          </span>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
            {draft.difficulty === 'hard' ? 'صعب' : draft.difficulty === 'easy' ? 'سهل' : 'متوسط'}
          </span>

          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
            {draft.questionType === 'true_false' ? 'صواب وخطأ' : 'اختيار من متعدد'}
          </span>

          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {draft.suggestedPoints} نقاط
          </span>
        </div>

        {/* Quality Score Meter */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">درجة الجودة</span>
            <span
              className={`text-xs font-black ${
                score >= 90
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : score >= 75
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {score} / 100
            </span>
          </div>

          <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Validation Warning & Error Banners */}
      {hasErrors && (
        <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold block mb-1">فشل التحقق الإلزامي:</span>
            <ul className="list-disc list-inside space-y-0.5">
              {draft.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isDuplicate && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{draft.duplicateMatchDetails || 'تم اكتشاف تطابق أو تشابه بنسبة مرتفعة مع سؤال موجود مسبقاً.'}</span>
        </div>
      )}

      {/* Deterministic Calculation Badge */}
      {calcStatus && calcStatus !== 'NOT_APPLICABLE' && (
        <div
          className={`mb-3 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            calcStatus === 'VERIFIED'
              ? 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 shrink-0" />
            <span className="font-bold">
              {calcStatus === 'VERIFIED'
                ? 'تم التحقق الحسابي المستقل برمجياً (Deterministic Math Check Passed)'
                : 'فشل التحقق الحسابي المستقل (Calculation Mismatch)'}
            </span>
          </div>
          {draft.calculation?.formula && (
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
              {draft.calculation.formula}
            </span>
          )}
        </div>
      )}

      {/* Question Text */}
      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed mb-4">
        {draft.questionText}
      </h3>

      {/* Options List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {draft.options.map((opt, optIdx) => {
          const isCorrect = draft.correctAnswer === optIdx;
          return (
            <div
              key={optIdx}
              className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition-all ${
                isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-semibold shadow-xs'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                  isCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {optionLetters[optIdx] || optIdx + 1}
              </span>
              <span className="leading-normal">{opt}</span>
              {isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mr-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Preview */}
      {draft.explanation && (
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 mb-3">
          <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            الإجابة النموذجية وتأكيد الحل:
          </span>
          <p className="leading-relaxed">{draft.explanation}</p>
        </div>
      )}

      {/* Distractor & Traps Analysis (خيارات التغليط والمموهات) */}
      {draft.distractorAnalysis && Object.keys(draft.distractorAnalysis).length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/15 border border-amber-500/20 text-xs mb-4">
          <span className="font-bold text-amber-800 dark:text-amber-300 block mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            تحليل خيارات التغليط والفخاخ التعليمية (المموهات):
          </span>
          <div className="space-y-2">
            {Object.entries(draft.distractorAnalysis).map(([optName, trapDesc], dIdx) => (
              <div key={dIdx} className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-amber-500/15 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                  خيار التغليط ({optName}):
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  {trapDesc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Grounding & Second-Pass Accordion Details */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium transition-colors"
        >
          <span>تفاصيل التدقيق التربوي والمصدر</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showDetails && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2.5">
            {draft.sourceQuoteOrReference && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  المرجع المصدر المعتمد:
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  {draft.sourceQuoteOrReference}
                </span>
              </div>
            )}

            {draft.secondPassReview && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ملاحظات المدقق التربوي (المرحلة 2):
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {draft.secondPassReview.reason}
                </p>
              </div>
            )}

            {draft.calculation && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  المتغيرات والحساب الرياضي:
                </span>
                <div className="bg-white dark:bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <div>التعبير: {draft.calculation.expression}</div>
                  <div>المتغيرات: {JSON.stringify(draft.calculation.variables)}</div>
                  <div>النتيجة المتوقعة: {draft.calculation.expectedResult} {draft.calculation.unit}</div>
                  {draft.calculation.evaluatedResult !== undefined && (
                    <div>النتيجة المستقلة: {draft.calculation.evaluatedResult}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {!isApproved ? (
            <button
              onClick={() => onApprove(draft.id)}
              disabled={hasErrors}
              title={hasErrors ? 'لا يمكن اعتماد سؤال يحتوي على أخطاء' : 'اعتماد السؤال'}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>اعتماد السؤال</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              تم الاعتماد
            </span>
          )}

          {!isRejected ? (
            <button
              onClick={() => onReject(draft.id)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>رفض</span>
            </button>
          ) : (
            <button
              onClick={() => onApprove(draft.id)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              استرجاع
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(draft)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="تعديل السؤال يدوياً"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onRegenerate(draft)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            title="إعادة توليد سؤال بديل"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
