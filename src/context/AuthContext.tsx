import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  getUserProfile, 
  logOut, 
  signInWithGoogle, 
  signInWithEmail as fbSignInWithEmail,
  signUpWithEmail as fbSignUpWithEmail,
  resetPassword as fbResetPassword,
  getAuthErrorMessage,
  touchUserActivity
} from '../lib/firebase';
import type { UserProfile } from '../types';

export type AuthStatus = 
  | 'initializing'           // Checking auth state on load
  | 'unauthenticated'        // No user logged in
  | 'needs_profile_setup'    // Logged in with Firebase, but no Firestore profile document yet
  | 'authenticated'          // Logged in and Firestore profile loaded
  | 'error';                 // Error encountered

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileOptimistic: (profile: UserProfile) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user profile using Firebase UID as the primary document key
   * users/{user.uid}
   */
  const loadProfileForUser = useCallback(async (firebaseUser: User) => {
    try {
      setError(null);
      const existingProfile = await getUserProfile(firebaseUser.uid);
      if (existingProfile) {
        setProfile(existingProfile);
        setStatus('authenticated');
        touchUserActivity(firebaseUser.uid);
      } else {
        // User is authenticated in Firebase Auth, but needs first-time onboarding
        setProfile(null);
        setStatus('needs_profile_setup');
      }
    } catch (err: unknown) {
      console.error('[AuthContext] Error loading user profile from Firestore:', err);
      // Differentiate between auth failure and Firestore data access error
      const message = 'تم تسجيل الدخول بنجاح، لكن تعذر تحميل بيانات الحساب. يرجى إعادة المحاولة.';
      setError(message);
      setStatus('error');
    }
  }, []);

  /**
   * Subscribe to standard Firebase onAuthStateChanged.
   * Firebase browserLocalPersistence handles session restoration automatically.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setError(null);
      if (currentUser) {
        setUser(currentUser);
        await loadProfileForUser(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, [loadProfileForUser]);

  const signIn = async () => {
    await signInWithGoogleHandler();
  };

  const signInWithGoogleHandler = async () => {
    try {
      setError(null);
      const signedInUser = await signInWithGoogle();
      setUser(signedInUser);
      await loadProfileForUser(signedInUser);
    } catch (err: unknown) {
      console.error('[AuthContext] Google Sign-in error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        return;
      }
      const friendlyMsg = getAuthErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const signInWithEmailHandler = async (email: string, password: string) => {
    try {
      setError(null);
      const signedInUser = await fbSignInWithEmail(email, password);
      setUser(signedInUser);
      await loadProfileForUser(signedInUser);
    } catch (err: unknown) {
      console.error('[AuthContext] Email Sign-in error:', err);
      const friendlyMsg = getAuthErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const signUpWithEmailHandler = async (email: string, password: string) => {
    try {
      setError(null);
      const newUser = await fbSignUpWithEmail(email, password);
      setUser(newUser);
      await loadProfileForUser(newUser);
    } catch (err: unknown) {
      console.error('[AuthContext] Email Sign-up error:', err);
      const friendlyMsg = getAuthErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const sendPasswordResetHandler = async (email: string) => {
    try {
      setError(null);
      await fbResetPassword(email);
    } catch (err: unknown) {
      console.error('[AuthContext] Password reset error:', err);
      const friendlyMsg = getAuthErrorMessage(err);
      setError(friendlyMsg);
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await logOut();
      setUser(null);
      setProfile(null);
      setStatus('unauthenticated');
    } catch (err: unknown) {
      console.error('[AuthContext] Sign-out error:', err);
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الخروج';
      setError(message);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfileForUser(user);
    }
  };

  const setProfileOptimistic = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setStatus('authenticated');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        profile,
        error,
        signIn,
        signInWithGoogle: signInWithGoogleHandler,
        signInWithEmail: signInWithEmailHandler,
        signUpWithEmail: signUpWithEmailHandler,
        sendPasswordReset: sendPasswordResetHandler,
        signOut: handleSignOut,
        refreshProfile,
        setProfileOptimistic,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
