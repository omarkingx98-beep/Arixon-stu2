/**
 * Question Validation & Quality Scoring Engine
 * 
 * Complies with Phase 4 directives:
 * - Strict structural schema validation
 * - Content, ambiguity, and explanation consistency validation
 * - Cross-batch and Question Bank duplicate detection
 * - Quality scoring with 90+ threshold
 */

import type { 
  AiGeneratedQuestionDraft, 
  QuestionQualityScores, 
  QuestionBankItem,
  Exam
} from '../types';
import { verifyCalculationDeterministic } from './mathVerification';

/**
 * Normalizes Arabic text for duplicate comparison
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alefs
    .replace(/[إأآٱ]/g, 'ا')
    // Normalize taa marbouta
    .replace(/ة/g, 'ه')
    // Normalize yaa
    .replace(/ى/g, 'ي')
    // Remove punctuation and extra whitespaces
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Token Jaccard Similarity (0 to 1)
 */
export function calculateTokenSimilarity(textA: string, textB: string): number {
  const normA = normalizeArabicText(textA);
  const normB = normalizeArabicText(textB);

  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const tokensA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const tokensB = new Set(normB.split(' ').filter((w) => w.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection++;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Validates a single question draft thoroughly
 */
export function validateQuestionDraft(
  draft: AiGeneratedQuestionDraft,
  context: {
    existingBank?: QuestionBankItem[];
    currentBatch?: AiGeneratedQuestionDraft[];
    existingExam?: Exam;
  } = {}
): {
  draft: AiGeneratedQuestionDraft;
  isValid: boolean;
  needsReview: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Structural Checks
  if (!draft.questionText || draft.questionText.trim().length < 8) {
    errors.push('نص السؤال قصير جداً أو مفقود.');
  }

  const isMcq = draft.questionType === 'multiple_choice';
  const isTf = draft.questionType === 'true_false';

  if (!Array.isArray(draft.options)) {
    errors.push('الخيارات مفقودة أو ليست مصفوفة.');
  } else {
    if (isMcq && draft.options.length !== 4) {
      errors.push(`أسئلة الاختيار من متعدد تتطلب بالضبط 4 خيارات (الحالي: ${draft.options.length}).`);
    } else if (isTf && draft.options.length !== 2) {
      errors.push(`أسئلة الصواب والخطأ تتطلب بالضبط خيارين (الحالي: ${draft.options.length}).`);
    }

    // Check for empty options
    const emptyCount = draft.options.filter((opt) => !opt || !opt.trim()).length;
    if (emptyCount > 0) {
      errors.push(`يوجد ${emptyCount} خيارات فارغة.`);
    }

    // Check for duplicate options within the same question
    const uniqueOptions = new Set(draft.options.map((o) => normalizeArabicText(o)));
    if (uniqueOptions.size < draft.options.length) {
      errors.push('يوجد خيارات مكررة أو متطابقة داخل نفس السؤال.');
    }
  }

  if (typeof draft.correctAnswer !== 'number' || draft.correctAnswer < 0 || draft.correctAnswer >= (draft.options?.length || 4)) {
    errors.push(`مؤشر الإجابة الصحيحة (${draft.correctAnswer}) غير صالح.`);
  }

  if (!draft.explanation || draft.explanation.trim().length < 10) {
    warnings.push('الشرح التوضيحي للحل مختصر جداً.');
  }

  // 2. Mathematical / Physics Calculation Deterministic Verification
  let calcScore = 15;
  let calcStatus: 'VERIFIED' | 'FAILED_VERIFICATION' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';

  if (draft.calculation && draft.calculation.expression) {
    const verifiedCalc = verifyCalculationDeterministic(
      draft.calculation,
      draft.options,
      draft.correctAnswer
    );
    draft.calculation = verifiedCalc;

    if (verifiedCalc.verified) {
      calcStatus = 'VERIFIED';
      calcScore = 15;
    } else {
      calcStatus = 'FAILED_VERIFICATION';
      calcScore = 0;
      errors.push(`فشل التحقق الحسابي المستقل: ${verifiedCalc.verificationError || 'نتائج الحساب لا تطابق الخيارات.'}`);
    }
  } else {
    calcStatus = 'NOT_APPLICABLE';
    calcScore = 15;
  }

  // 3. Duplicate Detection
  let isDuplicate = false;
  let duplicateDetails: string | undefined;
  let dupScore = 10;

  // Check against current batch
  if (context.currentBatch) {
    for (const other of context.currentBatch) {
      if (other.id === draft.id) continue;
      const sim = calculateTokenSimilarity(draft.questionText, other.questionText);
      if (sim >= 0.80) {
        isDuplicate = true;
        duplicateDetails = `تشابه بنسبة ${Math.round(sim * 100)}% مع سؤال آخر في نفس الدفعة: "${other.questionText.slice(0, 45)}..."`;
        errors.push(duplicateDetails);
        dupScore = 0;
        break;
      }
    }
  }

  // Check against Question Bank
  if (!isDuplicate && context.existingBank) {
    for (const item of context.existingBank) {
      const sim = calculateTokenSimilarity(draft.questionText, item.questionText);
      if (sim >= 0.85) {
        isDuplicate = true;
        duplicateDetails = `تشابه بنسبة ${Math.round(sim * 100)}% مع سؤال معتمد في بنك الأسئلة: "${item.questionText.slice(0, 45)}..."`;
        errors.push(duplicateDetails);
        dupScore = 2;
        break;
      }
    }
  }

  // 4. Source Grounding Check
  let sourceGroundingScore = 10;
  if (draft.sourceMode === 'source_based') {
    if (!draft.sourceSection && !draft.sourceQuoteOrReference) {
      warnings.push('وضع التوليد مبني على المصدر، ولكن لا يوجد مرجع مقتبس للفقرة.');
      sourceGroundingScore = 5;
    }
  }

  // 5. Stage 2 Review integration
  let secondPassValid = true;
  if (draft.secondPassReview) {
    if (draft.secondPassReview.status === 'FAIL') {
      secondPassValid = false;
      warnings.push(`مراجعة الجودة التربوية (المرحلة 2) أبدت ملاحظات: ${draft.secondPassReview.reason}`);
      if (draft.secondPassReview.detectedIssues?.length) {
        draft.secondPassReview.detectedIssues.forEach((issue) => warnings.push(`[ملاحظة تربوية]: ${issue}`));
      }
    }
  }

  // 6. Quality Scoring (0..100)
  const structureScore = Math.max(0, 20 - errors.length * 7);
  const contentAccuracy = Math.max(0, 20 - (secondPassValid ? 0 : 8) - warnings.length * 2);
  const answerConsistency = errors.some((e) => e.includes('الإجابة') || e.includes('خيارات')) ? 5 : 15;
  const difficultyFit = 10;

  const overallScore = Math.min(100, Math.max(0,
    structureScore +
    contentAccuracy +
    answerConsistency +
    calcScore +
    difficultyFit +
    sourceGroundingScore +
    dupScore
  ));

  const qualityScores: QuestionQualityScores = {
    structureScore,
    contentAccuracy,
    answerConsistency,
    calculationScore: calcScore,
    difficultyFit,
    sourceGrounding: sourceGroundingScore,
    duplicateScore: dupScore,
    overallScore,
  };

  const hasFatalErrors = errors.length > 0;
  const needsReview = hasFatalErrors || warnings.length > 0 || overallScore < 90 || !secondPassValid;

  let finalStatus = draft.generationStatus;
  if (hasFatalErrors) {
    finalStatus = 'needs_review';
  } else if (needsReview) {
    finalStatus = 'needs_review';
  } else {
    finalStatus = 'validated';
  }

  const updatedDraft: AiGeneratedQuestionDraft = {
    ...draft,
    validationErrors: errors,
    validationWarnings: warnings,
    isDuplicate,
    duplicateMatchDetails: duplicateDetails,
    calculationStatus: calcStatus,
    qualityScores,
    generationStatus: finalStatus,
    updatedAt: new Date().toISOString(),
  };

  return {
    draft: updatedDraft,
    isValid: !hasFatalErrors,
    needsReview,
  };
}

/**
 * Validates a complete batch of generated questions
 */
export function validateQuestionBatch(
  drafts: AiGeneratedQuestionDraft[],
  context: {
    existingBank?: QuestionBankItem[];
    existingExam?: Exam;
  } = {}
): {
  validatedDrafts: AiGeneratedQuestionDraft[];
  total: number;
  validCount: number;
  needsReviewCount: number;
  failedCount: number;
  duplicateCount: number;
  avgQualityScore: number;
} {
  const validatedList: AiGeneratedQuestionDraft[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const { draft } = validateQuestionDraft(d, {
      ...context,
      currentBatch: validatedList, // Check duplicates against preceding items in the batch
    });
    validatedList.push(draft);
  }

  const validCount = validatedList.filter((q) => q.validationErrors.length === 0 && q.qualityScores.overallScore >= 90).length;
  const needsReviewCount = validatedList.filter((q) => q.validationErrors.length === 0 && q.qualityScores.overallScore < 90).length;
  const failedCount = validatedList.filter((q) => q.validationErrors.length > 0).length;
  const duplicateCount = validatedList.filter((q) => q.isDuplicate).length;

  const totalScore = validatedList.reduce((acc, q) => acc + q.qualityScores.overallScore, 0);
  const avgQualityScore = validatedList.length ? Math.round(totalScore / validatedList.length) : 0;

  return {
    validatedDrafts: validatedList,
    total: validatedList.length,
    validCount,
    needsReviewCount,
    failedCount,
    duplicateCount,
    avgQualityScore,
  };
}
