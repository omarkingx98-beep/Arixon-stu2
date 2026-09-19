import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';
import { 
  Sun, 
  Moon, 
  AlertCircle, 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2,
  LogIn,
  UserPlus,
  ArrowRight
} from 'lucide-react';

export const WelcomeAuth: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset, 
    error, 
    clearError 
  } = useAuth();
  
  const { theme, toggleTheme } = useTheme();

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setLocalError(null);
      clearError();
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Submit
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setResetSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    if (mode === 'forgot') {
      try {
        setIsLoading(true);
        await sendPasswordReset(cleanEmail);
        setResetSuccessMessage(`تم إرسال رابط إعادة تعيين كلمة المرور إلى: ${cleanEmail}`);
      } catch (err: unknown) {
        console.error('Password reset failed:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!password) {
      setLocalError('يرجى إدخال كلمة المرور.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('يجب أن تتكون كلمة المرور من 6 خانات أو أحرف على الأقل.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('كلمتا المرور غير متطابقتين.');
        return;
      }

      try {
        setIsLoading(true);
        await signUpWithEmail(cleanEmail, password);
      } catch (err: unknown) {
        console.error('Sign up failed:', err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign In mode
      try {
        setIsLoading(true);
        await signInWithEmail(cleanEmail, password);
      } catch (err: unknown) {
        console.error('Sign in failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSwitchMode = (newMode: 'signin' | 'signup' | 'forgot') => {
    setMode(newMode);
    setLocalError(null);
    clearError();
    setResetSuccessMessage(null);
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        
        <button
          id="theme-toggle-welcome-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182032] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div 
            id="welcome-auth-card"
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#111625] shadow-xl shadow-slate-200/50 dark:shadow-black/60 p-6 sm:p-8 text-center"
          >
            {/* Wordmark & Tagline */}
            <h1 className="text-3xl font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight text-slate-900 dark:text-white mb-0.5">
              ARIXON
            </h1>
            <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans',sans-serif] tracking-wider mb-2">
              Learn. Compete. Improve.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              {mode === 'signin' && 'سجّل دخولك للمتابعة وحفظ درجاتك وترتيبك التنافسي'}
              {mode === 'signup' && 'أنشئ حسابك الجديد الآن للمنافسة في امتحانات التوجيهي'}
              {mode === 'forgot' && 'استعادة كلمة المرور عبر البريد الإلكتروني'}
            </p>

            {/* Error Message if Any */}
            {activeError && (
              <div 
                id="auth-error-alert" 
                className="mb-4 p-3.5 rounded-2xl text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-50/90 dark:bg-red-950/70 border border-red-200 dark:border-red-900/60 text-right flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                <span className="flex-1 leading-relaxed">{activeError}</span>
              </div>
            )}

            {/* Success Message for Password Reset */}
            {resetSuccessMessage && (
              <div 
                id="auth-success-alert" 
                className="mb-4 p-3.5 rounded-2xl text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/60 text-right flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
                <span className="flex-1 leading-relaxed">{resetSuccessMessage}</span>
              </div>
            )}

            {mode !== 'forgot' && (
              <>
                {/* 1. Google Sign-In Button */}
                <button
                  id="google-signin-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#182032] hover:bg-slate-50 dark:hover:bg-[#1e273d] text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>جارٍ التحقق...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 bg-white rounded-full p-0.5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>المتابعة باستخدام Google</span>
                    </>
                  )}
                </button>

                {/* Subtle Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-[#111625] px-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 absolute">
                    أو بالبريد الإلكتروني
                  </span>
                </div>
              </>
            )}

            {/* 2. Email & Password Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 text-right">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    dir="ltr"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeError) {
                        setLocalError(null);
                        clearError();
                      }
                    }}
                    placeholder="student@example.com"
                    className="w-full py-2.5 px-3.5 pl-10 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password Fields (Only in signin or signup mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      كلمة المرور
                    </label>
                    {mode === 'signin' && (
                      <button
                        id="forgot-password-link"
                        type="button"
                        onClick={() => handleSwitchMode('forgot')}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="auth-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (activeError) {
                          setLocalError(null);
                          clearError();
                        }
                      }}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pl-10 pr-10 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <button
                      id="toggle-password-visibility-btn"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (In Sign Up Mode Only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      id="auth-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (activeError) {
                          setLocalError(null);
                          clearError();
                        }
                      }}
                      placeholder="••••••••"
                      className="w-full py-2.5 px-3.5 pl-10 pr-10 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#182032] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="email-auth-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/25 dark:shadow-blue-500/20 transition-all transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer pt-3 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ المعالجة...</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>إرسال رابط إعادة التعيين</span>
                  </>
                )}
              </button>
            </form>

            {/* Links & Mode Switching */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
              {mode === 'signin' && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ليس لديك حساب؟{' '}
                  <button
                    id="switch-to-signup-link"
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    إنشاء حساب جديد
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  لديك حساب بالفعل؟{' '}
                  <button
                    id="switch-to-signin-link"
                    type="button"
                    onClick={() => handleSwitchMode('signin')}
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <button
                  id="back-to-signin-link"
                  type="button"
                  onClick={() => handleSwitchMode('signin')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لتسجيل الدخول</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/50 dark:border-slate-900">
        منصة Arixon التعليمية التنافسية © 2026 — مصممة لطلبة التوجيهي
      </footer>
    </div>
  );
};
