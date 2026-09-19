import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Award, 
  BookOpen, 
  Percent, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Flame, 
  Compass,
  Clock,
  ShoppingBag,
  Play,
  Coins,
  Palette
} from 'lucide-react';
import type { NavigationTab } from '../types';
import { 
  CosmeticAvatarFrame, 
  CosmeticNameEffect, 
  CosmeticTitle, 
  CosmeticBadgeList 
} from './CosmeticRenderer';

interface HomeDashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenTutorial?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, onOpenTutorial }) => {
  const { profile } = useAuth();

  // Real statistics strictly calculated from stored Firestore user data
  const competitionPoints = profile?.totalPoints ?? 0;
  const spendablePoints = typeof profile?.spendablePoints === 'number'
    ? profile.spendablePoints
    : (profile?.totalPoints ?? 0);
  const examsCompleted = profile?.examsCompleted ?? 0;
  const correctAnswers = profile?.correctAnswers ?? 0;
  const wrongAnswers = profile?.wrongAnswers ?? 0;
  const totalQuestionsAnswered = correctAnswers + wrongAnswers;

  const accuracyFormatted = totalQuestionsAnswered > 0 
    ? `${Math.round((correctAnswers / totalQuestionsAnswered) * 100)}%`
    : '0%';

  const rankFormatted = competitionPoints > 0 ? 'نشط' : 'غير مصنّف';

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {profile && (
            <CosmeticAvatarFrame
              photoURL={profile.photoURL}
              displayName={profile.displayName || profile.username}
              frameId={profile.equippedFrameId}
              size="md"
            />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                مرحبًا،{' '}
                <CosmeticNameEffect effectId={profile?.equippedNameEffectId}>
                  {profile?.displayName || profile?.username}
                </CosmeticNameEffect>{' '}
                👋
              </h1>
              {profile?.equippedTitleId && (
                <CosmeticTitle titleId={profile.equippedTitleId} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                جيل 2009 — طريقك نحو التفوق والتميز التنافسي يبدأ هنا
              </p>
              {profile?.featuredBadgeIds && profile.featuredBadgeIds.length > 0 && (
                <CosmeticBadgeList badgeIds={profile.featuredBadgeIds} />
              )}
            </div>
          </div>
        </div>

        {/* Tawjihi 2009 Badge & Customizer Shortcut */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('store')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{spendablePoints.toLocaleString()} نقطة شراء</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>توجيهي 2009</span>
          </div>
        </div>
      </div>

      {/* Interactive Platform Guide Card */}
      {onOpenTutorial && (
        <div 
          id="home-tutorial-guide-card"
          className="p-4 sm:p-5 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 dark:from-blue-950/40 dark:via-slate-900/40 dark:to-blue-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                دليل منصة أريكسون لطلبة توجيهي 2009
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تعرف على كيفية تقديم الامتحانات، حصد النقاط، كشف فخاخ التغليط، وتصدر لوحة الشرف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTutorial}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs self-end sm:self-auto cursor-pointer"
          >
            <span>شاهد الدليل التفاعلي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real Compact Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Competition Points (Rank) */}
        <div 
          id="stat-points-card"
          className="p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-white dark:bg-[#111625] shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">نقاط التنافس 🏆</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {competitionPoints.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {competitionPoints === 0 ? 'ابدأ بحل الامتحانات' : 'ثابتة للائحة الشرف'}
          </div>
        </div>

        {/* Spendable Points (Store) */}
        <div 
          id="stat-spendable-card"
          onClick={() => onNavigate('store')}
          className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-[#111625] shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">رصيد الشراء 🪙</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {spendablePoints.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            تصفح متجر المظاهر والعتاد ←
          </div>
        </div>

        {/* Exams */}
        <div 
          id="stat-exams-card"
          className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">الاختبارات</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {examsCompleted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {examsCompleted === 0 ? '0 اختبار منجز' : 'امتحان تم تسليمه'}
          </div>
        </div>

        {/* Accuracy */}
        <div 
          id="stat-accuracy-card"
          className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-semibold">نسبة الدقة</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
            {accuracyFormatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalQuestionsAnswered === 0 ? 'لا توجد إجابات بعد' : `${correctAnswers} إجابة صحيحة`}
          </div>
        </div>
      </div>

      {/* Hero Action Card */}
      <div 
        id="home-hero-banner"
        className="relative overflow-hidden rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 shadow-lg shadow-blue-500/10"
      >
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>امتحان الفيزياء متاح الآن — الزخم الخطي والدفع</span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight mb-2">
            مستعد تتحدى نفسك في أول امتحان؟
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed mb-6">
            منظومة امتحانات Arixon التنافسية تتيح لك اختبار مستواك الحقيقي في منهاج التوجيهي (2009) بأسئلة دقيقة، مؤقت زمني وتصحيح تلقائي لحصد النقاط والصعود في لوحة الشرف.
          </p>

          <button
            id="home-start-exam-btn"
            onClick={() => onNavigate('exams')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>ابدأ الامتحان الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient Decorative Graphic */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Arixon Store Discovery Banner */}
      <div 
        id="home-store-banner"
        className="p-5 sm:p-6 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 dark:from-emerald-950/40 dark:via-slate-900/40 dark:to-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                متجر Arixon لطلبة التوجيهي
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                جديد المتجر
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              دوسيات التأسيس والمكثفات الوزارية الشاملة، ملخصات القوانين المركزة، وبطاقات الشحن مع إمكانية الدفع عند الاستلام أو تحويل CliQ والتوصيل لكافة محافظات المملكة.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('store')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 self-end sm:self-auto cursor-pointer"
        >
          <span>تصفح المتجر</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tawjihi 2009 Roadmap Section */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              خارطة طريق منصة Arixon لجيل 2009
            </h3>
          </div>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
            منظومة الامتحانات نشطة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold">
                ✓
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. الهوية وتأمين الحساب
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              توثيق Google الحقيقي، ملف شخصي آمن ومحفوظ في Firebase، ودعم الوضعين الفاتح والداكن.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                ✓
              </span>
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                2. محرك الامتحانات التنافسية
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              بنك أسئلة الوزارة لجيل 2009، توقيت ذكي، تصحيح فوري برمجياً وشرح تفصيلي لكل مسألة.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                3. التحديات والمواجهات
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              منافسات مباشرة مع الأصدقاء، دوري أسبوعي لطلبة المحافظات، وشارات إنجاز للمتفوقين.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
