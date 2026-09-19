import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../Logo';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  Trophy,
  Bell,
  Swords,
  BarChart3,
  Sparkles,
  ShoppingBag,
  ClipboardList,
  Settings,
  ShieldCheck,
  UserCheck,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { AdminTab } from '../../types';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onExitAdmin,
  children,
}) => {
  const { adminProfile, isSuperAdmin, isOwner } = useAdmin();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'exams', label: 'إدارة الامتحانات', icon: BookOpen },
    { id: 'questions', label: 'بنك الأسئلة', icon: FileQuestion },
    { id: 'students', label: 'إدارة الطلاب', icon: Users },
    { id: 'leaderboard', label: 'المتصدرين والنقاط', icon: Trophy },
    { id: 'announcements', label: 'الإعلانات والتعميمات', icon: Bell },
    { id: 'challenges', label: 'التحديات التنافسية', icon: Swords },
    { id: 'store', label: 'متجر Arixon والطلبات', icon: ShoppingBag },
    { id: 'analytics', label: 'التحليلات المتقدمة', icon: BarChart3 },
    { id: 'ai-builder', label: 'منشئ الأسئلة الذكي', icon: Sparkles },
    { id: 'audit-logs', label: 'سجل العمليات والرقابة', icon: ClipboardList },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings },
    { id: 'profile', label: 'الملف الإداري', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-l border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c101c] shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={false} />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                لوحة التحكم الإدارية
              </span>
            </div>
          </div>
          {isOwner ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              <span>مالك الموقع</span>
            </span>
          ) : isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>سوبر أدمن</span>
            </span>
          ) : null}
        </div>

        {/* Admin User Mini Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-100/80 dark:bg-[#13192a] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${isOwner ? 'bg-gradient-to-tr from-rose-600 to-red-700' : 'bg-gradient-to-tr from-blue-600 to-indigo-600'} text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm`}>
            {adminProfile?.displayName ? adminProfile.displayName.charAt(0) : 'O'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
              {adminProfile?.displayName || 'Omar King'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {adminProfile?.email || 'omarkingx99@gmail.com'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              <span>العودة لمنصة الطلاب</span>
            </span>
            <span className="text-[10px] text-slate-400">واجهة الطالب</span>
          </button>

          <div className="flex items-center gap-1 pt-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={theme === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
              <span>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0c101c] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo size="sm" showTagline={false} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExitAdmin}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5"
          >
            <span>خروج</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#0c101c] h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size="sm" showTagline={false} />
                <span className="text-xs font-bold text-blue-600">لوحة الإدارة</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile snapshot */}
            <div className="p-3 mx-3 my-2 rounded-xl bg-slate-100 dark:bg-[#13192a] border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold">{adminProfile?.displayName || 'Omar King X99'}</div>
              <div className="text-[10px] text-slate-500">{adminProfile?.email || 'omarkingx99@gmail.com'}</div>
              <div className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                الدور: Super Admin
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExitAdmin();
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لمنصة الطلاب</span>
              </button>
              <button
                onClick={() => signOut()}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
};
