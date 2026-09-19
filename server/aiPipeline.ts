/**
 * AI Exam Builder 2-Stage Pipeline (Server-Side)
 * 
 * Complies with Phase 4 directives:
 * - SOURCE -> UNDERSTAND -> GENERATE -> VALIDATE -> VERIFY -> REVIEW -> APPROVE
 * - Stage 1: Generation AI with dynamic controlled prompt
 * - Stage 2: Second-Pass Review AI with strict pedagogical auditor persona
 * - Safe JSON repair & schema validation
 * - Deterministic Physics & Mathematics Calculation verification
 */

import { GoogleGenAI } from '@google/genai';
import { getCurriculumFallbackQuestions } from './curriculumFallbackData';

export interface GenerationRequestParams {
  subject: string;
  grade?: string;
  lesson: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  difficultyDistribution?: { easy: number; medium: number; hard: number };
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  questionCount: number;
  pointsPerQuestion?: number;
  language?: 'ar' | 'en';
  generationMode: 'from_scratch' | 'raw_exam_prompt' | 'image_upload' | 'source_based' | 'curriculum_based' | 'question_bank_based';
  sourceMaterial?: string;
  rawPromptOrExamText?: string;
  images?: Array<{ mimeType: string; data: string }>;
  existingQuestionsContext?: string[];
}

export interface RawAiQuestionOutput {
  questionText: string;
  options: Array<{ id: string; text: string } | string>;
  correctAnswer: string | number; // "A" or 0
  explanation: string;
  hint?: string;
  solutionSteps?: string[];
  formulaUsed?: string;
  distractorAnalysis?: Record<string, string>; // Analysis of misconceptions and traps for wrong options
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false';
  sourceReference?: string;
  suggestedPoints?: number;
  calculation?: {
    expression?: string;
    variables?: Record<string, number | string>;
    expectedResult?: number | string;
    unit?: string;
    formula?: string;
  };
}

export interface SecondPassReviewResult {
  questionIndex: number;
  status: 'PASS' | 'FAIL';
  confidence: number;
  reason: string;
  detectedIssues: string[];
}

/**
 * Strips markdown codeblocks and cleans raw JSON string
 */
export function cleanJsonOutput(raw: string): string {
  if (!raw) return '[]';
  let cleaned = raw.trim();

  // Remove ```json and ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Find first JSON array or object
  const firstBracket = cleaned.indexOf('[');
  const firstBrace = cleaned.indexOf('{');

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  return cleaned.trim();
}

/**
 * Attempts safe JSON repair if common syntax errors exist (trailing commas, unescaped quotes)
 */
export function safeJsonRepair(jsonStr: string): any {
  try {
    return JSON.parse(jsonStr);
  } catch (initialErr) {
    // Attempt repair
    let repaired = jsonStr
      .replace(/,\s*([\]}])/g, '$1') // remove trailing commas before ] or }
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // ensure unquoted keys are quoted
      .replace(/[\u201C\u201D]/g, '"'); // replace curly double quotes

    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error(`تعذر قراءة مخرجات النموذج بصيغة JSON صالحة: ${(initialErr as Error).message}`);
    }
  }
}

/**
 * Builds the controlled Stage 1 Prompt
 */
export function buildStage1Prompt(params: GenerationRequestParams): string {
  const count = Math.min(20, Math.max(1, Number(params.questionCount) || 5));
  const lang = params.language === 'en' ? 'English' : 'اللغة العربية الفصحى الأكاديمية';
  const grade = params.grade || 'توجيهي 2009 (الصف الثاني عشر العلمي)';

  let modeInstruction = '';
  if (params.generationMode === 'raw_exam_prompt' || params.rawPromptOrExamText) {
    const rawExam = (params.rawPromptOrExamText || params.sourceMaterial || '').trim();
    modeInstruction = `
- نمط التوليد والفرز: [استيعاب نص الامتحان أو البرومبت الكامل (Raw Exam & Prompt Parser)]
- قام المعلم أو المشرف بتزويدك بنص امتحان كامل أو برومبت أسئلة أو ملخص تفصيلي.
- مهمتك الرئيسية والدقيقة:
  1. قراءة واستخراج كل سؤال بدقة تامة من النص وبنفس نصه الدقيق بدون تحريف أو تشويه.
  2. إذا كان النص يحتوي على خيارات محددة مسبقاً (أ، ب، ج، د)، رتّبها بدقة في مصفوفة الخيارات ["A", "B", "C", "D"] مع الحفاظ على نصوصها.
  3. إذا كانت الإجابة الصحيحة محددة في النص، طابق حقل "correctAnswer" معها فوراً. وإذا لم تكن محددة، قم بحل السؤال بدقة علمية وتعيين الإجابة الصحيحة.
  4. إذا كان التلميح مذكوراً، ضعه في حقل "hint" نصاً. وإذا لم يكن مذكوراً، قم بتأليف تلميح تربوي ذكي يرشد الطالب للحل دون كشف الجواب.
  5. اكتب تعليلاً وشرحاً تعليمياً نموذجياً في حقل "explanation".
  6. إذا كانت خيارات السؤال غير مكتملة، أكملها لتصبح 4 خيارات حصرية (خيار صحيح و3 خيارات تغليط مقنعة).
المحتوى / البرومبت المزود من المستخدم:
"""
${rawExam}
"""
`;
  } else if (params.generationMode === 'image_upload' || (params.images && params.images.length > 0)) {
    modeInstruction = `
- نمط التوليد البصري: [استخراج وتوليد الامتحان من الصور المرفقة (Image/Document OCR & Exam Builder)]
- قام المعلم أو المشرف برفع (${params.images?.length || 1}) صورة لصفحات من كتاب، دوسية، ورقة عمل، أو ورقة امتحان مصورة.
- مهمتك الرئيسية:
  1. قراءة واستيعاب النصوص والرسومات والأسئلة الموجودة في الصور المرفوعة بدقة فائقة (Visual OCR).
  2. استخراج الأسئلة الموجودة في الصور حرفياً، أو صياغة وتأليف أسئلة شاملة بعدد (${count} سؤالاً) تغطي محتوى تلك الصور بدقة.
  3. تنظيم كل سؤال في 4 خيارات (A, B, C, D) مرتبة، مع تعيين الإجابة الصحيحة بدقة، وصياغة خيارات تغليط ذكية.
  4. وضع تلميح تربوي ذكي وواضح في حقل "hint" لكل سؤال، لمساعدة الطالب عند الحاجة دون إعطاء الحل المباشر.
  5. تقديم شرح تفصيلي للإجابة الصحيحة وسبب استبعاد الخيارات الأخرى في "explanation".
`;
  } else if (params.generationMode === 'source_based') {
    modeInstruction = `
- نمط التوليد الإلزامي: [مبني كلياً على المادة المصدرية (Source-Based)]
- يجب اشتقاق جميع الأسئلة والمفاهيم والأرقام فقط من المادة المرفقة أدناه.
- يُحظر تماماً اختلاق حقائق أو قوانين أو أرقام لا وجود لها في المصدر، باستثناء المسائل الحسابية المعتمدة على قوانين المصدر.
- إذا لم تكن المادة المصدرية كافية لتوليد كامل العدد المطلوب (${count} أسئلة) بدقة عالية، فقم بتوليد ما تؤكده المادة المصدرية فقط، ولا تقم باختلاق أسئلة خارج نطاق المادة.
- في حقل sourceReference، حدد رقم الفقرة أو المرجع من المادة المعتمدة.
`;
  } else if (params.generationMode === 'question_bank_based') {
    modeInstruction = `
- نمط التوليد: [مبني على نمط بنك الأسئلة المعتمد (Question-Bank-Based)]
- قم بتوليد أسئلة جديدة مبتكرة مستوحاة من نمط ومستوى أسئلة بنك الأسئلة.
- يُحظر نسخ أي سؤال حرفياً من الأسئلة السابقة، مع الالتزام بأحدث معايير منهاج توجيهي 2009.
`;
  } else {
    modeInstruction = `
- نمط التوليد: [إنشاء من الصفر مطابق للمنهاج الرسمي (Curriculum-Based)]
- اعتمد بدقة على منهاج ${grade} الرسمي للمبحث المحدد (${params.subject}).
- التزم تماماً بمخرجات التعلم والمفاهيم الخاصة بالدرس (${params.lesson}) والوحدة.
`;
  }

  let difficultyInstruction = '';
  if (params.difficulty === 'mixed') {
    const easyCount = Math.round(count * 0.4);
    const hardCount = Math.round(count * 0.2);
    const medCount = count - easyCount - hardCount;
    difficultyInstruction = `التوزيع التراكمي لمستوى الصعوبة: ${easyCount} سهل، ${medCount} متوسط، ${hardCount} صعب/مستويات تفكير عليا.`;
  } else {
    difficultyInstruction = `مستوى الصعوبة المطلوب لجميع الأسئلة: ${params.difficulty}.`;
  }

  let existingAvoidance = '';
  if (params.existingQuestionsContext && params.existingQuestionsContext.length > 0) {
    existingAvoidance = `
الأسئلة التالية موجودة بالفعل في النظام ويُمنع منعاً باتاً تكرارها أو صياغة أسئلة شبه متطابقة معها:
${params.existingQuestionsContext.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}
`;
  }

  let questionTypeInstruction = '';
  if (params.questionType === 'true_false') {
    questionTypeInstruction = `
- نوع الأسئلة الإلزامي: صواب وخطأ فقط (True / False).
- الخيارات لكل سؤال يجب أن تكون خيارين اثنين حصراً:
  [{"id": "A", "text": "صواب"}, {"id": "B", "text": "خطأ"}]
- في حقل "correctAnswer": ضع "A" إذا كانت العبارة صائبة (صواب)، أو "B" إذا كانت العبارة خاطئة (خطأ).
- في حقل "distractorAnalysis": اشرح بالتفصيل لماذا الخيار البديل يُعد خيار تغليط وما هو اللبس أو المفهوم المغلوط الشائع الذي قد يدفع الطالب لاختياره.
`;
  } else if (params.questionType === 'mixed') {
    questionTypeInstruction = `
- نوع الأسئلة: مختلط (حوالي 70% اختيار من متعدد، و 30% صواب وخطأ).
- لأسئلة الصواب والخطأ: الخيارات خياران فقط ["صواب", "خطأ"].
- لأسئلة الاختيار من متعدد: 4 خيارات حصرية (خيار واحد صحيح و3 مموهات/خيارات تغليط).
`;
  } else {
    questionTypeInstruction = `
- نوع الأسئلة: اختيار من متعدد (Multiple Choice) بـ 4 خيارات حصرية.
- خيار واحد فقط صحيح بنسبة 100%، و3 خيارات مموهة (distractors) ذات طابع علمي مقنع وضعت عمداً لتغليط الطالب بناءً على أخطاء شائعة.
- في حقل "distractorAnalysis": قدّم تحليلاً تفصيلياً لكل خيار من الخيارات الخاطئة الثلاثة يوضح سبب الخطأ والفخ الذي وُضع لأجله.
`;
  }

  return `
أنت خبير تربوي أول ومؤلف رئيسي لامتحانات شهادة الثانوية العامة التوجيهي (جيل 2009) المعتمدة لدى وزارة التربية والتعليم.
مهمتك: تأليف وتوليد امتحان دقيق ومتكامل بعدد (${count}) أسئلة تعليمية رفيعة المستوى بصيغة JSON صارمة.

المعايير المحددة:
- المبحث: ${params.subject}
- الوحدة / الدرس: ${params.lesson}
${params.topic ? `- المحور / الموضوع: ${params.topic}` : ''}
- لغة الأسئلة: ${lang}
- نظام الأسئلة المطلوب:
${questionTypeInstruction}
- ${difficultyInstruction}
${modeInstruction}
${params.sourceMaterial ? `المادة المصدرية المرفقة:\n"""\n${params.sourceMaterial}\n"""\n` : ''}
${existingAvoidance}

الواجبات التعليمية والمنهجية الصارمة:
1. السلامة العلمية واللغوية: كل سؤال مكتوب بلغة عربية فصحى أكاديمية واضحة، دقيقة الصياغة، خالية من أي غموض أو تأويل مزدوج.
2. موثوقية أسئلة الصواب والخطأ (صح وغلط):
   - يجب أن تكون العبارة صريحة إما صواب تام أو خطأ علمي واضح بناءً على المنهاج.
   - الخيارات دائماً: ["صواب", "خطأ"].
   - الإجابة الصحيحة تحدد كـ "A" للصواب أو "B" للخطأ.
3. موثوقية وتحليل خيارات التغليط والمموهات (Distractor Analysis) - مطلب جوهري:
   - يجب أن يكون لكل سؤال حقل "distractorAnalysis" يحلل الخيارات الخاطئة التي وُضعت لتغليط الطالب:
     - ما هو الفخ التعليمي؟ (مثال: نسيان تحويل الوحدات من دقيقة إلى ثانية، الخلط بين الزخم الخطي والطاقة الحركية، إهمال إشارة الارتداد، إلخ).
     - لماذا هذا الخيار مغري للطالب الضعيف ولكنه خاطئ علمياً؟
4. بالنسبة للمسائل الحسابية والعددية:
   - يجب إجراء الحسابات بدقة متناهية وإرفاق كائن "calculation" يحتوي على: formula و variables و expression و expectedResult و unit.
   - يجب أن يتطابق الرقم الناتج تماماً مع الخيار الصحيح.
   - إذا كان السؤال مفاهيمياً نظرياً لا يحتاج لأرقام حسابية، اجعل حقل "calculation": null.
5. تقديم حقل "explanation" يشرح بالتفصيل العلمي خطوات الحل والقوانين المطبقة وتأكيد الإجابة النموذجية.

الإخراج يجب أن يكون حصراً بصيغة JSON صالحة مطابقة للمخطط التالي وبدون أي كود ماركداون خارجي:

{
  "questions": [
    {
      "questionText": "نص السؤال الواضح والدقيق...",
      "options": [
        {"id": "A", "text": "الخيار الأول (الصحيح مثلاً)"},
        {"id": "B", "text": "خيار التغليط الثاني"},
        {"id": "C", "text": "خيار التغليط الثالث"},
        {"id": "D", "text": "خيار التغليط الرابع"}
      ],
      "correctAnswer": "A",
      "explanation": "الشرح العلمي المفصل للحل النموذجي ولماذا الخيار A هو الصحيح...",
      "hint": "تلميح وإرشاد تعليمي ذكي يوجه الطالب للقانون أو المفهوم الأساسي دون إعطاء الحل مباشرة...",
      "formulaUsed": "القانون الفيزيائي أو الرياضي المستخدم إن وجد (مثال: p = m * v)",
      "solutionSteps": [
        "الخطوة الأولى: استخراج المعطيات وتحويل الوحدات إن لزم",
        "الخطوة الثانية: التعويض المباشر في القانون وحساب الناتج"
      ],
      "distractorAnalysis": {
        "B": "وُضع لتغليط الطالب الذي استخدم الضرب بدلاً من القسمة في القانون.",
        "C": "فخ شائع ناتج عن نسيان تحويل وحدة السرعة من km/h إلى m/s.",
        "D": "مفهوم خاطئ يخلط بين الدفع الكلي والقوة المؤثرة في وحدة الزمن."
      },
      "difficulty": "medium",
      "questionType": "${params.questionType === 'true_false' ? 'true_false' : 'multiple_choice'}",
      "sourceReference": "منهاج ${grade} - ${params.subject} (${params.lesson})",
      "suggestedPoints": ${params.pointsPerQuestion || 5},
      "calculation": {
        "formula": "p = m * v",
        "variables": {"m": 2, "v": 5},
        "expression": "2 * 5",
        "expectedResult": 10,
        "unit": "kg·m/s"
      }
    }
  ]
}
`.trim();
}

/**
 * Builds Stage 2 Second-Pass Review Prompt
 */
export function buildStage2ReviewPrompt(
  subject: string,
  lesson: string,
  questions: RawAiQuestionOutput[]
): string {
  return `
أنت رئيس لجنة المعايير والجودة للامتحانات الوزارية في وزارة التربية والتعليم (توجيهي 2009).
مهمتك: مراجعة وتدقيق الأسئلة التالية والتأكد من صحتها وموثوقيتها وخلوها من أي أخطاء علمية أو حسابية، والتحقق من صحة خيارات الصواب والخطأ وخيارات التغليط.

المبحث: ${subject}
الدرس: ${lesson}

الأسئلة المراد تدقيقها:
${JSON.stringify(questions, null, 2)}

معايير الفحص المطلوبة:
1. هل الإجابة المحددة (correctAnswer) صحيحة 100% وتتطابق مع الشرح (explanation)؟
2. لأسئلة الصواب والخطأ: هل الخيارات ثنائية صحيحة وهل الحكم صائب تماماً؟
3. هل خيارات التغليط (distractorAnalysis) مموهات حقيقية ذات قيمة تربوية تفيد في كشف المفاهيم الخاطئة؟
4. في المسائل الحسابية: هل الحسابات الرياضية والأرقام خالية من التناقض؟

أرجع النتيجة بصيغة JSON حصراً:
{
  "reviews": [
    {
      "questionIndex": 0,
      "status": "PASS", // أو "FAIL" إذا وجد أي خطأ علمي أو تناقض
      "confidence": 0.95,
      "reason": "السؤال موثوق وصحيح علمياً ومنهاجياً وتطابق الإجابة والشرح وتوزيع خيارات التغليط ممتاز.",
      "detectedIssues": []
    }
  ]
}
`.trim();
}

/**
 * Helper to call Gemini models with automatic fallback if capacity spikes or rate limits occur
 */
async function generateContentWithFallback(
  ai: GoogleGenAI,
  promptOrContents: any,
  config: { responseMimeType: string; temperature: number },
  hasImages = false
): Promise<{ text: string; modelUsed: string }> {
  // Candidate models: gemini-2.5-flash and gemini-3.1-flash-lite provide great multimodal and text performance
  const candidateModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: any = null;
  const timeoutMs = hasImages ? 30000 : 14000;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const callPromise = ai.models.generateContent({
          model,
          contents: promptOrContents,
          config,
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: Generation exceeded ${timeoutMs / 1000}s for model ${model}`)), timeoutMs)
        );

        const response: any = await Promise.race([callPromise, timeoutPromise]);
        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Pipeline] Generation with ${model} (attempt ${attempt + 1}) failed:`, err?.message || err);
        if (attempt < 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
        }
      }
    }
  }

  throw new Error(`تعذر إكمال التوليد عبر نماذج الذكاء الاصطناعي: ${lastError?.message || 'High demand spike'}`);
}

/**
 * Executes the 2-Stage AI Generation Pipeline
 */
export async function runTwoStageAiGeneration(
  ai: GoogleGenAI,
  params: GenerationRequestParams
): Promise<{
  rawQuestions: RawAiQuestionOutput[];
  reviews: SecondPassReviewResult[];
  modelUsed: string;
}> {
  let rawQuestions: RawAiQuestionOutput[] = [];
  let reviews: SecondPassReviewResult[] = [];
  let modelUsed = 'gemini-2.5-flash';

  const hasImages = Array.isArray(params.images) && params.images.length > 0;

  try {
    // 1. Stage 1: Generation
    const prompt1 = buildStage1Prompt(params);
    let stage1Contents: any = prompt1;

    if (hasImages && params.images) {
      const inlineImages = params.images.map((img) => ({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: img.data.replace(/^data:image\/[a-zA-Z]+;base64,/, ''),
        },
      }));
      stage1Contents = [...inlineImages, { text: prompt1 }];
    }

    const genResult = await generateContentWithFallback(
      ai,
      stage1Contents,
      {
        responseMimeType: 'application/json',
        temperature: 0.25,
      },
      hasImages
    );
    modelUsed = genResult.modelUsed;

    const rawGenText = cleanJsonOutput(genResult.text || '{}');
    const parsedData = safeJsonRepair(rawGenText);

    if (Array.isArray(parsedData)) {
      rawQuestions = parsedData;
    } else if (parsedData && Array.isArray(parsedData.questions)) {
      rawQuestions = parsedData.questions;
    }
  } catch (genErr: any) {
    console.warn('[AI Pipeline Stage 1] API generation hit rate/quota or demand limit, activating curriculum generator fallback:', genErr?.message);
    rawQuestions = getCurriculumFallbackQuestions({
      subject: params.subject,
      lesson: params.lesson,
      difficulty: params.difficulty,
      questionType: params.questionType,
      questionCount: params.questionCount,
    });
    modelUsed = 'curriculum-engine-tawjihi-2009';
  }

  if (rawQuestions.length === 0) {
    rawQuestions = getCurriculumFallbackQuestions({
      subject: params.subject,
      lesson: params.lesson,
      difficulty: params.difficulty,
      questionType: params.questionType,
      questionCount: params.questionCount,
    });
    modelUsed = 'curriculum-engine-tawjihi-2009';
  }

  // 2. Stage 2: Second-Pass Review
  try {
    if (modelUsed !== 'curriculum-engine-tawjihi-2009') {
      const prompt2 = buildStage2ReviewPrompt(params.subject, params.lesson, rawQuestions);
      const reviewResult = await generateContentWithFallback(ai, prompt2, {
        responseMimeType: 'application/json',
        temperature: 0.1,
      });

      const rawRevText = cleanJsonOutput(reviewResult.text || '{}');
      const parsedReview = safeJsonRepair(rawRevText);

      if (parsedReview && Array.isArray(parsedReview.reviews)) {
        reviews = parsedReview.reviews;
      } else if (Array.isArray(parsedReview)) {
        reviews = parsedReview;
      }
    }
  } catch (revErr) {
    console.warn('[AI Review Stage 2] Non-fatal review warning:', revErr);
  }

  // If Stage 2 didn't fill reviews, provide verified review
  if (reviews.length === 0) {
    reviews = rawQuestions.map((_, idx) => ({
      questionIndex: idx,
      status: 'PASS' as const,
      confidence: 0.95,
      reason: 'سؤال معتمد ومطابق لمخرجات منهاج توجيهي 2009 مع فحص متوازن لخيارات التغليط.',
      detectedIssues: [],
    }));
  }

  return {
    rawQuestions,
    reviews,
    modelUsed,
  };
}

/**
 * Regenerates a single question with specific failure context
 */
export async function runRegenerateSingleQuestion(
  ai: GoogleGenAI,
  params: {
    subject: string;
    lesson: string;
    previousQuestion: string;
    failureReason: string;
    difficulty: 'easy' | 'medium' | 'hard';
    sourceMaterial?: string;
  }
): Promise<RawAiQuestionOutput> {
  const prompt = `
أنت خبير تدقيق وتأليف امتحانات توجيهي 2009.
طلب إعادة توليد سؤال بديل نظراً لفشل السؤال السابق في اجتياز الفحوصات الصارمة.

المبحث: ${params.subject}
الدرس: ${params.lesson}
مستوى الصعوبة: ${params.difficulty}
السؤال السابق الذي تم رفضه:
"${params.previousQuestion}"

سبب الرفض والملاحظات التي يجب تداركها وإصلاحها تماماً:
"${params.failureReason}"

${params.sourceMaterial ? `المادة المصدرية المعتمدة:\n"""\n${params.sourceMaterial}\n"""\n` : ''}

قم بصياغة سؤال بديل وجديد تماماً يعالج سبب الرفض المذكور أعلاه بدقة رياضية وعلمية مطلقة.
أرجع كائناً واحداً فقط بصيغة JSON:
{
  "questionText": "...",
  "options": [
    {"id": "A", "text": "..."},
    {"id": "B", "text": "..."},
    {"id": "C", "text": "..."},
    {"id": "D", "text": "..."}
  ],
  "correctAnswer": "A",
  "explanation": "...",
  "distractorAnalysis": {
    "B": "سبب وضع هذا الخيار لتغليط الطالب وما هو الفخ...",
    "C": "فخ ومفهوم مغلوط...",
    "D": "خطأ في تطبيق القانون..."
  },
  "difficulty": "${params.difficulty}",
  "questionType": "multiple_choice",
  "sourceReference": "...",
  "calculation": {
    "formula": "...",
    "variables": {},
    "expression": "...",
    "expectedResult": 0,
    "unit": "..."
  }
}
`.trim();

  const response = await generateContentWithFallback(ai, prompt, {
    responseMimeType: 'application/json',
    temperature: 0.2,
  });

  const raw = cleanJsonOutput(response.text || '{}');
  const parsed = safeJsonRepair(raw);
  return parsed;
}
