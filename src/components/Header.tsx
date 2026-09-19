import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Sun, 
  Moon, 
  Settings, 
  Home, 
  BookOpen, 
  ShoppingBag,
  Trophy, 
  User, 
  ShieldCheck, 
  Sparkles,
  Bell,
  Megaphone,
  Flame,
  X,
  Coins,
  Search,
  MessageCircle,
} from 'lucide-react';
import type { NavigationTab, Announcement, Challenge } from '../types';
import { CosmeticAvatarFrame } from './CosmeticRenderer';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenTutorial?: () => void;
  onOpenAdmin?: () => void;
  onOpenSearch?: () => void;
  onOpenMessages?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenSettings,
  onOpenTutorial,
  onOpenAdmin,
  onOpenSearch,
  onOpenMessages,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();
  const { isAdmin } = useAdmin();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);

  // Listen to unread messages across conversations
  useEffect(() => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          let totalUnread = 0;
          snap.forEach((d) => {
            const data = d.data();
            const unreadForMe = Number(data?.unreadCount?.[user.uid]) || 0;
            if (unreadForMe > 0) totalUnread += unreadForMe;
          });
          setUnreadMsgCount(totalUnread);
        },
        (_err) => {
          // Graceful fallback for unread conversations listener
        }
      );
      return () => unsubscribe();
    } catch {}
  }, [user]);

  // Listen to active announcements
  useEffect(() => {
    try {
      const q = query(collection(db, 'announcements'), where('published', '==', true));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: Announcement[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }));
          setAnnouncements(list);
        },
        (_err) => {
          // Graceful fallback for announcements listener
        }
      );
      return () => unsubscribe();
    } catch {}
  }, []);

  // Listen to active challenges
  useEffect(() => {
    try {
      const q = query(collection(db, 'challenges'), where('status', '==', 'active'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          const list: Challenge[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Challenge, 'id'>) }));
          setChallenges(list);
        },
        (_err) => {
          // Graceful fallback for challenges listener
        }
      );
      return () => unsubscribe();
    } catch {}
  }, []);

  const totalNotifs = announcements.length + challenges.length;

  const navItems = [
    { id: 'home' as const, label: 'الرئيسية', icon: Home },
    { id: 'exams' as const, label: 'الامتحانات', icon: BookOpen },
    { id: 'store' as const, label: 'المتجر', icon: ShoppingBag },
    { id: 'leaderboard' as const, label: 'الترتيب', icon: Trophy },
    { id: 'profile' as const, label: 'ملفي', icon: User },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onTabChange('home')} 
          className="cursor-pointer"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`desktop-nav-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Icons: Theme Toggle & Settings */}
        <div className="flex items-center gap-2">
          {/* User Search by Username Button */}
          {onOpenSearch && (
            <button
              id="user-search-header-btn"
              onClick={onOpenSearch}
              aria-label="البحث عن طلاب باليوزر"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              title="البحث عن طلاب باليوزر"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Direct Messages Drawer Button */}
          {onOpenMessages && (
            <button
              id="messages-header-btn"
              onClick={onOpenMessages}
              aria-label="المحادثات المباشرة"
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              title="المحادثات والرسائل المباشرة"
            >
              <MessageCircle className="w-4 h-4" />
              {unreadMsgCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white shadow-xs animate-pulse">
                  {unreadMsgCount}
                </span>
              )}
            </button>
          )}

          {/* Tutorial / Platform Guide Button */}
          {onOpenTutorial && (
            <button
              id="tutorial-header-btn"
              onClick={onOpenTutorial}
              aria-label="دليل المنصة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="جولة في منصة أريكسون"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">دليل أريكسون</span>
            </button>
          )}

          {/* Admin Portal Shortcut Button for Authorized Admins */}
          {isAdmin && onOpenAdmin && (
            <button
              id="admin-portal-header-btn"
              onClick={onOpenAdmin}
              aria-label="لوحة الإدارة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="لوحة تحكم المشرف العام"
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">الإدارة</span>
            </button>
          )}

          {/* Notification Bell with Live Badge */}
          <div className="relative">
            <button
              id="notifications-bell-btn"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="الإشعارات والإعلانات"
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
              title="الإشعارات والتعميمات والتحديات"
            >
              <Bell className="w-4 h-4" />
              {totalNotifs > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-bounce">
                  {totalNotifs}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {isNotifOpen && (
              <div 
                id="notifications-popover-menu"
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#0c101c] border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      مركز الإعلانات والتحديات
                    </span>
                  </div>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {totalNotifs === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    لا توجد إعلانات أو تحديات جديدة حالياً
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {challenges.map((c) => (
                      <div 
                        key={c.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          onTabChange('exams');
                        }}
                        className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 cursor-pointer hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-amber-500" />
                            تحدٍ تنافسي
                          </span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200">
                            +{c.points} نقطة
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {c.description}
                        </p>
                      </div>
                    ))}

                    {announcements.map((a) => (
                      <div 
                        key={a.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-[#13192a] border border-slate-200/80 dark:border-slate-800/80"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-black ${
                            a.priority === 'high' ? 'text-rose-600' : 'text-blue-600'
                          } flex items-center gap-1`}>
                            <Megaphone className="w-3 h-3" />
                            {a.priority === 'high' ? 'إعلان عاجل' : 'إعلان منصة'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(a.publishedAt || a.createdAt).toLocaleDateString('ar-JO')}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {a.title}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-line mt-1 leading-relaxed">
                          {a.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Theme Toggle */}
          <button
            id="theme-toggle-header-btn"
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Settings Trigger */}
          <button
            id="settings-header-btn"
            onClick={onOpenSettings}
            aria-label="الإعدادات"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick Points Indicator & Avatar */}
          {profile && (
            <div className="flex items-center gap-1.5">
              {/* Spendable Points Shortcut */}
              <button
                id="header-spendable-points-btn"
                onClick={() => onTabChange('store')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-black hover:bg-amber-100 transition-colors cursor-pointer"
                title="نقاط الشراء الخاصة بك"
              >
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {(typeof profile.spendablePoints === 'number' ? profile.spendablePoints : profile.totalPoints).toLocaleString()}
                </span>
              </button>

              {/* User Avatar Mini Pill with Equipped Frame */}
              <button
                id="header-user-avatar-btn"
                onClick={() => onTabChange('profile')}
                className="flex items-center gap-2 pl-2.5 pr-1 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer"
              >
                <CosmeticAvatarFrame
                  photoURL={profile.photoURL}
                  displayName={profile.username}
                  frameId={profile.equippedFrameId}
                  size="sm"
                />
                <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                  {profile.username}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
