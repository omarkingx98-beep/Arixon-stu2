import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { 
  X, 
  Sun, 
  Moon, 
  Languages, 
  LogOut, 
  ShieldCheck, 
  Info, 
  Check, 
  ChevronLeft,
  Lock,
  Sparkles,
  Loader2,
  Shield,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onOpenTutorial?: () => void;
  onOpenAdmin?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  onOpenTutorial,
  onOpenAdmin 
}) => {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useAdmin();

  const [activeSubView, setActiveSubView] = useState<'main' | 'privacy' | 'about'>('main');
  const [selectedLanguage, setSelectedLanguage] = useState<'ar' | 'en'>('ar');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      onClose();
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        id="settings-dialog-card"
        className="w-full max-w-md bg-white dark:bg-[#111625] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            {activeSubView !== 'main' && (
              <button
                onClick={() => setActiveSubView('main')}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            )}
            <h3 className="font-bold text-lg">
              {activeSubView === 'main' && 'الإعدادات'}
              {activeSubView === 'privacy' && 'سياسة الخصوصية'}
              {activeSubView === 'about' && 'حول منصة Arixon'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق الإعدادات"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN VIEW */}
        {activeSubView === 'main' && (
          <div className="space-y-5">
            {/* Appearance Section */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                المظهر (Theme)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="theme-light-btn"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>فاتح (Theme A)</span>
                  {theme === 'light' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  id="theme-dark-btn"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-slate-800 text-blue-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>داكن (Theme B)</span>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Language Section */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                اللغة (Language)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="lang-ar-btn"
                  onClick={() => setSelectedLanguage('ar')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedLanguage === 'ar'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>العربية (الأساسية)</span>
                  {selectedLanguage === 'ar' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  id="lang-en-btn"
                  onClick={() => setSelectedLanguage('en')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    selectedLanguage === 'en'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>English</span>
                  {selectedLanguage === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                الواجهة مهيأة هيكلياً بالكامل للغتين، واللغة العربية هي المعتمدة رسمياً لمناهج التوجيهي.
              </p>
            </div>

            {/* Links to Privacy & About */}
            <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              {onOpenTutorial && (
                <button
                  id="open-tutorial-from-settings-btn"
                  onClick={() => {
                    onClose();
                    onOpenTutorial();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors text-sm font-semibold cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>دليل منصة أريكسون والجولة التفاعلية</span>
                  </div>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                id="open-privacy-policy-btn"
                onClick={() => setActiveSubView('privacy')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>سياسة الخصوصية وحماية البيانات</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>

              <button
                id="open-about-arixon-btn"
                onClick={() => setActiveSubView('about')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>حول منصة Arixon وتوجيهي 2009</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Admin Portal Shortcut if current user is an Admin */}
            {isAdmin && onOpenAdmin && (
              <div className="pt-1">
                <button
                  id="open-admin-from-settings-btn"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm font-bold transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <span>لوحة التحكم الإدارية (Super Admin)</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-amber-500" />
                </button>
              </div>
            )}

            {/* Logout Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="logout-btn"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ تسجيل الخروج...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج من الحساب</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                بياناتك وملفك الشخصي ونقاطك ستبقى محفوظة بأمان على Firebase لتسجيل دخولك القادم.
              </p>
            </div>
          </div>
        )}

        {/* SUB-VIEW: Privacy Policy */}
        {activeSubView === 'privacy' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-200">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>التزام الخصوصية الصارم في Arixon</span>
              </div>
              <p className="text-xs">
                نحن نعتبر خصوصية الطالب وأمان بياناته أولوية قصوى منذ اليوم الأول.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">1. ما يظهر للعامة ولوحة الصدارة:</h4>
              <p>
                اسم المستخدم (Username)، الاسم المعروض، الصورة الرمزية، والنقاط المكتسبة من الامتحانات فقط.
              </p>

              <h4 className="font-bold text-slate-900 dark:text-white">2. ما يبقى سرياً ومحمياً تماماً:</h4>
              <p>
                البريد الإلكتروني، الجنس (Gender لا يظهر مطلقاً في لوحات الصدارة)، العمر، ورقم أو مجموعة الواتساب. هذه البيانات مرئية لك وحدك في صفحة ملفك الشخصي.
              </p>

              <h4 className="font-bold text-slate-900 dark:text-white">3. أمان السحابة:</h4>
              <p>
                جميع الحسابات محمية بواسطة Firebase Authentication وFirestore Security Rules لضمان عدم إمكانية تعديل بيانات أي طالب من قبل مستخدم آخر.
              </p>
            </div>

            <button
              onClick={() => setActiveSubView('main')}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              العودة للإعدادات
            </button>
          </div>
        )}

        {/* SUB-VIEW: About Arixon */}
        {activeSubView === 'about' && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                منصة Arixon (أريكسون)
              </h4>
            </div>

            <p>
              Arixon هي منصة تعليمية تنافسية حديثة مصممة خصيصاً لطلبة التوجيهي (جيل 2009). تهدف المنصة إلى تحويل تجربة الدراسة من روتين تقليدي ممل إلى ساحة تحدٍ وتنافس ذكي وممتع.
            </p>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                شعار المنصة:
              </div>
              <div className="text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans',sans-serif] font-bold">
                Learn. Compete. Improve.
              </div>
              <div className="text-xs text-slate-400">
                تعلّم بذكاء • نافس بنزاهة • تطوّر باستمرار
              </div>
            </div>

            <div className="text-xs text-slate-400">
              الإصدار: 1.0 (Phase 1 Foundation) • 2026
            </div>

            <button
              onClick={() => setActiveSubView('main')}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              العودة للإعدادات
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
