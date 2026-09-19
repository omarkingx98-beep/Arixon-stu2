import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeFormatDate, safeGetTime } from '../lib/dateUtils';
import type { Announcement, Challenge, NavigationTab } from '../types';
import { 
  Megaphone, 
  Flame, 
  X, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Calendar, 
  ArrowLeft,
  Bell
} from 'lucide-react';

interface LiveAnnouncementsBannerProps {
  onNavigate?: (tab: NavigationTab) => void;
}

export const LiveAnnouncementsBanner: React.FC<LiveAnnouncementsBannerProps> = ({ onNavigate }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('arixon_dismissed_alerts') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Real-time listener for published announcements
  useEffect(() => {
    try {
      const qAnn = query(collection(db, 'announcements'), where('published', '==', true));
      const unsubscribe = onSnapshot(
        qAnn,
        (snapshot) => {
          const list: Announcement[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) });
          });
          // Sort by publishedAt or createdAt desc safely
          list.sort((a, b) => safeGetTime(b.publishedAt || b.createdAt) - safeGetTime(a.publishedAt || a.createdAt));
          setAnnouncements(list);
        },
        (err) => {
          console.warn('[LiveAnnouncements] Real-time listener fallback:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish real-time announcement listener:', e);
    }
  }, []);

  // Real-time listener for active challenges
  useEffect(() => {
    try {
      const qChal = query(collection(db, 'challenges'), where('status', '==', 'active'));
      const unsubscribe = onSnapshot(
        qChal,
        (snapshot) => {
          const list: Challenge[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...(d.data() as Omit<Challenge, 'id'>) });
          });
          list.sort((a, b) => safeGetTime(b.createdAt) - safeGetTime(a.createdAt));
          setChallenges(list);
        },
        (err) => {
          console.warn('[LiveChallenges] Real-time listener fallback:', err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish real-time challenges listener:', e);
    }
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('arixon_dismissed_alerts', JSON.stringify(updated));
    } catch {}
  };

  // Find top active item not dismissed
  const activeAnnouncement = announcements.find((a) => !dismissedIds.includes(a.id));
  const activeChallenge = challenges.find((c) => !dismissedIds.includes(c.id));

  if (!activeAnnouncement && !activeChallenge) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 space-y-2">
        {/* 1. Live Challenge Banner */}
        {activeChallenge && (
          <div 
            id="live-challenge-banner"
            onClick={() => setSelectedChallenge(activeChallenge)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border border-amber-500/30 dark:border-amber-500/40 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:border-amber-500/60 transition-all"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs animate-pulse">
                <Flame className="w-4 h-4 fill-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    تحدٍ تنافسي نشط 🔥
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {activeChallenge.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                  {activeChallenge.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <Award className="w-3.5 h-3.5" />
                <span>+{activeChallenge.points} نقطة</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigate) onNavigate('exams');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>خُض التحدي</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDismiss(activeChallenge.id, e)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="إخفاء مؤقت"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Live Announcement Banner */}
        {activeAnnouncement && (
          <div 
            id="live-announcement-banner"
            onClick={() => setSelectedAnnouncement(activeAnnouncement)}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/15 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-blue-500/30 dark:border-blue-500/40 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:border-blue-500/60 transition-all"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    activeAnnouncement.priority === 'high'
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      : 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  }`}>
                    {activeAnnouncement.priority === 'high' ? 'إعلان عاجل ومهم 📢' : 'إعلان منصة أريكسون 📢'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {activeAnnouncement.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">
                  {activeAnnouncement.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(activeAnnouncement)}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>التفاصيل</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDismiss(activeAnnouncement.id, e)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="إخفاء مؤقت"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    selectedAnnouncement.priority === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}>
                    {selectedAnnouncement.priority === 'high' ? 'إعلان عاجل' : 'إعلان رسمي'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {selectedAnnouncement.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedAnnouncement.image && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-56">
                <img 
                  src={selectedAnnouncement.image} 
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="bg-slate-50 dark:bg-[#13192a] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {selectedAnnouncement.content}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>تاريخ النشر: {safeFormatDate(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt, 'ar-JO')}</span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    تحدٍ أكاديمي نشط
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {selectedChallenge.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                <span>الجائزة التنافسية:</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  +{selectedChallenge.points} نقطة
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {selectedChallenge.description}
              </div>
            </div>

            {selectedChallenge.requirements && (
              <div className="text-xs text-slate-600 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-[#13192a]">
                <strong className="block text-slate-800 dark:text-slate-200 mb-1">شروط ومعايير التحدي:</strong>
                {selectedChallenge.requirements}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedChallenge(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedChallenge(null);
                  if (onNavigate) onNavigate('exams');
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>الانتقال للامتحانات وبدء التحدي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
