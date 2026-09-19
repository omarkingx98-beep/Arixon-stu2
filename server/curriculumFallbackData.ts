import type { RawAiQuestionOutput } from './aiPipeline';

export function getCurriculumFallbackQuestions(params: {
  subject: string;
  lesson: string;
  difficulty?: string;
  questionType?: string;
  questionCount?: number;
}): RawAiQuestionOutput[] {
  const count = params.questionCount || 5;
  const isTrueFalse = params.questionType === 'true_false';
  const subLower = (params.subject || '').toLowerCase();

  const bank: RawAiQuestionOutput[] = [];

  // 1. Physics Questions
  if (subLower.includes('فيزياء') || subLower.includes('physics')) {
    bank.push(
      {
        questionText: 'جسم كتلته 2 kg يتحرك بسرعة 6 m/s، ما هو مقداره للزخم الخطي؟',
        options: [
          { id: 'A', text: '12 kg·m/s' },
          { id: 'B', text: '3 kg·m/s' },
          { id: 'C', text: '36 kg·m/s' },
          { id: 'D', text: '8 kg·m/s' },
        ],
        correctAnswer: 'A',
        explanation: 'الزخم الخطي p = m × v = 2 kg × 6 m/s = 12 kg·m/s في نفس اتجاه الحركة.',
        distractorAnalysis: {
          B: 'قسمة الكتلة على السرعة بدلاً من ضربهما (خطأ في القانون).',
          C: 'حساب طاقة الحركة نصف الكتلة في مربع السرعة (لبس بين الزخم وطاقة الحركة).',
          D: 'جمع الكتلة مع السرعة 2 + 6 = 8 (خطأ رياضي أساسي).',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
        hint: 'تذكر أن الزخم الخطي هو حاصل ضرب كتلة الجسم في سرعته المتجهة.',
        solutionSteps: [
          'القانون: p = m · v',
          'التعويض: p = 2 kg × 6 m/s',
          'النتيجة: p = 12 kg·m/s',
        ],
        formulaUsed: 'p = m * v',
        calculation: {
          formula: 'p = m * v',
          variables: { m: 2, v: 6 },
          expression: '2 * 6',
          expectedResult: 12,
          unit: 'kg·m/s',
        },
      },
      {
        questionText: 'إذا أثرت قوة محصلة مقدارها 20 N على جسم لفترة زمنية مدتها 0.5 s، فإن الدفع المؤثر على الجسم يساوي:',
        options: [
          { id: 'A', text: '10 N·s' },
          { id: 'B', text: '40 N·s' },
          { id: 'C', text: '20.5 N·s' },
          { id: 'D', text: '5 N·s' },
        ],
        correctAnswer: 'A',
        explanation: 'الدفع I = F × Δt = 20 N × 0.5 s = 10 N·s باتجاه القوة المحصلة.',
        distractorAnalysis: {
          B: 'قسمة القوة على الزمن بدلاً من الضرب (40 N/s).',
          C: 'جمع القوة مع الزمن 20 + 0.5.',
          D: 'ضرب خاطئ بنصف النصف.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
        hint: 'الدفع يساوي القوة مضروبة في زمن تأثيرها.',
        solutionSteps: [
          'الدفع I = F_net · Δt',
          'I = 20 × 0.5 = 10 N·s',
        ],
        formulaUsed: 'I = F * Δt',
        calculation: {
          formula: 'I = F * Δt',
          variables: { F: 20, t: 0.5 },
          expression: '20 * 0.5',
          expectedResult: 10,
          unit: 'N·s',
        },
      },
      {
        questionText: 'في التصادم المرن التام بين جسمين معزولين، تكون الكميات المحفوظة هي:',
        options: [
          { id: 'A', text: 'الزخم الخطي والطاقة الحركية معاً' },
          { id: 'B', text: 'الزخم الخطي فقط دون الطاقة الحركية' },
          { id: 'C', text: 'الطاقة الحركية فقط دون الزخم الخطي' },
          { id: 'D', text: 'طاقة الوضع المرونية فقط' },
        ],
        correctAnswer: 'A',
        explanation: 'في التصادم المرن التام يحفظ الزخم الخطي دائماً للنظام المعزول، وتحفظ الطاقة الحركية الكلية للنظام.',
        distractorAnalysis: {
          B: 'هذا ينطبق على التصادم غير المرن فقط.',
          C: 'لا يمكن حفظ الطاقة الحركية في نظام معزول دون حفظ الزخم الخطي وفق قوانين نيوتن.',
          D: 'طاقة الوضع ليست المعيار المميز للتصادم المرن للأجسام الحرة.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
        hint: 'تذكر شروط تصنيف التصادمات وفق حفظ الطاقة الحركية.',
      },
      {
        questionText: 'المساحة المحصورة تحت منحنى (القوة - الزمن) تمثل فيزيائياً:',
        options: [
          { id: 'A', text: 'الدفع المؤثر (والتغير في الزخم الخطي)' },
          { id: 'B', text: 'الشغل المنجز على الجسم' },
          { id: 'C', text: 'التسارع اللحظي للجسم' },
          { id: 'D', text: 'القدرة الميكانيكية المبذولة' },
        ],
        correctAnswer: 'A',
        explanation: 'المساحة تحت منحنى (F - t) تساوي التكامل ∫ F dt وهو الدفع I الذي يكافئ التغير في الزخم الخطي Δp.',
        distractorAnalysis: {
          B: 'الشغل هو المساحة تحت منحنى (القوة - الإزاحة F-x) وليس (F-t).',
          C: 'التسارع يحسب بقسمة القوة على الكتلة وليس بالمساحة.',
          D: 'القدرة هي مشتقة الشغل بالنسبة للزمن أو حاصل ضرب القوة بالسرعة.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'الوسائد الهوائية في المركبات تقلل من قوة الصدمة المؤثرة على السائق عن طريق:',
        options: [
          { id: 'A', text: 'زيادة زمن تأثير القوة مما يقلل معدل التغير في الزخم' },
          { id: 'B', text: 'تقليل الزخم الخطي الابتدائي للسيارة' },
          { id: 'C', text: 'تقليل التغير الكلي في الزخم الخطي' },
          { id: 'D', text: 'إلغاء مبدأ حفظ الزخم الخطي كلياً' },
        ],
        correctAnswer: 'A',
        explanation: 'بما أن Δp ثابت للتوقف، فإن إطالة زمن التلامس Δt يقلل القوة المتوسطة F = Δp / Δt.',
        distractorAnalysis: {
          B: 'الوسائد الهوائية لا تغير سرعة السيارة ولا كتلتها الابتدائية.',
          C: 'التغير الكلي في الزخم محتوم لأن السائق سيتوقف من سرعته إلى الصفر.',
          D: 'مبادئ الحفظ قوانين كونية لا تلغى.',
        },
        difficulty: 'hard',
        questionType: 'multiple_choice',
      }
    );
  }

  // 2. History & Jordan History Questions
  else if (subLower.includes('تاريخ') || subLower.includes('history')) {
    bank.push(
      {
        questionText: 'أُعلن استقلال المملكة الأردنية الهاشمية رسمياً والبيعة للملك المؤسس عبد الله الأول في تاريخ:',
        options: [
          { id: 'A', text: '25 أيار 1946م' },
          { id: 'B', text: '11 نيسان 1921م' },
          { id: 'C', text: '10 حزيران 1916م' },
          { id: 'D', text: '15 أيار 1948م' },
        ],
        correctAnswer: 'A',
        explanation: 'في 25 أيار 1946م أعلن المجلس التشريعي استقلال الأردن ومبايعة الأمير عبد الله بن الحسين ملكاً دستورياً.',
        distractorAnalysis: {
          B: '11 نيسان 1921م هو تاريخ تشكيل أول حكومة في إمارة شرق الأردن برئاسة رشيد طليع.',
          C: '10 حزيران 1916م هو تاريخ انطلاق الثورة العربية الكبرى من مكة المكرمة.',
          D: '15 أيار 1948م هو تاريخ نكبة فلسطين وانتهاء الانتداب البريطاني عليها.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'المعركة التي خاضها الجيش العربي الأردني عام 1968م وحقق فيها أول انتصار عربي تاريخي هي معركة:',
        options: [
          { id: 'A', text: 'الكرامة' },
          { id: 'B', text: 'اللطرون' },
          { id: 'C', text: 'باب الواد' },
          { id: 'D', text: 'السموع' },
        ],
        correctAnswer: 'A',
        explanation: 'معركة الكرامة وقعت في 21 آذار 1968م وسجلت أول نصر حاسم للجيش العربي الأردني.',
        distractorAnalysis: {
          B: 'اللطرون معركة بطولية خاضها الجيش العربي في حرب 1948م دفاعاً عن القدس.',
          C: 'باب الواد من معارك 1948م البطولية الشهيرة على مداخل القدس.',
          D: 'معركة السموع وقعت في تشرين الثاني عام 1966م جنوب الخليل.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'تولى الشريف الحسين بن علي قيادة الثورة العربية الكبرى في عام 1916م بهدف:',
        options: [
          { id: 'A', text: 'تحقيق حرية العرب ووحدتهم والاستقلال عن السياسات القمعية' },
          { id: 'B', text: 'إبرام تحالفات تجارية بحرية مع الدولة العثمانية' },
          { id: 'C', text: 'تقسيم بلاد الشام وفق اتفاقية سايكس بيكو' },
          { id: 'D', text: 'التنازل عن حماية المقدسات الإسلامية' },
        ],
        correctAnswer: 'A',
        explanation: 'قامت الثورة العربية الكبرى لتحقيق الاستقلال العربي والكرامة والحرية للأمة العربية.',
        distractorAnalysis: {
          B: 'الثورة كانت مساراً تحررياً سياسياً وعسكرياً شاملاً وليست اتفاقاً تجارياً.',
          C: 'سايكس بيكو كانت مؤامرة استعمارية سرية عارضها الشريف الحسين ورفض التنازل لعربيتها.',
          D: 'الشريف الحسين ضحى بعرشه دفاعاً عن عروبة فلسطين والمقدسات الإسلامية.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      }
    );
  }

  // 3. Geography Questions
  else if (subLower.includes('جغراف') || subLower.includes('geography')) {
    bank.push(
      {
        questionText: 'نظام المعلومات الجغرافي (GIS) يختص بشكل رئيسي في:',
        options: [
          { id: 'A', text: 'جمع وإدارة ومعالجة وتحليل وعرض البيانات المكانية والجغرافية' },
          { id: 'B', text: 'قياس سرعة الرياح في الطبقات العليا فقط' },
          { id: 'C', text: 'حساب درجات الزلازل دون استخدام خرائط رقمية' },
          { id: 'D', text: 'التنبؤ بأسعار المعادن الثمينة في البورصات العالمية' },
        ],
        correctAnswer: 'A',
        explanation: 'نظام GIS يربط بين الخرائط الرقمية وقواعد البيانات الوصفية والمكانية لاتخاذ القرارات التخطيطية.',
        distractorAnalysis: {
          B: 'هذا يقتصر على أجهزة الرصد الجوي السطحي والبالونات.',
          C: 'رصد الزلازل هو اختصاص السيزموجراف.',
          D: 'هذا تحليل مالي واقتصادي خارج نطاق نظم المعلومات الجغرافية.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'الظاهرة المناخية التي تتميز بارتفاع غير معتاد في درجات حرارة المياه السطحية في شرق المحيط الهادئ الاستوائي تسمى:',
        options: [
          { id: 'A', text: 'ظاهرة النينيو (El Niño)' },
          { id: 'B', text: 'ظاهرة اللانينا (La Niña)' },
          { id: 'C', text: 'التيار القطبي الهابط' },
          { id: 'D', text: 'رياح السيروكو الصحراوية' },
        ],
        correctAnswer: 'A',
        explanation: 'النينيو هي تسخين مياه المحيط الهادئ وتؤدي لاضطرابات مناخية عالمية واسعة.',
        distractorAnalysis: {
          B: 'اللانينا هي الظاهرة المعاكسة وتتميز ببرودة غير اعتيادية لمياه المحيط الهادئ.',
          C: 'التيار القطبي لا علاقة له بتدفئة المحيط الهادئ الاستوائي.',
          D: 'رياح السيروكو هي رياح حارة وجافة تهب من الصحراء الكبرى نحو المتوسط.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      }
    );
  }

  // 4. Arabic Questions
  else if (subLower.includes('عرب') || subLower.includes('arabic')) {
    bank.push(
      {
        questionText: 'في جملة: "حضر الطلابُ إلا زيداً"، إعراب كلمة (زيداً) هو:',
        options: [
          { id: 'A', text: 'مستثنى منصوب وعلامة نصبه الفتحة' },
          { id: 'B', text: 'بدل مرفوع وعلامة رفعه الضمة' },
          { id: 'C', text: 'فاعل مؤخر مرفوع' },
          { id: 'D', text: 'مفعول به منصوب للفعل حضر' },
        ],
        correctAnswer: 'A',
        explanation: 'الكلام تام مثبت، فيجب نصب المستثنى بالأداة (إلا) وعلامة نصبه الفتحة.',
        distractorAnalysis: {
          B: 'البدل يكون في الاستثناء التام المنفي جوازاً وليس في التام المثبت.',
          C: 'الفاعل هو (الطلابُ) ولا يصح إعراب المستثنى فاعلاً هنا.',
          D: 'الفعل (حضر) لازم لا ينصب مفعولاً به، و(زيداً) واقع بعد أداة الاستثناء.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'نوع البدل في قوله تعالى: "اهدنا الصراط المستقيم * صراط الذين أنعمت عليهم" هو:',
        options: [
          { id: 'A', text: 'بدل كل من كل (مطابق)' },
          { id: 'B', text: 'بدل بعض من كل' },
          { id: 'C', text: 'بدل اشتمال' },
          { id: 'D', text: 'بدل غلط أو نسيان' },
        ],
        correctAnswer: 'A',
        explanation: 'كلمة (صراط) الثانية عين الصراط الأول والمقصود به هو نفسه، فهو بدل مطابق كل من كل.',
        distractorAnalysis: {
          B: 'ليس جزءاً مادياً مجتزءاً من الصراط الأول.',
          C: 'ليس صفة معنوية مشتملة كحسن الصوت أو الأخلاق بل هو المبدل منه بذاته.',
          D: 'القرآن الكريم منزه عن الغلط والنسيان.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      }
    );
  }

  // 5. Mathematics Questions
  else if (subLower.includes('رياض') || subLower.includes('math')) {
    bank.push(
      {
        questionText: 'إذا كان الاقتران f(x) = 3x² + 5x - 7، فإن قيمة مشتقته الأولى f\'(2) تساوي:',
        options: [
          { id: 'A', text: '17' },
          { id: 'B', text: '11' },
          { id: 'C', text: '15' },
          { id: 'D', text: '12' },
        ],
        correctAnswer: 'A',
        explanation: 'المشتقة f\'(x) = 6x + 5. بالتعويض عند x = 2: f\'(2) = 6(2) + 5 = 12 + 5 = 17.',
        distractorAnalysis: {
          B: 'نسيان ضرب الأس في المعامل (3x + 5 = 6 + 5 = 11).',
          C: 'خطأ في الجمع 6(2) = 12، 12 + 3 = 15.',
          D: 'اشتقاق الحد الأول فقط دون إضافة مشتقة الحد الثاني 5.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
        solutionSteps: [
          'المشتقة: f\'(x) = d/dx (3x² + 5x - 7) = 6x + 5',
          'التعويض: f\'(2) = 6(2) + 5 = 12 + 5',
          'الناتج النهائي = 17',
        ],
        formulaUsed: 'd/dx(ax^n) = a*n*x^(n-1)',
      },
      {
        questionText: 'قيمة التكامل المحدد ∫ (2x + 3) dx من x = 0 إلى x = 2 تساوي:',
        options: [
          { id: 'A', text: '10' },
          { id: 'B', text: '7' },
          { id: 'C', text: '14' },
          { id: 'D', text: '5' },
        ],
        correctAnswer: 'A',
        explanation: 'الاقتران الأصلي F(x) = x² + 3x. عند التعويض: F(2) - F(0) = (4 + 6) - (0) = 10.',
        distractorAnalysis: {
          B: 'نسيان التربيع والتعويض فقط في 2x + 3 = 4 + 3 = 7.',
          C: 'حساب 2(2²) + 3(2) = 8 + 6 = 14 دون قسمة معامل x على 2.',
          D: 'تعويض الحد الأدنى خطأ.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      }
    );
  }

  // 6. Chemistry Questions
  else if (subLower.includes('كيمياء') || subLower.includes('chem')) {
    bank.push(
      {
        questionText: 'محلول مائي لحمض الهيدروكلوريك HCl تركيزه 0.01 M، فإن قيمة الرقم الهيدروجيني pH له تساوي:',
        options: [
          { id: 'A', text: '2' },
          { id: 'B', text: '1' },
          { id: 'C', text: '12' },
          { id: 'D', text: '7' },
        ],
        correctAnswer: 'A',
        explanation: 'حمض قوي يتأين كلياً: [H3O+] = 0.01 = 10⁻² M، وبالتالي pH = -log[H3O+] = -log(10⁻²) = 2.',
        distractorAnalysis: {
          B: 'اعتبار التركيز 0.1 M بالخطأ.',
          C: 'حساب pOH بدلاً من pH (14 - 2 = 12).',
          D: 'اعتبار المحلول متعادلاً كالماء النقي.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      },
      {
        questionText: 'عند زيادة الضغط الكلي على نظام غازي في حالة اتزان كيميائي، فإن موضع الاتزان يزاح نحو:',
        options: [
          { id: 'A', text: 'الجهة التي تحتوي على عدد مولات غازية أقل' },
          { id: 'B', text: 'الجهة التي تحتوي على عدد مولات غازية أكثر' },
          { id: 'C', text: 'المتفاعلات دائماً بغض النظر عن عدد المولات' },
          { id: 'D', text: 'لا يتأثر موضع الاتزان بتغير الضغط إطلاقاً' },
        ],
        correctAnswer: 'A',
        explanation: 'وفق قاعدة لوشاتيليه، زيادة الضغط تدفع النظام لتقليل الحجم عبر التحول نحو عدد المولات الغازية الأقل.',
        distractorAnalysis: {
          B: 'هذا يحدث عند خفض الضغط (زيادة الحجم).',
          C: 'التحول يعتمد على المقارنة بين مولات المواد الغازية في الطرفين.',
          D: 'الضغط يؤثر حتماً إذا تفاوتت أعداد المولات الغازية.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      }
    );
  }

  // 7. General / Biology / Islamic / Computer Questions
  else {
    bank.push(
      {
        questionText: `سؤال منهجي نموذجي في مبحث ${params.subject} - درس ${params.lesson}: ما هو التعريف الدقيق للمفهوم العلمي الأساسي؟`,
        options: [
          { id: 'A', text: 'التطبيق الشامل للقوانين والقواعد العلمية المعتمدة في المنهاج' },
          { id: 'B', text: 'الافتراض النظري غير القابل للتجربة أو البرهان' },
          { id: 'C', text: 'التقدير العشوائي دون الاستناد إلى معايير أكاديمية' },
          { id: 'D', text: 'الحفظ المجرد دون فهم العلاقات المنهجية' },
        ],
        correctAnswer: 'A',
        explanation: 'التحليل المنهجي لجيل 2009 يركز على الفهم العميق وتطبيق المفاهيم وفق المعايير الوزارية.',
        distractorAnalysis: {
          B: 'المفاهيم العلمية قابلة للتطبيق والقياس والبرهان.',
          C: 'المنهاج الأكاديمي يبنى على الدقة والقياس الموضوعي.',
          D: 'التقييم الحديث يعتمد على مهارات التفكير العليا وحل المشكلات.',
        },
        difficulty: 'medium',
        questionType: 'multiple_choice',
      },
      {
        questionText: `وفق معايير توجيهي 2009 في مبحث ${params.subject}، أي من الخطوات التالية تضمن الحل النموذجي للمسائل؟`,
        options: [
          { id: 'A', text: 'تحديد المعطيات والمطلوب واختيار القانون المناسب والتحقق من الوحدات' },
          { id: 'B', text: 'التعويض المباشر دون التأكد من اتساق وحدات القياس' },
          { id: 'C', text: 'إهمال الشروط الابتدائية والحدودية للمسألة' },
          { id: 'D', text: 'تخمين النتيجة النهائية دون تدرج في خطوات الحل' },
        ],
        correctAnswer: 'A',
        explanation: 'الحل النموذجي في امتحانات الثانوية العامة يتطلب تفصيلاً منهجياً يبدأ بالمعطيات ثم القانون ووحدات القياس.',
        distractorAnalysis: {
          B: 'اختلاف الوحدات من أشهر أسباب فقدان العلامات الوزارية.',
          C: 'الشروط الابتدائية حاسمة لتحديد الثوابت الرياضية والفيزيائية.',
          D: 'أسئلة الوزارة تتطلب دقة رياضية متكاملة.',
        },
        difficulty: 'easy',
        questionType: 'multiple_choice',
      }
    );
  }

  // Fill up to requested count
  const result: RawAiQuestionOutput[] = [];
  for (let i = 0; i < count; i++) {
    const base = bank[i % bank.length];
    result.push({
      ...base,
      questionText: i < bank.length ? base.questionText : `${base.questionText} (نموذج تطبيقي إضافي ${i + 1})`,
    });
  }

  return result;
}
