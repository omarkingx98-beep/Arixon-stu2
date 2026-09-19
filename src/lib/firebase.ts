import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User,
  Auth
} from 'firebase/auth';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  FirebaseStorage
} from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { UserProfile, LeaderboardEntry, Exam, SubjectId } from '../types';
import configJson from '../../firebase-applet-config.json';
import { applyStudentOverrides } from './studentOverrides';

// Initialize Firebase with the active project configuration
const firebaseConfig = {
  projectId: configJson.projectId,
  appId: configJson.appId,
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
  measurementId: configJson.measurementId || undefined,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = configJson.firestoreDatabaseId && configJson.firestoreDatabaseId !== '(default)'
  ? configJson.firestoreDatabaseId 
  : undefined;

// Enable persistent multi-tab offline caching so the app works seamlessly offline and syncs automatically
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, dbId);
} catch {
  // If already initialized in hot reload
  firestoreDb = getFirestore(app, dbId);
}

export const db: Firestore = firestoreDb;

export const auth: Auth = getAuth(app);

// Initialize Firebase Storage connected to arixonstudents-d902a.firebasestorage.app
export const storage: FirebaseStorage = getStorage(app);

// Initialize Firebase Analytics if supported in the current environment
export let analytics: any = null;
if (typeof window !== 'undefined' && configJson.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Non-fatal analytics notice
  });
}

// Enforce browserLocalPersistence for rock-solid session persistence across tabs and browser restarts
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence initialization notice:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Validates active connection to Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firebase] Firestore client currently operating in offline mode.');
      return false;
    }
    // Document not found or permission error still means server responded
    return true;
  }
}

/**
 * Storage Helpers
 * Note: Firebase Storage is NOT enabled due to billing requirements on the free tier.
 * These helpers provide automatic safe fallbacks (e.g. data URLs) so the application
 * runs 100% smoothly without crashes or requiring paid billing.
 */

export const IS_STORAGE_ENABLED = false;

/**
 * Upload a file/blob to Firebase Storage with safe graceful fallback
 */
export async function uploadFileToStorage(
  storagePath: string, 
  file: Blob | Uint8Array | ArrayBuffer, 
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(storageRef);
  } catch (err: any) {
    console.info('[Firebase Storage] Storage operation bypassed (free tier without billing):', err?.message);
    // If the file is a Blob, convert to Data URL for in-memory / local usage safely
    if (file instanceof Blob && file.size < 500000) {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }
    return '';
  }
}

/**
 * Upload a data URL / base64 string to Firebase Storage with safe inline fallback
 */
export async function uploadDataUrlToStorage(
  storagePath: string,
  dataUrl: string
): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (err: any) {
    console.info('[Firebase Storage] Using inline data URL fallback (free tier without billing):', err?.message);
    return dataUrl;
  }
}

/**
 * Retrieve download URL for a file in Firebase Storage with graceful fallback
 */
export async function getStorageFileUrl(storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    return await getDownloadURL(storageRef);
  } catch (err: any) {
    console.info('[Firebase Storage] Could not fetch storage URL:', err?.message);
    return '';
  }
}

/**
 * Delete a file in Firebase Storage with safe error handling
 */
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err: any) {
    console.info('[Firebase Storage] Delete bypassed or object not found:', err?.message);
  }
}

/**
 * Clean data helper to recursively remove any undefined fields before sending to Firestore
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): Partial<T> {
  const clean: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeFirestoreData(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in with Email and Password
 */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Helper to map Firebase Auth error codes into clear, user-friendly Arabic messages
 */
export function getAuthErrorMessage(err: any): string {
  if (!err) return 'حدث خطأ غير متوقع أثناء تسجيل الدخول.';
  const code = typeof err === 'object' && err.code ? err.code : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة، يرجى التأكد من كتابته بشكل سليم.';
    case 'auth/user-not-found':
      return 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني.';
    case 'auth/wrong-password':
      return 'كلمة المرور غير صحيحة، يرجى المحاولة مجدداً.';
    case 'auth/invalid-credential':
      return 'بيانات تسجيل الدخول غير صحيحة (تأكد من البريد الإلكتروني وكلمة المرور).';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات أو أحرف على الأقل.';
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول بهذه الطريقة غير مفعّل حالياً.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت والمحاولة ثانية.';
    case 'auth/too-many-requests':
      return 'تم حظر محاولات الدخول مؤقتاً بسبب تكرار المحاولات غير الناجحة. يرجى الانتظار بضع دقائق.';
    case 'auth/unauthorized-domain':
      return 'نطاق التطبيق الحالي غير مصرح به للمصادقة حالياً.';
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
    case 'auth/popup-blocked':
      return 'تم حظر النافذة المنبثقة بواسطة المتصفح، يرجى السماح بالنوافذ المنبثقة.';
    case 'auth/account-exists-with-different-credential':
      return 'يوجد حساب مسجل مسبقاً بهذا البريد الإلكتروني باستخدام وسيلة دخول أخرى.';
    default:
      return err.message || 'فشلت عملية تسجيل الدخول، يرجى المحاولة لاحقاً.';
  }
}

/**
 * Sign out
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Check and get user profile from Firestore using Firebase Auth UID as primary key
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    const raw = userDoc.data() as UserProfile;
    return applyStudentOverrides(raw);
  }
  return null;
}

/**
 * Check if a username is already taken by another user
 */
export async function isUsernameTaken(username: string, excludeUid?: string): Promise<boolean> {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username.trim().toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (excludeUid) {
      return snapshot.docs.some(d => d.id !== excludeUid);
    }
    return true;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Create a new user profile on first onboarding.
 * CRITICAL: Checks if profile already exists in Firestore first to never overwrite existing points, rank, or history.
 */
export async function createUserProfile(
  user: User, 
  details: {
    username: string;
    displayName: string;
    age?: number;
    city?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    whatsappGroup?: string;
    photoURL?: string;
  }
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', user.uid);

  // Safety check: if user already has a profile in Firestore, preserve it completely
  const existingDoc = await getDoc(userDocRef);
  if (existingDoc.exists()) {
    return existingDoc.data() as UserProfile;
  }

  const now = new Date().toISOString();
  
  const rawProfile: any = {
    uid: user.uid,
    username: details.username.trim().toLowerCase(),
    displayName: details.displayName.trim() || user.displayName || 'طالب أريكسون',
    email: user.email || '',
    totalPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    examsCompleted: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
    hasSeenTutorial: false,
  };

  if (details.photoURL || user.photoURL) {
    rawProfile.photoURL = details.photoURL || user.photoURL;
  }
  if (details.age !== undefined && !isNaN(Number(details.age))) {
    rawProfile.age = Number(details.age);
  }
  if (details.city && details.city.trim()) {
    rawProfile.city = details.city.trim();
  }
  if (details.gender) {
    rawProfile.gender = details.gender;
  }
  if (details.whatsappGroup && details.whatsappGroup.trim()) {
    rawProfile.whatsappGroup = details.whatsappGroup.trim();
  }

  // Sanitize data so no undefined field is ever sent to Firestore
  const profile = sanitizeFirestoreData(rawProfile) as UserProfile;
  await setDoc(userDocRef, profile);
  return profile;
}

/**
 * Update existing user profile
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'username' | 'age' | 'city' | 'gender' | 'whatsappGroup' | 'photoURL'>>
): Promise<void> {
  const rawUpdates: any = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Ensure age is clean number or omit
  if (rawUpdates.age !== undefined && isNaN(Number(rawUpdates.age))) {
    delete rawUpdates.age;
  }
  // Ensure strings are trimmed
  if (rawUpdates.whatsappGroup !== undefined && !rawUpdates.whatsappGroup?.trim()) {
    delete rawUpdates.whatsappGroup;
  }

  const cleanUpdates = sanitizeFirestoreData(rawUpdates);

  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, cleanUpdates);
  } catch (err) {
    console.warn('Firestore updateDoc failed, saved locally:', err);
  }

  // Update local cache
  try {
    const cachedStr = localStorage.getItem(`arixon_cached_profile_${uid}`);
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      localStorage.setItem(`arixon_cached_profile_${uid}`, JSON.stringify({ ...cached, ...cleanUpdates }));
    }
  } catch (e) {
    console.warn('LocalStorage update failed:', e);
  }
}


/**
 * Mark tutorial as seen in Firestore and local cache
 */
export async function markTutorialAsSeen(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      hasSeenTutorial: true,
      updatedAt: new Date().toISOString(),
    });
    const cacheKey = `arixon_cached_profile_${uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        parsed.hasSeenTutorial = true;
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      } catch {}
    }
  } catch (err) {
    console.warn('Could not sync tutorial status to Firestore:', err);
  }
}

/**
 * Update last active timestamp
 */
export async function touchUserActivity(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      lastActiveAt: new Date().toISOString(),
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Query real leaderboard from Firestore
 */
export async function fetchLeaderboard(period: 'all' | 'weekly' | 'monthly'): Promise<LeaderboardEntry[]> {
  try {
    const pointsField = period === 'weekly' ? 'weeklyPoints' : period === 'monthly' ? 'monthlyPoints' : 'totalPoints';
    const q = query(
      collection(db, 'users'),
      orderBy(pointsField, 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    
    let currentRank = 1;
    const entries: LeaderboardEntry[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const raw = docSnapshot.data() as UserProfile;
      const data = applyStudentOverrides(raw);
      const points = data[pointsField] || 0;
      // Only include if user has earned points or has valid profile
      if (points > 0) {
        entries.push({
          uid: data.uid,
          username: data.username || 'مستخدم',
          displayName: data.displayName || data.username,
          photoURL: data.photoURL,
          role: data.role,
          points,
          rank: currentRank++,
          equippedFrameId: data.equippedFrameId,
          equippedNameEffectId: data.equippedNameEffectId,
          equippedTitleId: data.equippedTitleId,
          equippedThemeId: data.equippedThemeId,
          featuredBadgeIds: data.featuredBadgeIds,
        });
      }
    });

    return entries;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Fetch available exams from Firestore (Phase 1 structure, ready for real exams in Firestore)
 */
export async function fetchExams(subjectFilter?: SubjectId): Promise<Exam[]> {
  try {
    const examsRef = collection(db, 'exams');
    let q;
    if (subjectFilter && subjectFilter !== 'all') {
      q = query(examsRef, where('subject', '==', subjectFilter));
    } else {
      q = query(examsRef);
    }
    const snapshot = await getDocs(q);
    const exams: Exam[] = [];
    snapshot.forEach((docSnapshot) => {
      exams.push({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<Exam, 'id'>) });
    });
    return exams;
  } catch (error) {
    console.warn('Exams collection empty or query failed:', error);
    return [];
  }
}

export * from './examService';
export { applyStudentOverrides, getStudentOverride, saveStudentPointsOverride } from './studentOverrides';
