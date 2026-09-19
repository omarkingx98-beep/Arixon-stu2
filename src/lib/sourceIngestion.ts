/**
 * Source Material Ingestion Pipeline
 * 
 * Complies with Phase 4 directives:
 * INPUT -> Extract text -> Normalize text -> Detect subject & lesson
 * -> Identify important concepts -> Create source chunks -> Generate questions
 */

import type { SourceIngestionReport, SourceSectionChunk, SubjectId } from '../types';

// Subject & Topic Keywords Dictionary for Ingestion Detection
const SUBJECT_KEYWORDS: Record<SubjectId, string[]> = {
  all: [],
  physics: ['زخم', 'دفع', 'تصادم', 'كتلة', 'سرعة', 'طاقة حركية', 'نيوتن', 'تسارع', 'قوة', 'مجال', 'تيار', 'مقاومة', 'جهد', 'مغناطيس', 'موجات', 'شغل'],
  math: ['دالة', 'تفاضل', 'تكامل', 'مشتقة', 'مصفوفة', 'معادلة', 'مثلثية', 'لوغاريتم', 'نهايات', 'هندسة', 'احتمالات'],
  chemistry: ['تفاعل', 'مركب', 'حمض', 'قاعدة', 'أكسدة', 'اختزال', 'مول', 'عنصر', 'رابطة', 'عضوية', 'إلكترون'],
  biology: ['خلية', 'وراثة', 'dna', 'rna', 'جين', 'انقسام', 'تنفس خلوي', 'أنزيم', 'بروتين', 'عصب'],
  arabic: ['نحو', 'إعراب', 'بلاغة', 'استعارة', 'تشبيه', 'فاعل', 'مفعول', 'مبتدأ', 'خبر', 'قصيدة'],
  english: ['grammar', 'tense', 'passive', 'vocabulary', 'clause', 'sentence', 'conditional'],
  islamic: ['قرآن', 'حديث', 'فقه', 'أحكام', 'تجويد', 'سيرة', 'عقيدة'],
  history: ['تاريخ', 'ثورة', 'معاهدة', 'حرب', 'انتداب', 'حضارة', 'استعمار', 'فلسطين'],
  geography: ['مناخ', 'تضاريس', 'سكان', 'خريطة', 'موقع جغرافي', 'موارد', 'بيئة'],
  computer: ['برمجة', 'قواعد بيانات', 'شبكات', 'خوارزمية', 'حاسوب', 'أمن معلومات'],
  financial: ['إدارة مالية', 'محاسبة', 'ميزانية', 'بنوك', 'استثمار', 'تسويق'],
  social: ['مجتمع', 'تنمية', 'مواطنة', 'قضايا معاصرة', 'تربية وطنية'],
  other: [],
};

const CONCEPT_DICTIONARY: Record<string, string[]> = {
  'الزخم الخطي': ['زخم خطي', 'كمية الحركة', 'linear momentum', 'p = mv', 'p=mv'],
  'الدفع والتغير في الزخم': ['دفع', 'impulse', 'تغير في الزخم', 'j = f*t', 'j = delta p'],
  'حفظ الزخم الخطي': ['حفظ الزخم', 'تصادم مرن', 'تصادم غير مرن', 'عديم المرونة', 'مجموع الزخوم'],
  'الطاقة الحركية والتصادمات': ['طاقة حركية', 'kinetic energy', 'ضياع في الطاقة', 'k = 1/2 mv^2'],
  'القانون الثاني لنيوتن': ['قوة محصلة', 'نيوتن الثاني', 'f = ma', 'معدل زمني للتغير في الزخم'],
};

/**
 * Normalizes raw input text
 */
export function normalizeSourceText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    // Remove null bytes or invisible control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Ingestion Pipeline Processor
 */
export function ingestSourceMaterial(
  rawInput: string,
  options: {
    sourceType?: SourceIngestionReport['sourceType'];
    targetSubject?: SubjectId;
    targetLesson?: string;
  } = {}
): SourceIngestionReport {
  const normalized = normalizeSourceText(rawInput);
  const rawLength = normalized.length;
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const warnings: string[] = [];
  const detectedConcepts: string[] = [];

  // Minimum size requirement check
  if (rawLength < 30 || wordCount < 6) {
    return {
      sourceId: `src_${Date.now()}`,
      sourceType: options.sourceType || 'pasted_text',
      rawLength,
      wordCount,
      normalizedWordCount: wordCount,
      detectedConcepts: [],
      detectedFormulas: [],
      chunks: [],
      warnings: ['المادة المصدرية فارغة أو غير مقروءة أو قصيرة جداً (أقل من 30 حرفاً).'],
      isUsable: false,
      unusableReason: 'The provided source could not be used reliably (نص المصدر قصير جداً أو غير صالح).',
    };
  }

  // 1. Detect concepts
  for (const [conceptName, keywords] of Object.entries(CONCEPT_DICTIONARY)) {
    const matched = keywords.some((kw) => normalized.toLowerCase().includes(kw.toLowerCase()));
    if (matched) {
      detectedConcepts.push(conceptName);
    }
  }

  // 2. Detect subject if not given
  let detectedSubject: string | undefined = options.targetSubject;
  if (!detectedSubject || detectedSubject === 'all') {
    let maxMatches = 0;
    let bestSubject: SubjectId = 'physics';
    for (const [subId, kws] of Object.entries(SUBJECT_KEYWORDS)) {
      if (kws.length === 0) continue;
      const count = kws.filter((kw) => normalized.includes(kw)).length;
      if (count > maxMatches) {
        maxMatches = count;
        bestSubject = subId as SubjectId;
      }
    }
    if (maxMatches > 0) {
      detectedSubject = bestSubject;
    }
  }

  // 3. Create Chunks (Split by logical paragraphs or headers)
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: SourceSectionChunk[] = [];

  let currentChunkText = '';
  let chunkIdx = 1;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (currentChunkText.length + p.length > 1200 && currentChunkText.length > 300) {
      // Flush chunk
      const chunkWords = currentChunkText.split(/\s+/).filter(Boolean);
      const chunkConcepts = detectedConcepts.filter((c) =>
        CONCEPT_DICTIONARY[c]?.some((kw) => currentChunkText.includes(kw))
      );

      chunks.push({
        index: chunkIdx++,
        title: `القسم ${chunkIdx - 1}: ${currentChunkText.slice(0, 35)}...`,
        content: currentChunkText.trim(),
        charCount: currentChunkText.length,
        wordCount: chunkWords.length,
        detectedConcepts: chunkConcepts.length ? chunkConcepts : ['مفاهيم تعليمية عامة'],
      });
      currentChunkText = p;
    } else {
      currentChunkText = currentChunkText ? `${currentChunkText}\n\n${p}` : p;
    }
  }

  if (currentChunkText.trim()) {
    const chunkWords = currentChunkText.split(/\s+/).filter(Boolean);
    const chunkConcepts = detectedConcepts.filter((c) =>
      CONCEPT_DICTIONARY[c]?.some((kw) => currentChunkText.includes(kw))
    );

    chunks.push({
      index: chunkIdx,
      title: `القسم ${chunkIdx}: ${currentChunkText.slice(0, 35)}...`,
      content: currentChunkText.trim(),
      charCount: currentChunkText.length,
      wordCount: chunkWords.length,
      detectedConcepts: chunkConcepts.length ? chunkConcepts : ['مفاهيم تعليمية عامة'],
    });
  }

  // Warnings
  if (wordCount < 100) {
    warnings.push('المادة المصدرية موجزة نسبياً. قد لا تكفي لتوليد عدد كبير من الأسئلة المتنوعة دون تكرار.');
  }
  if (detectedConcepts.length === 0) {
    warnings.push('لم يتم التعرف على مفاهيم رئيسية واضحة في النص؛ يرجى التأكد من تطابق المادة مع المبحث المحدد.');
  }

  // Extract formulas/equations if present
  const detectedFormulas: string[] = [];
  const formulaPatterns = [
    /p\s*=\s*m\s*\*\s*v/gi,
    /j\s*=\s*f\s*\*\s*(?:delta_t|t|Δt)/gi,
    /k\s*=\s*(?:0\.5|1\/2)\s*\*\s*m\s*\*\s*v\^?2/gi,
    /f\s*=\s*m\s*\*\s*a/gi,
    /w\s*=\s*f\s*\*\s*d/gi,
    /delta_p\s*=\s*m\s*\*\s*\(v2\s*-\s*v1\)/gi,
  ];
  for (const pattern of formulaPatterns) {
    if (pattern.test(normalized)) {
      detectedFormulas.push(pattern.source.replace(/\\/g, ''));
    }
  }

  return {
    sourceId: `src_${Date.now()}`,
    sourceType: options.sourceType || 'pasted_text',
    rawLength,
    wordCount,
    normalizedWordCount: wordCount,
    detectedSubject,
    detectedLesson: options.targetLesson,
    detectedConcepts,
    detectedFormulas,
    chunks,
    warnings,
    isUsable: true,
  };
}
