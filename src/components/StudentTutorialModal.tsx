import React, { useState } from 'react';
import { 
  Sparkles, 
  Award, 
  Layers, 
  Trophy, 
  Home, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Target, 
  TrendingUp, 
  BookOpen, 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Flame, 
  ShieldCheck, 
  Check, 
  Lightbulb, 
  Zap,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { Logo } from './Logo';

interface StudentTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: 'home' | 'exams' | 'leaderboard' | 'profile') => void;
}

export const StudentTutorialModal: React.FC<StudentTutorialModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const TUTORIAL_STEPS = [
    {
      id: 'welcome_mission',
      title: 'ما هي منصة أريكسون؟ ولماذا أُنشئت؟',
      subtitle: 'المنصة الوطنية التفاعلية الأولى لطلبة التوجيهي (فوج 2009)',
      badge: 'الرسالة والأهداف',
      icon: Sparkles,
      color: 'blue',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm sm:text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>لماذا تم بناء أريكسون (Arixon) خصيصاً لك؟</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              أُنشئت المنصة لتكون رفيقك الأكاديمي الحقيقي لاجتياز مرحلة الثانوية العامة (توجيهي 2009) بأعلى المراتب. 
              هدفنا ليس مجرد وضع أسئلة، بل تدريب عقلك على التفكير المنهجي الدقيق وتفكيك أنماط الأسئلة الوزارية الصعبة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>كسر رهبة الامتحانات الوزارية</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                بيئة اختبارية حقيقية بمؤقت تنازلي وضغط مدروس يجعلك تدخل قاعة الامتحان مطمئناً وواثقاً.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>شروحات وحلول نموذجية فورية</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                بمجرد تسليم الامتحان تظهر لك خطوات الحل الصحيح والمفاهيم العلمية المرتبطة بكل مسألة.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'capabilities_and_traps',
      title: 'ماذا يمكنك أن تفعل داخل المنصة؟',
      subtitle: 'امتحانات معتمدة، كشف فخاخ التغليط، ومراجعة فورية',
      badge: 'القدرات والميزات',
      icon: BookOpen,
      color: 'indigo',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            توفر لك أريكسون منظومة تدريبية شاملة تغطي كافة متطلبات المنهاج الدراسي:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">امتحانات منهجية مقسمة حسب الوحدات والدروس</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  امتحانات في الفيزياء، الرياضيات، الكيمياء، الأحياء، واللغات بأسئلة اختيار من متعدد وصواب أو خطأ معتمدة.
                </p>
              </div>
            </div>

            {/* Traps Analysis Highlight */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-900/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <span>ميزة حصرية: كشف فخاخ التغليط (Distractor Traps)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold">ذكاء تعليمي</span>
                </h5>
                <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                  عند مراجعة الامتحان، ستشاهد تحليلاً يوضح لك: <strong className="font-bold">لماذا وضع واضع الامتحان الخيارات الخاطئة؟</strong> وما هو الفخ الشائع الذي يقع فيه الطلبة وكيف تتجنبه تماماً.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">إعادة تقديم الامتحانات لتحسين درجاتك</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  يمكنك إعادة أي امتحان لترسيخ المفاهيم التي أخطأت بها ورفع مجموع نقاطك وتصنيفك في لوحة الشرف.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'exams_and_points',
      title: 'كيف تعمل الامتحانات ونظام النقاط (XP)؟',
      subtitle: 'كل إجابة صحيحة تمنحك نقاطاً ترفع رصيدك التراكمي',
      badge: 'نظام النقاط والمؤقت',
      icon: Award,
      color: 'emerald',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
              <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <span className="font-bold text-xs text-slate-900 dark:text-white block">مؤقت زمني دقيق</span>
              <span className="text-[11px] text-slate-500">لكل امتحان وقت محدد وتنبيه صوتي وبصري عند اقتراب النهاية.</span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
              <Award className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
              <span className="font-bold text-xs text-slate-900 dark:text-white block">نقاط فورية معلنة</span>
              <span className="text-[11px] text-slate-500">كل سؤال يحمل نقاطاً محددة (5 أو 10 نقاط) تضاف فوراً لرصيدك.</span>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40">
              <Flame className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
              <span className="font-bold text-xs text-slate-900 dark:text-white block">معدل الدقة والنجاح</span>
              <span className="text-[11px] text-slate-500">يتم احتساب نسبة الإجابات الصحيحة لحساب معدلك العام.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>كيف تحسب النقاط في ملفك الشخصي؟</span>
            </h5>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
              <li><strong>الرصيد الإجمالي:</strong> يجمع كافة النقاط التي حققتها منذ تسجيلك بالمنصة.</li>
              <li><strong>الرصيد الأسبوعي والشهري:</strong> يتجدد دورياً ليمنح جميع الطلبة فرصة متساوية للمنافسة على صدارة الأسبوع والشهر.</li>
              <li><strong>الأسئلة الصحيحة:</strong> تحتسب في مؤشر الدقة، وتساعدك في معرفة نقاط قوتك وضعفك.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'leaderboard_and_ranking',
      title: 'لوحة الصدارة والتصنيف: كيف تتصدر القائمة؟',
      subtitle: 'تنافس بشرف مع نخبة طلبة التوجيهي على مستوى الوطن',
      badge: 'لوحة الشرف',
      icon: Trophy,
      color: 'amber',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span>معايير ترتيب لوحة الصدارة في أريكسون:</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              يتم ترتيب الطلبة تلقائياً ومباشرة وفق خوارزمية عادلة تعتمد على:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 font-semibold text-center border border-amber-200/50 dark:border-amber-800/40">
                1. مجموع النقاط المكتسبة
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 font-semibold text-center border border-amber-200/50 dark:border-amber-800/40">
                2. عدد الامتحانات المكتملة
              </div>
              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 font-semibold text-center border border-amber-200/50 dark:border-amber-800/40">
                3. نسبة الدقة وتفادي الأخطاء
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs text-slate-900 dark:text-white">🚀 نصائح عملية لرفع ترتيبك والوصول للمراكز الثلاثة الأولى:</h5>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>حل الامتحانات فور نشرها:</strong> الامتحانات الجديدة تمنحك قفزات سريعة في النقاط.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>لا تترك أي سؤال دون مراجعة:</strong> قراءة الشرح وفخاخ التغليط تحميك من تكرار الخطأ.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span><strong>حافظ على نشاطك اليومي:</strong> الطلبة الأكثر التزاماً هم الأوفر حظاً في الترتيب الأسبوعي.</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'home_screen_and_navigation',
      title: 'ماذا يظهر في الشاشة الرئيسية وكيف تتنقل؟',
      subtitle: 'نظرة سريعة على أقسام المنصة لتصل إلى كل ما تحتاجه بضغطة زر',
      badge: 'دليل الواجهة',
      icon: Home,
      color: 'blue',
      content: (
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>بطاقة الإحصائيات الحية (Home Stats)</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-normal">
                تعرض رصيدك الفعلي من النقاط، عدد الامتحانات المنجزة، وترتيبك بين أقرانك ببيانات متزامنة دائماً.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Compass className="w-4 h-4 text-purple-600" />
                <span>قائمة الامتحانات المقترحة والمباشرة</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-normal">
                اختيار سريع لأحدث الامتحانات مع وسم الصعوبة والمدة لبدء الاختبار فوراً دون بحث طويل.
              </p>
            </div>
          </div>

          {/* Navigation Bar Quick Guide */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 space-y-2">
            <h5 className="font-bold text-xs text-blue-900 dark:text-blue-200">أقسام شريط التنقل الرئيسي:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-blue-600">🏠 الرئيسية</span>
                <span className="text-[10px] text-slate-400">الملخص والمقترحات</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-blue-600">📝 الامتحانات</span>
                <span className="text-[10px] text-slate-400">كافة المواد والنتائج</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-blue-600">🏆 الصدارة</span>
                <span className="text-[10px] text-slate-400">ترتيب الأوائل</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-blue-600">👤 حسابي</span>
                <span className="text-[10px] text-slate-400">سجل إنجازاتك</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>أنت الآن جاهز تماماً لبدء رحلتك نحو التفوق في توجيهي 2009!</span>
            </p>
          </div>
        </div>
      ),
    },
  ];

  const current = TUTORIAL_STEPS[currentStep];
  const StepIcon = current.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      if (onNavigateToTab) {
        onNavigateToTab('exams');
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="student-tutorial-modal"
        className="bg-white dark:bg-[#0d121f] rounded-3xl max-w-2xl w-full border border-slate-200/90 dark:border-slate-800/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111726]/50">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
              {current.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="إغلاق الدليل"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Step Header */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-xs">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
                الخطوة {currentStep + 1} من {TUTORIAL_STEPS.length}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {current.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {current.subtitle}
              </p>
            </div>
          </div>

          {/* Step Dynamic Content */}
          <div className="pt-2">
            {current.content}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111726]/50 flex items-center justify-between gap-3">
          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((stepItem, idx) => (
              <button
                key={stepItem.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-6 bg-blue-600'
                    : idx < currentStep
                    ? 'w-2 bg-blue-400/80'
                    : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
                title={stepItem.title}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                تخطي الجولة
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <span>{isLastStep ? 'انطلق إلى الامتحانات الآن 🚀' : 'التالي'}</span>
              {!isLastStep && <ArrowLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
