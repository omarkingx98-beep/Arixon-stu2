import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Search,
  History,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { applyStudentOverrides } from '../../lib/studentOverrides';
import { safeFormatDate } from '../../lib/dateUtils';
import type { UserProfile, PointAdjustmentRecord } from '../../types';

export const AdminLeaderboardView: React.FC = () => {
  const [activeScope, setActiveScope] = useState<'all_time' | 'monthly' | 'weekly'>('all_time');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [adjustmentLogs, setAdjustmentLogs] = useState<PointAdjustmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeaderboardAndLogs = async () => {
    setIsLoading(true);
    const sortField = activeScope === 'monthly' ? 'monthlyPoints' : activeScope === 'weekly' ? 'weeklyPoints' : 'totalPoints';
    
    // 1. Fetch top students with fallback
    let list: UserProfile[] = [];
    try {
      try {
        const q = query(collection(db, 'users'), orderBy(sortField, 'desc'), limit(50));
        const snap = await getDocs(q);
        snap.forEach((d) => list.push({ uid: d.id, ...(d.data() as any) }));
      } catch (orderErr) {
        // Fallback without orderBy in case index or permissions vary
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((d) => list.push({ uid: d.id, ...(d.data() as any) }));
      }
    } catch (usersErr) {
      console.warn('[AdminLeaderboard] Firestore users query fallback:', usersErr);
    }

    // Apply student overrides so adjustments reflect immediately
    const updatedList = list.map((s) => applyStudentOverrides(s));
    updatedList.sort((a, b) => {
      const valA = Number((a as any)[sortField]) || 0;
      const valB = Number((b as any)[sortField]) || 0;
      return valB - valA;
    });
    setStudents(updatedList);

    // 2. Fetch adjustment audit logs with fallback to localStorage
    let logs: PointAdjustmentRecord[] = [];
    try {
      const adjQ = query(collection(db, 'pointAdjustments'), orderBy('createdAt', 'desc'), limit(20));
      const adjSnap = await getDocs(adjQ);
      adjSnap.forEach((d) => logs.push({ id: d.id, ...(d.data() as any) }));
    } catch (logsErr) {
      console.warn('[AdminLeaderboard] Point adjustments fetch fallback to local:', logsErr);
      try {
        const raw = localStorage.getItem('arixon_point_adjustments_local');
        if (raw) {
          logs = JSON.parse(raw);
        }
      } catch {}
    }
    setAdjustmentLogs(logs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeaderboardAndLogs();
  }, [activeScope]);

  useEffect(() => {
    const handleUpdate = () => {
      loadLeaderboardAndLogs();
    };
    window.addEventListener('arixon:student_updated', handleUpdate);
    return () => window.removeEventListener('arixon:student_updated', handleUpdate);
  }, [activeScope]);

  const filtered = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    return s.displayName?.toLowerCase().includes(term) || s.username?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>لوحة المتصدرين وإدارة النقاط</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة ترتيب أوائل فلسطين في توجيهي 2009 وسجل التعديلات الإدارية للنقاط
          </p>
        </div>

        {/* Scope selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
          <button
            onClick={() => setActiveScope('all_time')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScope === 'all_time' ? 'bg-white dark:bg-[#13192a] text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            الترتيب العام
          </button>
          <button
            onClick={() => setActiveScope('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScope === 'monthly' ? 'bg-white dark:bg-[#13192a] text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            المتصدرون هذا الشهر
          </button>
          <button
            onClick={() => setActiveScope('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeScope === 'weekly' ? 'bg-white dark:bg-[#13192a] text-blue-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            المتصدرون هذا الأسبوع
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              قائمة أفضل 50 طالب
            </span>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="تصفية حسب الاسم..."
                className="w-full pr-8 pl-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#111625] text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">الترتيب</th>
                  <th className="p-3.5">الطالب</th>
                  <th className="p-3.5">المحافظة</th>
                  <th className="p-3.5">النقاط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((s, idx) => {
                  const rank = idx + 1;
                  const pts = activeScope === 'monthly' ? (s.monthlyPoints || 0) : activeScope === 'weekly' ? (s.weeklyPoints || 0) : (s.totalPoints || 0);

                  return (
                    <tr key={s.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-black">
                        {rank === 1 ? (
                          <span className="text-amber-500 flex items-center gap-1 font-black">
                            <Trophy className="w-4 h-4" /> 1
                          </span>
                        ) : rank === 2 ? (
                          <span className="text-slate-400 flex items-center gap-1 font-black">
                            <Medal className="w-4 h-4" /> 2
                          </span>
                        ) : rank === 3 ? (
                          <span className="text-amber-700 flex items-center gap-1 font-black">
                            <Award className="w-4 h-4" /> 3
                          </span>
                        ) : (
                          <span className="text-slate-400">#{rank}</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.displayName || s.username}
                        </div>
                        <div className="text-[10px] text-slate-400">{s.branch || 'علمي'}</div>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {s.city || 'فلسطين'}
                      </td>

                      <td className="p-3.5 font-black text-amber-600 dark:text-amber-400">
                        {pts.toLocaleString()} نقطة
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Points Adjustment History (1 Col) */}
        <div className="bg-white dark:bg-[#0c101c] p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              سجل التعديلات الإدارية للنقاط
            </h2>
          </div>

          {adjustmentLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              لم تسجل أي تعديلات إدارية للنقاط حتى الآن.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 space-y-3">
              {adjustmentLogs.map((log) => (
                <div key={log.id} className="pt-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {log.studentName}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        log.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {log.amount > 0 ? `+${log.amount}` : log.amount} نقطة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    السبب: {log.reason}
                  </p>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>بواسطة: {log.adminName}</span>
                    <span>{safeFormatDate(log.createdAt, 'ar-EG')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
