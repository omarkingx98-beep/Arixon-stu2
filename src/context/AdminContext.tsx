import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  checkUserAdminClaims, 
  bootstrapAdminBackend, 
  PRIMARY_ADMIN_EMAIL,
  isPrimaryAdminEmail,
  isSiteOwnerEmail,
} from '../lib/adminService';
import type { AdminProfile, AdminRole, PermissionId } from '../types';
import { ALL_SYSTEM_PERMISSIONS } from '../types';

interface AdminContextType {
  isAdmin: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
  adminRole: AdminRole | null;
  adminProfile: AdminProfile | null;
  permissions: string[];
  hasPermission: (perm: PermissionId) => boolean;
  isCheckingAdmin: boolean;
  isBootstrapping: boolean;
  adminError: string | null;
  refreshAdminStatus: () => Promise<void>;
  bootstrapNow: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const verifyAdminState = useCallback(async () => {
    if (status !== 'authenticated' || !user) {
      setIsAdmin(false);
      setIsOwner(false);
      setAdminRole(null);
      setAdminProfile(null);
      setPermissions([]);
      setIsCheckingAdmin(false);
      return;
    }

    setIsCheckingAdmin(true);
    setAdminError(null);

    try {
      const claimsInfo = await checkUserAdminClaims();
      const isOwnerUser = isSiteOwnerEmail(user.email);
      const isPrimary = isPrimaryAdminEmail(user.email);

      if (claimsInfo.isAdmin || isOwnerUser || isPrimary) {
        setIsAdmin(true);
        setIsOwner(isOwnerUser);
        const resolvedRole = isOwnerUser ? 'owner' : ((claimsInfo.role as AdminRole) || (isPrimary ? 'super_admin' : 'admin'));
        setAdminRole(resolvedRole);
        
        // Owner and Super Admin get all system permissions
        if (isOwnerUser || resolvedRole === 'super_admin') {
          setPermissions(ALL_SYSTEM_PERMISSIONS.map(p => p.id));
        } else {
          setPermissions(ALL_SYSTEM_PERMISSIONS.map(p => p.id)); // Default for admin
        }

        setAdminProfile({
          uid: user.uid,
          email: user.email || PRIMARY_ADMIN_EMAIL,
          displayName: isOwnerUser ? 'Omar King (مالك الموقع)' : (user.displayName || 'Omar King'),
          role: resolvedRole,
          photoURL: user.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      } else {
        setIsAdmin(false);
        setIsOwner(false);
        setAdminRole(null);
        setAdminProfile(null);
        setPermissions([]);
      }
    } catch (err: any) {
      console.error('[AdminContext] Error verifying admin state:', err);
      setIsAdmin(false);
      setIsOwner(false);
      setAdminRole(null);
      setAdminError(err.message || 'فشل التحقق من صلاحيات الإدارة.');
    } finally {
      setIsCheckingAdmin(false);
    }
  }, [user, status]);

  useEffect(() => {
    verifyAdminState();
  }, [verifyAdminState]);

  const hasPermission = useCallback((perm: PermissionId): boolean => {
    if (isOwner) return true; // Owner has absolute authority
    if (adminRole === 'super_admin') return true; // Super Admin has all standard management
    return permissions.includes(perm);
  }, [isOwner, adminRole, permissions]);

  const bootstrapNow = async () => {
    setIsBootstrapping(true);
    setAdminError(null);
    try {
      await bootstrapAdminBackend();
      await verifyAdminState();
    } catch (err: any) {
      setAdminError(err.message || 'فشل استكمال عملية التهيئة.');
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isOwner,
        isSuperAdmin: isOwner || adminRole === 'super_admin',
        adminRole,
        adminProfile,
        permissions,
        hasPermission,
        isCheckingAdmin,
        isBootstrapping,
        adminError,
        refreshAdminStatus: verifyAdminState,
        bootstrapNow,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
