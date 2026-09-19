import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { WelcomeAuth } from './components/WelcomeAuth';
import { OnboardingModal } from './components/OnboardingModal';
import { Header } from './components/Header';
import { LiveAnnouncementsBanner } from './components/LiveAnnouncementsBanner';
import { BottomNavigation } from './components/Navigation';
import { HomeDashboard } from './components/HomeDashboard';
import { ExamsView } from './components/ExamsView';
import { StoreView } from './components/store/StoreView';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { SettingsModal } from './components/SettingsModal';
import { StudentTutorialModal } from './components/StudentTutorialModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ChatModal } from './components/ChatModal';
import { UserSearchModal } from './components/UserSearchModal';
import { ConversationsDrawer } from './components/ConversationsDrawer';
import { AdminPanel } from './components/admin/AdminPanel';
import { Logo } from './components/Logo';
import { Loader2, AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';
import { seedFirstExamIfMissing } from './lib/examService';
import { markTutorialAsSeen } from './lib/firebase';
import { fetchUserProfileById } from './lib/socialService';
import type { NavigationTab, ExamAttempt, UserProfile, LeaderboardEntry } from './types';

function MainAppShell() {
  const { status, error, profile, refreshProfile, signOut } = useAuth();
  const { isAdmin, isCheckingAdmin } = useAdmin();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAdminModeActive, setIsAdminModeActive] = useState<boolean>(() => {
    return window.location.hash === '#admin' || window.location.search.includes('admin=true');
  });

  // Cross-tab exam viewing state
  const [examInitialAttempt, setExamInitialAttempt] = useState<ExamAttempt | null>(null);
  const [examInitialViewMode, setExamInitialViewMode] = useState<'list' | 'results' | 'review'>('list');

  // Social, Chat & Profile Modals
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isConversationsDrawerOpen, setIsConversationsDrawerOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<UserProfile | null>(null);

  const handleSelectLeaderboardUser = async (entry: LeaderboardEntry) => {
    try {
      const full = await fetchUserProfileById(entry.uid);
      if (full) {
        setSelectedUserProfile(full);
      } else {
        setSelectedUserProfile({
          uid: entry.uid,
          username: entry.username,
          displayName: entry.displayName,
          photoURL: entry.photoURL,
          role: entry.role,
          totalPoints: entry.points,
          weeklyPoints: 0,
          monthlyPoints: 0,
          examsCompleted: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          email: '',
          createdAt: '',
          updatedAt: '',
          lastActiveAt: '',
          equippedFrameId: entry.equippedFrameId,
          equippedNameEffectId: entry.equippedNameEffectId,
          equippedTitleId: entry.equippedTitleId,
          equippedThemeId: entry.equippedThemeId,
          featuredBadgeIds: entry.featuredBadgeIds,
        } as UserProfile);
      }
    } catch {
      // Ignore
    }
  };

  // Automatic tutorial launch for students who have not seen it yet
  useEffect(() => {
    if (status === 'authenticated' && profile) {
      const storageKey = `arixon_has_seen_tutorial_${profile.uid}`;
      const localSeen = localStorage.getItem(storageKey) === 'true';
      if (!profile.hasSeenTutorial && !localSeen) {
        setIsTutorialOpen(true);
      }
    }
  }, [status, profile?.uid, profile?.hasSeenTutorial]);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    if (profile?.uid) {
      const storageKey = `arixon_has_seen_tutorial_${profile.uid}`;
      localStorage.setItem(storageKey, 'true');
      markTutorialAsSeen(profile.uid).catch((err) => {
        console.warn('Tutorial sync notice:', err);
      });
    }
  };

  // URL hash sync for admin navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setIsAdminModeActive(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Seed default Tawjihi 2009 Physics Exam into Firestore once user profile is ready
  useEffect(() => {
    if (status === 'authenticated') {
      seedFirstExamIfMissing().catch(err => {
        console.warn('Initial exam seeding notice:', err);
      });
    }
  }, [status]);

  const handleViewAttemptFromProfile = (attempt: ExamAttempt) => {
    setExamInitialAttempt(attempt);
    setExamInitialViewMode('results');
    setCurrentTab('exams');
  };

  const handleOpenAdmin = () => {
    window.location.hash = '#admin';
    setIsAdminModeActive(true);
  };

  const handleExitAdmin = () => {
    if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname);
    }
    setIsAdminModeActive(false);
  };

  // 1. Initializing / Loading Auth
  if (status === 'initializing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" showTagline />
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جارٍ التحقق من جلسة المصادقة والمزامنة...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> First visit welcome screen
  if (status === 'unauthenticated') {
    return <WelcomeAuth />;
  }

  // 3. Authenticated but first time (needs onboarding)
  if (status === 'needs_profile_setup') {
    return <OnboardingModal />;
  }

  // 4. Critical Error State
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 text-center transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#111625] p-8 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">تعذر تحميل بيانات الحساب</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {error || 'حدث خطأ أثناء الاتصال بخدمة Firebase. يرجى إعادة المحاولة.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refreshProfile()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Admin Panel Mode (Strict Authorization Check)
  if (isAdminModeActive) {
    if (isCheckingAdmin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>جارٍ التحقق من الصلاحيات الإدارية...</span>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070a12] p-4 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#0c101c] p-8 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              منطقة إدارية مقيدة
            </h2>
            <p className="text-xs text-slate-500">
              عذراً، هذا القسم مخصص حصرياً للمشرفين المعتمدين والموثقين بصلاحيات Firebase Custom Claims.
            </p>
            <button
              onClick={handleExitAdmin}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              العودة لواجهة الطالب
            </button>
          </div>
        </div>
      );
    }

    return <AdminPanel onExitAdmin={handleExitAdmin} />;
  }

  // 6. Frozen / Suspended Account Screen (Students only, Admins bypass)
  if (profile?.accountDisabled && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070a12] p-4 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#0c101c] p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/40">
            <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              حساب مجمد ❄️
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              تم تجميد حسابك مؤقتاً
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              لقد تم تجميد حسابك من قبل إدارة منصة أريكسون. لا يمكنك تقديم الامتحانات أو المشاركة في لوحة الشرف حتى مراجعة الحساب.
            </p>
          </div>

          {/* Freeze Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#13192a] border border-slate-200 dark:border-slate-800 text-right space-y-2 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-400 font-medium">سبب التجميد:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-left max-w-[200px]">
                {profile.disabledReason || 'إجراء إداري / مراجعة حساب'}
              </span>
            </div>
            {profile.disabledAt && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-2">
                <span className="text-slate-400 font-medium">تاريخ التجميد:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                  {new Date(profile.disabledAt).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => refreshProfile()}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة فحص حالة الحساب</span>
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer"
            >
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. Authenticated with full student profile loaded
  return (
    <div className="min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Header */}
      <Header 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          if (tab !== 'exams') {
            setExamInitialAttempt(null);
            setExamInitialViewMode('list');
          }
          setCurrentTab(tab);
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onOpenSearch={() => setIsUserSearchOpen(true)}
        onOpenMessages={() => setIsConversationsDrawerOpen(true)}
      />

      {/* Real-time System Announcements & Competitive Challenges Banner */}
      <LiveAnnouncementsBanner onNavigate={setCurrentTab} />

      {/* Main Tab View Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {currentTab === 'home' && (
          <HomeDashboard 
            onNavigate={setCurrentTab} 
            onOpenTutorial={() => setIsTutorialOpen(true)} 
          />
        )}
        {currentTab === 'exams' && (
          <ExamsView 
            initialAttempt={examInitialAttempt}
            initialViewMode={examInitialViewMode}
            onResetView={() => {
              setExamInitialAttempt(null);
              setExamInitialViewMode('list');
            }}
          />
        )}
        {currentTab === 'store' && <StoreView onNavigateToAuth={() => {}} />}
        {currentTab === 'leaderboard' && (
          <LeaderboardView 
            onSelectUser={handleSelectLeaderboardUser}
            onOpenSearch={() => setIsUserSearchOpen(true)}
          />
        )}
        {currentTab === 'profile' && (
          <ProfileView 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            onViewAttempt={handleViewAttemptFromProfile}
            onOpenAdmin={handleOpenAdmin}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          if (tab !== 'exams') {
            setExamInitialAttempt(null);
            setExamInitialViewMode('list');
          }
          setCurrentTab(tab);
        }} 
      />

      {/* Global Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenAdmin={handleOpenAdmin}
        />
      )}

      {/* Interactive Student Tutorial Modal */}
      <StudentTutorialModal 
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onNavigateToTab={(tab) => {
          setExamInitialAttempt(null);
          setExamInitialViewMode('list');
          setCurrentTab(tab);
        }}
      />

      {/* User Search by Username Modal */}
      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onSelectUser={(u) => {
          setIsUserSearchOpen(false);
          setSelectedUserProfile(u);
        }}
        onStartChat={(u) => {
          setIsUserSearchOpen(false);
          setActiveChatUser(u);
        }}
      />

      {/* Conversations & Messages Drawer */}
      <ConversationsDrawer
        isOpen={isConversationsDrawerOpen}
        onClose={() => setIsConversationsDrawerOpen(false)}
        onOpenChat={(u) => {
          setIsConversationsDrawerOpen(false);
          setActiveChatUser(u);
        }}
        onOpenSearch={() => {
          setIsConversationsDrawerOpen(false);
          setIsUserSearchOpen(true);
        }}
      />

      {/* User Profile Modal with Social & Admin Controls */}
      {selectedUserProfile && (
        <UserProfileModal
          user={selectedUserProfile}
          isOpen={!!selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onStartChat={(u) => {
            setSelectedUserProfile(null);
            setActiveChatUser(u);
          }}
          onUserUpdated={(updated) => {
            setSelectedUserProfile(updated);
          }}
        />
      )}

      {/* 1-on-1 Chat Messaging Modal */}
      {activeChatUser && (
        <ChatModal
          recipient={activeChatUser}
          isOpen={!!activeChatUser}
          onClose={() => setActiveChatUser(null)}
          onViewProfile={(u) => {
            setActiveChatUser(null);
            setSelectedUserProfile(u);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <MainAppShell />
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
