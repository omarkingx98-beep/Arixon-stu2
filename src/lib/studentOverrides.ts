import type { UserProfile } from '../types';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'arixon_student_overrides_v1';

export interface StudentOverrideData {
  totalPoints?: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  competitionPoints?: number;
  role?: string;
  roleTitleAr?: string;
  updatedAt?: string;
  lastAdjustReason?: string;
}

// In-memory cache for ultra-fast lookups
const memoryCache: Record<string, StudentOverrideData> = {};
let isHydrated = false;

function hydrateFromLocalStorage(): void {
  if (isHydrated || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(memoryCache, parsed);
      }
    }
  } catch (err) {
    console.warn('[Overrides] Error loading cached overrides:', err);
  } finally {
    isHydrated = true;
  }
}

function persistToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (err) {
    console.warn('[Overrides] Error saving overrides to localStorage:', err);
  }
}

/**
 * Apply local / admin overrides to any UserProfile document
 */
export function applyStudentOverrides<T extends Partial<UserProfile>>(user: T): T {
  if (!user || !user.uid) return user;
  hydrateFromLocalStorage();

  const override = memoryCache[user.uid];
  if (!override) return user;

  return {
    ...user,
    ...(override.totalPoints !== undefined ? { totalPoints: override.totalPoints } : {}),
    ...(override.competitionPoints !== undefined ? { competitionPoints: override.competitionPoints } : {}),
    ...(override.weeklyPoints !== undefined ? { weeklyPoints: override.weeklyPoints } : {}),
    ...(override.monthlyPoints !== undefined ? { monthlyPoints: override.monthlyPoints } : {}),
    ...(override.role !== undefined ? { role: override.role } : {}),
  };
}

/**
 * Save points adjustment override
 */
export function saveStudentPointsOverride(
  studentId: string,
  data: { previous: number; next: number; delta: number; reason: string }
): void {
  hydrateFromLocalStorage();

  const current = memoryCache[studentId] || {};
  const currentWeekly = typeof current.weeklyPoints === 'number' ? current.weeklyPoints : 0;
  const currentMonthly = typeof current.monthlyPoints === 'number' ? current.monthlyPoints : 0;

  memoryCache[studentId] = {
    ...current,
    totalPoints: data.next,
    competitionPoints: data.next,
    weeklyPoints: Math.max(0, currentWeekly + data.delta),
    monthlyPoints: Math.max(0, currentMonthly + data.delta),
    lastAdjustReason: data.reason,
    updatedAt: new Date().toISOString(),
  };

  persistToLocalStorage();

  // Try to sync to the admin's own document subcollection in Firestore (allowed because admin owns their own doc)
  const currentAdmin = auth.currentUser;
  if (currentAdmin && currentAdmin.uid) {
    try {
      const ref = doc(db, 'users', currentAdmin.uid, 'adminStudentOverrides', studentId);
      setDoc(
        ref,
        {
          studentId,
          totalPoints: data.next,
          competitionPoints: data.next,
          reason: data.reason,
          delta: data.delta,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }
}

/**
 * Save role change override (e.g. promoting student to admin with green star)
 */
export function saveStudentRoleOverride(
  studentId: string,
  role: string,
  roleTitleAr?: string
): void {
  hydrateFromLocalStorage();

  const current = memoryCache[studentId] || {};
  memoryCache[studentId] = {
    ...current,
    role,
    roleTitleAr,
    updatedAt: new Date().toISOString(),
  };

  persistToLocalStorage();

  // Sync to admin's own document subcollection
  const currentAdmin = auth.currentUser;
  if (currentAdmin && currentAdmin.uid) {
    try {
      const ref = doc(db, 'users', currentAdmin.uid, 'adminStudentOverrides', studentId);
      setDoc(
        ref,
        {
          studentId,
          role,
          roleTitleAr: roleTitleAr || role,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}
  }
}

/**
 * Get current override for a student
 */
export function getStudentOverride(studentId: string): StudentOverrideData | null {
  hydrateFromLocalStorage();
  return memoryCache[studentId] || null;
}
