import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard } from '../lib/firebase';
import type { LeaderboardEntry } from '../types';
import { Trophy, Medal, Award, Flame, Sparkles, Loader2, Search } from 'lucide-react';
import { 
  CosmeticAvatarFrame, 
  CosmeticNameEffect, 
  CosmeticTitle, 
  CosmeticBadgeList 
} from './CosmeticRenderer';
import { RoleBadge } from './RoleBadge';

interface LeaderboardViewProps {
  onSelectUser?: (entry: LeaderboardEntry) => void;
  onOpenSearch?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onSelectUser,
  onOpenSearch,
}) => {
  const { profile, user } = useAuth();
  const [period, setPeriod] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLeaderboard() {
      setIsLoading(true);
      try {
        const data = await fetchLeaderboard(period);
        if (isMounted) {
          // Flag current user
          const mapped = data.map((entry) => ({
            ...entry,
            isCurrentUser: user ? entry.uid === user.uid : false,
          }));
          setEntries(mapped);
        }
      } catch (err) {
        console.error('Leaderboard query error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [period, user]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              لوحة الصدارة والتصنيف
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              جيل 2009
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            تنافس بنزاهة مع نخبة طلبة التوجيهي واصعد نحو القمة، واضغط على أي ملف للمراسلة أو إضافة صديق
          </p>
        </div>

        {onOpenSearch && (
          <button
            id="leaderboard-search-users-btn"
            onClick={onOpenSearch}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>بحث عن طلاب باليوزر</span>
          </button>
        )}
      </div>

      {/* Tabs: الترتيب العام / الأسبوعي / الشهري */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 max-w-md">
        {[
          { id: 'all' as const, label: 'الترتيب العام' },
          { id: 'weekly' as const, label: 'الأسبوعي' },
          { id: 'monthly' as const, label: 'الشهري' },
        ].map((tab) => {
          const isActive = period === tab.id;
          return (
            <button
              key={tab.id}
              id={`leaderboard-tab-${tab.id}`}
              onClick={() => setPeriod(tab.id)}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-xs">جارٍ جلب الترتيب المباشر من قاعدة البيانات...</span>
        </div>
      )}

      {/* Empty State when no real scores exist yet */}
      {!isLoading && entries.length === 0 && (
        <div
          id="leaderboard-empty-state"
          className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto my-4"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center text-amber-500">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            لسه ما في ترتيب، كن أول من يبدأ 🔥
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            لم يحصل أي طالب على نقاط في هذا التصنيف بعد. عند إكمال امتحانات الفيزياء وحل الاختبارات التنافسية، ستظهر أسماء المتصدرين الحقيقيين هنا تلقائياً!
          </p>

          {/* Current User Card indicator */}
          {profile && (
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CosmeticAvatarFrame
                    photoURL={profile.photoURL}
                    displayName={profile.displayName || profile.username}
                    frameId={profile.equippedFrameId}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        <CosmeticNameEffect effectId={profile.equippedNameEffectId}>
                          {profile.displayName}
                        </CosmeticNameEffect>
                      </h4>
                      {profile.equippedTitleId && (
                        <CosmeticTitle titleId={profile.equippedTitleId} />
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                      @{profile.username}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400 block">نقاط التنافس الحالية</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {profile.totalPoints.toLocaleString()} نقطة
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Leaderboard List */}
      {!isLoading && entries.length > 0 && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#111625] overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">
            <div className="col-span-2 sm:col-span-1 text-center">المركز</div>
            <div className="col-span-7 sm:col-span-8">اسم المستخدم</div>
            <div className="col-span-3 text-left">النقاط</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {entries.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;

              return (
                <div
                  key={entry.uid}
                  id={`leaderboard-row-${entry.uid}`}
                  onClick={() => onSelectUser && onSelectUser(entry)}
                  title="اضغط لعرض الملف الشخصي، المراسلة أو إضافة صديق"
                  className={`grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 transition-colors cursor-pointer group ${
                    entry.isCurrentUser
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-r-4 border-r-blue-600'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                    {isFirst ? (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm">
                        1
                      </span>
                    ) : isSecond ? (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs">
                        2
                      </span>
                    ) : isThird ? (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Username & Avatar */}
                  <div className="col-span-7 sm:col-span-8 flex items-center gap-3">
                    <CosmeticAvatarFrame
                      photoURL={entry.photoURL}
                      displayName={entry.displayName || entry.username}
                      frameId={entry.equippedFrameId}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <CosmeticNameEffect effectId={entry.equippedNameEffectId}>
                            {entry.displayName || entry.username}
                          </CosmeticNameEffect>
                        </span>
                        {/* Role Badge (Green star for admin) */}
                        <RoleBadge role={entry.role} size="sm" />
                        {entry.equippedTitleId && (
                          <CosmeticTitle titleId={entry.equippedTitleId} />
                        )}
                        {entry.isCurrentUser && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white flex-shrink-0">
                            أنت
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                          @{entry.username}
                        </span>
                        {entry.featuredBadgeIds && entry.featuredBadgeIds.length > 0 && (
                          <CosmeticBadgeList badgeIds={entry.featuredBadgeIds} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="col-span-3 text-left">
                    <span className="font-black text-sm sm:text-base font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-white">
                      {entry.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">نقطة</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
