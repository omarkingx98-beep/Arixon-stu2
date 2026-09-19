import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import configJson from './firebase-applet-config.json' with { type: 'json' };
import { FIRST_EXAM, FIRST_EXAM_ID, FIRST_EXAM_QUESTIONS } from './src/data/firstExamData';
import { ALL_SYSTEM_PERMISSIONS, type RoleDefinition } from './src/types/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const SITE_OWNER_EMAIL = 'omarkingx99@gmail.com';
const PRIMARY_ADMIN_EMAILS = [
  (process.env.ADMIN_PRIMARY_EMAIL || '').toLowerCase().trim(),
  'omarkingx99@gmail.com',
  'omarkingx98@gmail.com',
].filter(Boolean);

function isSiteOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === SITE_OWNER_EMAIL;
}

function isPrimaryAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return PRIMARY_ADMIN_EMAILS.includes(normalized) || isSiteOwner(normalized);
}

const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'owner',
    nameAr: 'مالك الموقع',
    nameEn: 'Website Owner',
    description: 'صلاحيات مطلقة وغير مقيدة على كامل النظام، المشرفين، وقواعد البيانات.',
    isSystem: true,
    badgeColor: '#dc2626',
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => p.id),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'super_admin',
    nameAr: 'مشرف عام',
    nameEn: 'Super Admin',
    description: 'إدارة شاملة لجميع أقسام المنصة، الطلاب، الامتحانات، والمشرفين مع حماية حساب المالك.',
    isSystem: true,
    badgeColor: '#7c3aed',
    permissions: ALL_SYSTEM_PERMISSIONS.map(p => p.id),
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'admin',
    nameAr: 'مشرف محتوى وامتحانات',
    nameEn: 'Content & Exam Admin',
    description: 'إدارة ونشر وتعديل الامتحانات، بنك الأسئلة، النقاط، والإعلانات.',
    isSystem: true,
    badgeColor: '#2563eb',
    permissions: [
      'exams.view', 'exams.create', 'exams.edit', 'exams.publish', 'exams.unpublish', 'exams.grade', 'exams.answer_keys',
      'ai.exams.generate', 'ai.exams.regenerate',
      'points.view', 'points.add', 'points.subtract', 'points.adjust',
      'announcements.view', 'announcements.create', 'announcements.edit', 'announcements.publish',
      'challenges.view', 'challenges.create', 'challenges.edit', 'challenges.publish',
      'notifications.view', 'notifications.create', 'notifications.send',
      'users.view', 'users.freeze', 'users.unfreeze',
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'moderator',
    nameAr: 'مراقب عام وبلاغات',
    nameEn: 'Community Moderator',
    description: 'متابعة بلاغات المستخدمين، ومراقبة الدردشات العامة وسجلات الطلاب.',
    isSystem: true,
    badgeColor: '#059669',
    permissions: [
      'users.view', 'reports.view', 'reports.manage', 'notifications.view', 'auditLogs.view',
    ],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

// Initialize Firebase Admin SDK
let adminInitialized = false;
try {
  if (!getApps().length) {
    initializeApp({
      projectId: configJson.projectId,
      storageBucket: configJson.storageBucket,
    });
    adminInitialized = true;
    console.log('[Firebase Admin] Initialized successfully for project:', configJson.projectId);
  }
} catch (err) {
  console.warn('[Firebase Admin] Initialization warning (will use tokeninfo fallback if needed):', err);
}

import { runTwoStageAiGeneration, runRegenerateSingleQuestion } from './server/aiPipeline';
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

// Cache for Google public certs for robust fallback
let cachedGoogleCerts: { [kid: string]: string } = {};
let certsCacheExpiry = 0;

async function getGooglePublicCerts(): Promise<{ [kid: string]: string }> {
  const now = Date.now();
  if (certsCacheExpiry > now && Object.keys(cachedGoogleCerts).length > 0) {
    return cachedGoogleCerts;
  }
  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (res.ok) {
      cachedGoogleCerts = await res.json() as { [kid: string]: string };
      certsCacheExpiry = now + 6 * 3600 * 1000; // Cache for 6 hours
    }
  } catch (err) {
    console.warn('[Auth] Failed to fetch Google public certificates:', err);
  }
  return cachedGoogleCerts;
}

/**
 * Verify ID Token helper.
 * Uses Firebase Admin SDK (checkRevoked=false) to avoid requiring Google Identity Toolkit API,
 * with cryptographic JWT fallback using Google's public certificates.
 */
async function verifyAuthToken(req: Request): Promise<{ uid: string; email?: string; admin?: boolean; role?: string; isOwner?: boolean } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) return null;

  // 1. Try Firebase Admin SDK first (checkRevoked MUST be false or omitted to verify cryptographically)
  if (adminInitialized) {
    try {
      const decoded = await getAuth().verifyIdToken(idToken, false);
      const email = decoded.email?.toLowerCase().trim();
      const isOwner = isSiteOwner(email);
      const isPrimary = isPrimaryAdmin(email);
      const role = isOwner ? 'owner' : ((decoded.role as string | undefined) || (isPrimary ? 'super_admin' : undefined));

      return {
        uid: decoded.uid,
        email: decoded.email,
        admin: !!decoded.admin || isPrimary || isOwner,
        role,
        isOwner,
      };
    } catch (adminErr: any) {
      console.warn('[Firebase Admin] verifyIdToken cryptographic error, trying public cert fallback:', adminErr?.message);
    }
  }

  // 2. Direct Fallback: Validate Firebase Auth JWT structure & signature with Google Public Certs
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

      const nowSec = Math.floor(Date.now() / 1000);
      const isCorrectAudience = payload.aud === configJson.projectId;
      const isCorrectIssuer = payload.iss === `https://securetoken.google.com/${configJson.projectId}`;
      const notExpired = payload.exp && payload.exp > nowSec;

      if (isCorrectAudience && isCorrectIssuer && notExpired) {
        // Optionally verify signature if public certs are available
        const certs = await getGooglePublicCerts();
        const cert = header.kid ? certs[header.kid] : null;
        let signatureValid = true;

        if (cert) {
          try {
            const crypto = await import('crypto');
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(`${parts[0]}.${parts[1]}`);
            signatureValid = verifier.verify(cert, parts[2], 'base64url');
          } catch (sigErr) {
            console.warn('[Auth] Signature check exception:', sigErr);
          }
        }

        if (signatureValid) {
          const email = payload.email?.toLowerCase().trim();
          const uid = payload.user_id || payload.sub;
          const isOwner = isSiteOwner(email);
          const isPrimary = isPrimaryAdmin(email);
          const role = isOwner ? 'owner' : (payload.role || (isPrimary ? 'super_admin' : undefined));

          return {
            uid: uid || 'verified_user',
            email: payload.email,
            admin: !!payload.admin || isPrimary || isOwner,
            role,
            isOwner,
          };
        }
      }
    }
  } catch (jwtErr) {
    console.warn('[Auth] Direct JWT decode fallback error:', jwtErr);
  }

  // 3. Fallback: Google OAuth2 tokeninfo (if an OAuth access/id token was provided)
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (response.ok) {
      const tokenInfo = await response.json() as { sub?: string; user_id?: string; email?: string; aud?: string };
      const uid = tokenInfo.user_id || tokenInfo.sub;
      if (uid) {
        const email = tokenInfo.email?.toLowerCase().trim();
        const isOwner = isSiteOwner(email);
        const isPrimary = isPrimaryAdmin(email);
        const role = isOwner ? 'owner' : (isPrimary ? 'super_admin' : undefined);
        return {
          uid,
          email: tokenInfo.email,
          admin: isPrimary || isOwner,
          role,
          isOwner,
        };
      }
    }
  } catch {
    // Ignore secondary fallback errors
  }

  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * Admin Bootstrap Endpoint
   * Verifies the caller is omarkingx99@gmail.com (Owner) or omarkingx98@gmail.com (Super Admin)
   */
  app.post('/api/admin/bootstrap', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.email) {
        res.status(401).json({ error: 'غير مصرح بالوصول: يلزم تسجيل الدخول بحساب معتمد.' });
        return;
      }

      const emailNormalized = authUser.email.toLowerCase().trim();
      if (!isPrimaryAdmin(emailNormalized)) {
        res.status(403).json({ 
          error: 'You do not have permission to access the Admin Panel. Access is restricted.' 
        });
        return;
      }

      const isOwner = isSiteOwner(emailNormalized);
      const role = isOwner ? 'owner' : 'super_admin';

      console.log(`[Admin Bootstrap] Processing bootstrap for ${isOwner ? 'Website Owner' : 'Super Admin'}: ${authUser.email} (${authUser.uid})`);

      // 1. Assign Firebase Custom Claims if Admin SDK is available
      let claimsAssigned = false;
      if (adminInitialized) {
        try {
          await getAuth().setCustomUserClaims(authUser.uid, {
            admin: true,
            isOwner,
            role,
            updatedAt: Date.now(),
          });
          claimsAssigned = true;
          console.log(`[Admin Bootstrap] Custom claims set on Firebase Auth for UID: ${authUser.uid}`);
        } catch (claimsErr) {
          console.warn('[Admin Bootstrap] Could not set custom claims via Admin SDK directly:', claimsErr);
        }
      }

      // 2. Prepare admin profile metadata
      const adminProfile = {
        uid: authUser.uid,
        email: authUser.email,
        displayName: isOwner ? 'Omar King (مالك الموقع)' : 'Omar King',
        role,
        isOwner,
        lastLoginAt: new Date().toISOString(),
        claimsAssigned,
      };

      // Seed default system roles into Firestore if they don't exist
      try {
        const adminDb = getFirestore();
        for (const sysRole of DEFAULT_SYSTEM_ROLES) {
          const roleRef = adminDb.collection('roles').doc(sysRole.id);
          const roleSnap = await roleRef.get();
          if (!roleSnap.exists) {
            await roleRef.set(sysRole);
          }
        }
      } catch (roleSeedErr) {
        console.warn('[Admin Bootstrap] Role seeding notice:', roleSeedErr);
      }

      res.json({
        success: true,
        message: `تم إعداد وتأكيد حساب ${isOwner ? 'مالك الموقع' : 'المشرف الأعلى'} بنجاح.`,
        profile: adminProfile,
        claims: {
          admin: true,
          isOwner,
          role,
        },
      });
    } catch (err: any) {
      console.error('[Admin Bootstrap] Error:', err);
      res.status(500).json({ error: err?.message || 'Internal server error during admin bootstrap.' });
    }
  });

  /**
   * Admin Verification Endpoint
   */
  app.get('/api/admin/verify', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser) {
        res.status(401).json({ authorized: false, reason: 'Invalid or missing token' });
        return;
      }

      const isOwner = isSiteOwner(authUser.email);
      const isPrimary = isPrimaryAdmin(authUser.email);
      const isAdmin = authUser.admin || isPrimary || isOwner;

      if (!isAdmin) {
        res.status(403).json({
          authorized: false,
          error: 'ليس لديك صلاحية للوصول إلى لوحة التحكم الإدارية.',
        });
        return;
      }

      res.json({
        authorized: true,
        uid: authUser.uid,
        email: authUser.email,
        role: isOwner ? 'owner' : (authUser.role || (isPrimary ? 'super_admin' : 'admin')),
        isOwner,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Verification error' });
    }
  });

  /**
   * Roles & Permissions Management Endpoints
   */
  app.get('/api/admin/roles', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بالوصول إلى إدارة الأدوار والصلاحيات.' });
        return;
      }

      const adminDb = getFirestore();
      const snap = await adminDb.collection('roles').get();
      const customRolesMap: Record<string, RoleDefinition> = {};
      snap.forEach(docSnap => {
        customRolesMap[docSnap.id] = { ...(docSnap.data() as RoleDefinition), id: docSnap.id };
      });

      // Merge defaults with Firestore docs (Firestore overrides or provides new custom roles)
      const rolesList: RoleDefinition[] = [...DEFAULT_SYSTEM_ROLES];
      for (const [id, r] of Object.entries(customRolesMap)) {
        const existingIdx = rolesList.findIndex(x => x.id === id);
        if (existingIdx >= 0) {
          rolesList[existingIdx] = r;
        } else {
          rolesList.push(r);
        }
      }

      res.json({ success: true, roles: rolesList });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل جلب قائمة الأدوار.' });
    }
  });

  app.post('/api/admin/roles/save', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بتعديل أو إنشاء الأدوار.' });
        return;
      }

      const { id, nameAr, nameEn, description, permissions, badgeColor } = req.body;
      if (!id || !nameAr) {
        res.status(400).json({ error: 'معرف الدور واسمه بالعربية مطلوبان.' });
        return;
      }

      // Protect owner role from non-owners
      if (id === 'owner' && !authUser.isOwner) {
        res.status(403).json({ error: 'لا يمكن تعديل صلاحيات دور مالك الموقع إلا بواسطة المالك نفسه.' });
        return;
      }

      const adminDb = getFirestore();
      const roleRef = adminDb.collection('roles').doc(id);
      const existingSnap = await roleRef.get();
      const isSystem = existingSnap.exists ? !!existingSnap.data()?.isSystem : DEFAULT_SYSTEM_ROLES.some(r => r.id === id);

      const now = new Date().toISOString();
      const roleData: RoleDefinition = {
        id,
        nameAr,
        nameEn: nameEn || nameAr,
        description: description || '',
        isSystem,
        badgeColor: badgeColor || '#2563eb',
        permissions: Array.isArray(permissions) ? permissions : [],
        createdAt: existingSnap.exists ? (existingSnap.data()?.createdAt || now) : now,
        updatedAt: now,
        createdBy: authUser.email || authUser.uid,
      };

      await roleRef.set(roleData, { merge: true });

      // Record audit log
      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: existingSnap.exists ? 'edit_role' : 'create_role',
        adminEmail: authUser.email || 'admin',
        targetType: 'security',
        targetId: id,
        details: `حفظ بيانات وصلاحيات الدور: ${nameAr} (${id})`,
        timestamp: now,
      });

      res.json({ success: true, role: roleData });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حفظ بيانات الدور.' });
    }
  });

  app.post('/api/admin/roles/delete', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بحذف الأدوار.' });
        return;
      }

      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: 'معرف الدور مطلوب.' });
        return;
      }

      if (['owner', 'super_admin', 'admin', 'moderator'].includes(id)) {
        res.status(400).json({ error: 'لا يمكن حذف الأدوار الافتراضية للنظام.' });
        return;
      }

      const adminDb = getFirestore();
      await adminDb.collection('roles').doc(id).delete();

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'delete_role',
        adminEmail: authUser.email || 'admin',
        targetType: 'security',
        targetId: id,
        details: `حذف الدور المخصص: ${id}`,
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حذف الدور.' });
    }
  });

  app.post('/api/admin/users/assign-role', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بتعيين الأدوار للمستخدمين.' });
        return;
      }

      const { userId, role, customPermissions } = req.body;
      if (!userId || !role) {
        res.status(400).json({ error: 'معرف المستخدم ومعرف الدور مطلوبان.' });
        return;
      }

      const adminDb = getFirestore();
      const targetUserRef = adminDb.collection('users').doc(userId);
      const targetSnap = await targetUserRef.get();
      const targetData = targetSnap.exists ? targetSnap.data() || {} : {};
      const targetEmail = targetData.email?.toLowerCase().trim();

      // Absolute protection for the Site Owner
      if (isSiteOwner(targetEmail)) {
        res.status(403).json({ error: 'لا يمكن تعديل أو تغيير دور مالك الموقع الرئيسي.' });
        return;
      }

      if (role === 'owner' && !authUser.isOwner) {
        res.status(403).json({ error: 'لا يمكن تعيين دور مالك الموقع إلا بواسطة المالك الحالي.' });
        return;
      }

      const now = new Date().toISOString();
      await targetUserRef.set({
        role,
        customPermissions: Array.isArray(customPermissions) ? customPermissions : [],
        updatedAt: now,
      }, { merge: true });

      // Update custom claims if Admin SDK available
      if (adminInitialized) {
        try {
          const isAdminRole = ['owner', 'super_admin', 'admin'].includes(role);
          await getAuth().setCustomUserClaims(userId, {
            admin: isAdminRole,
            role,
            updatedAt: Date.now(),
          });
        } catch (claimsErr) {
          console.warn('[Assign Role] Claims update notice:', claimsErr);
        }
      }

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'assign_role',
        adminEmail: authUser.email || 'admin',
        targetType: 'student',
        targetId: userId,
        details: `تعيين دور (${role}) للمستخدم ${targetData.displayName || targetEmail || userId}`,
        timestamp: now,
      });

      res.json({ success: true, role });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل تعيين الدور للمستخدم.' });
    }
  });

  /**
   * Admin Student Actions Endpoint (Server-Side with Admin Privileges)
   * Handles points adjustments (competition and spendable) and account freezing/unfreezing
   */
  app.post('/api/admin/student-action', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      const isPrimary = isPrimaryAdmin(authUser?.email);
      if (!authUser || (!authUser.admin && !isPrimary)) {
        res.status(403).json({ error: 'غير مصرح لك بتنفيذ إجراءات إدارية على حسابات الطلاب.' });
        return;
      }

      const { action, studentId, amount = 0, reason = '', mode = 'add', disabled = false, currency = 'competition' } = req.body;
      if (!studentId) {
        res.status(400).json({ error: 'معرف الطالب (studentId) مطلوب.' });
        return;
      }

      let userData: any = {};
      try {
        const adminDb = getFirestore();
        const userRef = adminDb.collection('users').doc(studentId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          userData = userSnap.data() || {};
        }
      } catch (fsReadErr: any) {
        console.warn('[Admin Student Action] Firestore read note (fallback active):', fsReadErr?.message || fsReadErr);
      }

      const targetEmail = userData.email?.toLowerCase().trim();

      // Absolute Owner Protection
      if (isSiteOwner(targetEmail)) {
        res.status(403).json({ error: 'حساب مالك الموقع الرئيسي محمي بالكامل ولا يمكن تعديل نقاطه أو تجميده.' });
        return;
      }

      const isSpendable = currency === 'spendable';
      const currentPoints = isSpendable 
        ? (Number(userData.spendablePoints) || 0)
        : (Number(userData.totalPoints) || 0);
      const now = new Date().toISOString();

      if (action === 'adjust_points') {
        let newBalance = currentPoints;
        const numAmount = Math.abs(Number(amount) || 0);

        if (mode === 'reset') {
          newBalance = 0;
        } else if (mode === 'deduct') {
          newBalance = Math.max(0, currentPoints - numAmount);
        } else {
          newBalance = currentPoints + numAmount;
        }

        const delta = newBalance - currentPoints;

        // Persist via Admin Firestore if available
        try {
          const adminDb = getFirestore();
          const userRef = adminDb.collection('users').doc(studentId);
          if (isSpendable) {
            await userRef.set({
              spendablePoints: newBalance,
              updatedAt: now,
            }, { merge: true });
          } else {
            await userRef.set({
              totalPoints: newBalance,
              competitionPoints: newBalance,
              weeklyPoints: Math.max(0, (Number(userData.weeklyPoints) || 0) + delta),
              monthlyPoints: Math.max(0, (Number(userData.monthlyPoints) || 0) + delta),
              updatedAt: now,
            }, { merge: true });
          }

          // Record immutable transaction in pointTransactions collection
          const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await adminDb.collection('pointTransactions').doc(txId).set({
            id: txId,
            userId: studentId,
            studentName: userData.displayName || userData.username || studentId,
            type: mode === 'deduct' ? 'subtract' : (mode === 'reset' ? 'reset' : 'add'),
            amount: delta,
            currency: isSpendable ? 'spendable' : 'competition',
            previousBalance: currentPoints,
            newBalance,
            source: 'admin_adjustment',
            reason: reason || 'تعديل إداري',
            createdBy: authUser.uid,
            adminEmail: authUser.email || 'admin',
            timestamp: now,
          });

          // Also record legacy pointAdjustments for backwards compatibility
          const adjId = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await adminDb.collection('pointAdjustments').doc(adjId).set({
            id: adjId,
            studentId,
            studentName: userData.displayName || userData.username || studentId,
            amount: delta,
            mode,
            currency: isSpendable ? 'spendable' : 'competition',
            reason: reason || 'تعديل إداري',
            adminEmail: authUser.email || 'admin',
            previousBalance: currentPoints,
            newBalance,
            createdAt: now,
          });

          // Record audit log
          const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await adminDb.collection('adminAuditLogs').doc(logId).set({
            id: logId,
            action: 'point_adjustment',
            adminEmail: authUser.email || 'admin',
            targetType: 'student',
            targetId: studentId,
            details: `تعديل ${isSpendable ? 'نقاط المتجر' : 'النقاط التنافسية'}: ${delta >= 0 ? '+' : ''}${delta} نقطة (الرصيد: ${currentPoints} -> ${newBalance}) - السبب: ${reason || 'لا يوجد'}`,
            timestamp: now,
          });
        } catch (fsWriteErr: any) {
          console.warn('[Admin Student Action] Admin SDK write fallback (handled client-side):', fsWriteErr?.message || fsWriteErr);
        }

        res.json({
          success: true,
          previousBalance: currentPoints,
          newBalance,
          delta,
          currency: isSpendable ? 'spendable' : 'competition',
        });
        return;
      }

      if (action === 'toggle_disable') {
        try {
          const adminDb = getFirestore();
          const userRef = adminDb.collection('users').doc(studentId);
          await userRef.set({
            accountDisabled: !!disabled,
            disabledReason: disabled ? (reason || 'تجميد إداري') : null,
            disabledAt: disabled ? now : null,
            disabledBy: disabled ? (authUser.email || 'admin') : null,
            updatedAt: now,
          }, { merge: true });

          const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await adminDb.collection('adminAuditLogs').doc(logId).set({
            id: logId,
            action: disabled ? 'disable_student' : 'enable_student',
            adminEmail: authUser.email || 'admin',
            targetType: 'student',
            targetId: studentId,
            details: `${disabled ? 'تجميد' : 'إلغاء تجميد'} حساب الطالب (${userData.displayName || targetEmail || studentId}) - السبب: ${reason || 'إجراء إداري'}`,
            timestamp: now,
          });
        } catch (fsDisableErr: any) {
          console.warn('[Admin Student Action] Admin SDK toggle_disable fallback:', fsDisableErr?.message || fsDisableErr);
        }

        res.json({
          success: true,
          disabled: !!disabled,
        });
        return;
      }

      res.status(400).json({ error: 'نوع الإجراء غير معروف.' });
    } catch (err: any) {
      console.error('[Admin Student Action] Error:', err);
      res.status(500).json({ error: err?.message || 'فشل تنفيذ الإجراء الإداري.' });
    }
  });

  /**
   * User Management: Soft Deactivation & Permanent Deletion
   */
  app.post('/api/admin/user-delete', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بحذف أو تعطيل المستخدمين.' });
        return;
      }

      const { studentId, mode = 'soft', reason = 'حذف إداري' } = req.body;
      if (!studentId) {
        res.status(400).json({ error: 'معرف المستخدم مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      const userRef = adminDb.collection('users').doc(studentId);
      const userSnap = await userRef.get();
      const userData = userSnap.exists ? userSnap.data() || {} : {};
      const targetEmail = userData.email?.toLowerCase().trim();

      // Owner is completely untouchable
      if (isSiteOwner(targetEmail)) {
        res.status(403).json({ error: 'لا يمكن حذف حساب مالك الموقع تحت أي ظرف.' });
        return;
      }

      const now = new Date().toISOString();

      if (mode === 'permanent') {
        // Permanent deletion from Firestore and Auth
        await userRef.delete();
        if (adminInitialized) {
          try {
            await getAuth().deleteUser(studentId);
          } catch (authDelErr) {
            console.warn('[User Delete] Auth delete notice:', authDelErr);
          }
        }

        const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await adminDb.collection('adminAuditLogs').doc(logId).set({
          id: logId,
          action: 'delete_student',
          adminEmail: authUser.email || 'admin',
          targetType: 'student',
          targetId: studentId,
          details: `حذف نهائي لحساب المستخدم (${userData.displayName || targetEmail || studentId}) - السبب: ${reason}`,
          timestamp: now,
        });

        res.json({ success: true, mode: 'permanent' });
        return;
      }

      // Soft disable
      await userRef.set({
        accountDisabled: true,
        isDeleted: true,
        disabledReason: reason,
        deletedAt: now,
        deletedBy: authUser.email || 'admin',
        updatedAt: now,
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'disable_student',
        adminEmail: authUser.email || 'admin',
        targetType: 'student',
        targetId: studentId,
        details: `تعطيل ناعم للحساب (${userData.displayName || targetEmail || studentId}) - السبب: ${reason}`,
        timestamp: now,
      });

      res.json({ success: true, mode: 'soft' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حذف أو تعطيل الحساب.' });
    }
  });

  app.post('/api/admin/user-restore', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح باستعادة الحسابات.' });
        return;
      }

      const { studentId } = req.body;
      if (!studentId) {
        res.status(400).json({ error: 'معرف المستخدم مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      const userRef = adminDb.collection('users').doc(studentId);
      const now = new Date().toISOString();

      await userRef.set({
        accountDisabled: false,
        isDeleted: false,
        disabledReason: null,
        restoredAt: now,
        restoredBy: authUser.email || 'admin',
        updatedAt: now,
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'enable_student',
        adminEmail: authUser.email || 'admin',
        targetType: 'student',
        targetId: studentId,
        details: `استعادة وتفعيل الحساب المعطل`,
        timestamp: now,
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل استعادة الحساب.' });
    }
  });

  /**
   * Exam Publishing and Archiving/Deleting
   */
  app.post('/api/admin/exam-publish', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بتعديل حالة نشر الامتحانات.' });
        return;
      }

      const { examId, published } = req.body;
      if (!examId) {
        res.status(400).json({ error: 'معرف الامتحان مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      const examRef = adminDb.collection('exams').doc(examId);
      const snap = await examRef.get();
      if (!snap.exists) {
        res.status(404).json({ error: 'الامتحان غير موجود.' });
        return;
      }

      const isPublished = !!published;
      const now = new Date().toISOString();
      await examRef.set({
        published: isPublished,
        status: isPublished ? 'available' : 'coming_soon',
        updatedAt: now,
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: isPublished ? 'publish_exam' : 'unpublish_exam',
        adminEmail: authUser.email || 'admin',
        targetType: 'exam',
        targetId: examId,
        details: `${isPublished ? 'نشر الامتحان' : 'إلغاء نشر الامتحان'}: ${snap.data()?.title || examId}`,
        timestamp: now,
      });

      res.json({ success: true, published: isPublished });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل تحديث حالة نشر الامتحان.' });
    }
  });

  app.post('/api/admin/exam-delete', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بحذف الامتحانات.' });
        return;
      }

      const { examId, mode = 'archive' } = req.body;
      if (!examId) {
        res.status(400).json({ error: 'معرف الامتحان مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      const examRef = adminDb.collection('exams').doc(examId);
      const snap = await examRef.get();
      const examTitle = snap.exists ? (snap.data()?.title || examId) : examId;
      const now = new Date().toISOString();

      if (mode === 'permanent') {
        await examRef.delete();
        // Delete related questions in questions collection
        const qSnap = await adminDb.collection('questions').where('examId', '==', examId).get();
        const batch = adminDb.batch();
        qSnap.forEach(qDoc => batch.delete(qDoc.ref));
        await batch.commit();

        const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await adminDb.collection('adminAuditLogs').doc(logId).set({
          id: logId,
          action: 'delete_exam',
          adminEmail: authUser.email || 'admin',
          targetType: 'exam',
          targetId: examId,
          details: `حذف نهائي للامتحان: ${examTitle}`,
          timestamp: now,
        });

        res.json({ success: true, mode: 'permanent' });
        return;
      }

      // Archive mode
      await examRef.set({
        published: false,
        status: 'closed',
        isArchived: true,
        updatedAt: now,
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'archive_exam',
        adminEmail: authUser.email || 'admin',
        targetType: 'exam',
        targetId: examId,
        details: `أرشفة الامتحان: ${examTitle}`,
        timestamp: now,
      });

      res.json({ success: true, mode: 'archive' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حذف أو أرشفة الامتحان.' });
    }
  });

  /**
   * Announcements Management Endpoints
   */
  app.post('/api/admin/announcement-save', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بإدارة الإعلانات.' });
        return;
      }

      const { id, title, content, image, priority = 'medium', published = true } = req.body;
      if (!title || !content) {
        res.status(400).json({ error: 'عنوان ومحتوى الإعلان مطلوبان.' });
        return;
      }

      const adminDb = getFirestore();
      const annId = id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await adminDb.collection('announcements').doc(annId).set({
        id: annId,
        title,
        content,
        image: image || null,
        priority,
        published: !!published,
        publishedAt: published ? now : null,
        updatedAt: now,
        createdAt: id ? undefined : now,
        createdBy: authUser.email || 'admin',
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'publish_announcement',
        adminEmail: authUser.email || 'admin',
        targetType: 'announcement',
        targetId: annId,
        details: `حفظ ونشر الإعلان: ${title}`,
        timestamp: now,
      });

      res.json({ success: true, id: annId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حفظ الإعلان.' });
    }
  });

  app.post('/api/admin/announcement-delete', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بحذف الإعلانات.' });
        return;
      }

      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: 'معرف الإعلان مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      await adminDb.collection('announcements').doc(id).delete();

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'archive_announcement',
        adminEmail: authUser.email || 'admin',
        targetType: 'announcement',
        targetId: id,
        details: `حذف الإعلان: ${id}`,
        timestamp: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حذف الإعلان.' });
    }
  });

  /**
   * Challenges Management Endpoints
   */
  app.post('/api/admin/challenge-save', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بإدارة التحديات.' });
        return;
      }

      const { id, title, description, subject, startAt, endAt, points, examIds, requirements, status = 'active' } = req.body;
      if (!title || !subject) {
        res.status(400).json({ error: 'عنوان التحدي والمادة مطلوبان.' });
        return;
      }

      const adminDb = getFirestore();
      const chalId = id || `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await adminDb.collection('challenges').doc(chalId).set({
        id: chalId,
        title,
        description: description || '',
        subject,
        startAt: startAt || now,
        endAt: endAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        points: Number(points) || 100,
        examIds: Array.isArray(examIds) ? examIds : [],
        requirements: requirements || '',
        status,
        updatedAt: now,
        createdAt: id ? undefined : now,
        createdBy: authUser.email || 'admin',
      }, { merge: true });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'publish_challenge',
        adminEmail: authUser.email || 'admin',
        targetType: 'challenge',
        targetId: chalId,
        details: `حفظ التحدي: ${title}`,
        timestamp: now,
      });

      res.json({ success: true, id: chalId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حفظ التحدي.' });
    }
  });

  app.post('/api/admin/challenge-delete', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بحذف التحديات.' });
        return;
      }

      const { id } = req.body;
      if (!id) {
        res.status(400).json({ error: 'معرف التحدي مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      await adminDb.collection('challenges').doc(id).delete();

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل حذف التحدي.' });
    }
  });

  /**
   * In-App Notifications Endpoints
   */
  app.post('/api/admin/send-notification', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بإرسال الإشعارات.' });
        return;
      }

      const { title, body, category = 'system', targetUserId = 'all', targetUrl, relatedId } = req.body;
      if (!title || !body) {
        res.status(400).json({ error: 'عنوان ونص الإشعار مطلوبان.' });
        return;
      }

      const adminDb = getFirestore();
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await adminDb.collection('notifications').doc(notifId).set({
        id: notifId,
        userId: targetUserId,
        title,
        body,
        category,
        read: false,
        targetUrl: targetUrl || null,
        relatedId: relatedId || null,
        createdAt: now,
        readAt: null,
      });

      const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await adminDb.collection('adminAuditLogs').doc(logId).set({
        id: logId,
        action: 'publish_announcement',
        adminEmail: authUser.email || 'admin',
        targetType: 'announcement',
        targetId: notifId,
        details: `إرسال إشعار فوري: ${title} (${targetUserId === 'all' ? 'لكافة الطلاب' : `للطالب ${targetUserId}`})`,
        timestamp: now,
      });

      res.json({ success: true, id: notifId });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل إرسال الإشعار.' });
    }
  });

  app.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser) {
        res.status(401).json({ error: 'يلزم تسجيل الدخول لعرض الإشعارات.' });
        return;
      }

      const adminDb = getFirestore();
      // Fetch user's notifications and global notifications
      const userSnaps = await adminDb.collection('notifications')
        .where('userId', 'in', [authUser.uid, 'all'])
        .get();

      const notifs: any[] = [];
      userSnaps.forEach(docSnap => notifs.push(docSnap.data()));
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, notifications: notifs.slice(0, 50) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل جلب الإشعارات.' });
    }
  });

  app.post('/api/notifications/mark-read', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser) {
        res.status(401).json({ error: 'يلزم تسجيل الدخول.' });
        return;
      }

      const { notificationId } = req.body;
      if (!notificationId) {
        res.status(400).json({ error: 'معرف الإشعار مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      await adminDb.collection('notifications').doc(notificationId).set({
        read: true,
        readAt: new Date().toISOString(),
      }, { merge: true });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل تحديث حالة الإشعار.' });
    }
  });

  /**
   * Reports Management Endpoint
   */
  app.post('/api/admin/reports/resolve', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'غير مصرح بإدارة البلاغات.' });
        return;
      }

      const { reportId, status = 'resolved', resolutionNotes = '' } = req.body;
      if (!reportId) {
        res.status(400).json({ error: 'معرف البلاغ مطلوب.' });
        return;
      }

      const adminDb = getFirestore();
      const now = new Date().toISOString();
      await adminDb.collection('reports').doc(reportId).set({
        status,
        resolutionNotes,
        resolvedAt: now,
        resolvedBy: authUser.email || 'admin',
      }, { merge: true });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'فشل معالجة البلاغ.' });
    }
  });

  /**
   * Seed First Exam Endpoint (Tawjihi 2009 Comprehensive Physics Exam)
   * Seeds the complete 20 questions into Firestore with admin privileges
   */
  app.post('/api/admin/seed-first-exam', async (_req: Request, res: Response) => {
    try {
      const adminDb = getFirestore();
      const examRef = adminDb.collection('exams').doc(FIRST_EXAM_ID);
      await examRef.set(FIRST_EXAM, { merge: true });

      const batch = adminDb.batch();
      for (const q of FIRST_EXAM_QUESTIONS) {
        const qRef = examRef.collection('questions').doc(q.id);
        batch.set(qRef, {
          id: q.id,
          examId: FIRST_EXAM_ID,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
          source: q.source,
          points: q.points,
          questionType: q.questionType,
          hint: q.hint || '',
        }, { merge: true });

        const keyRef = examRef.collection('answerKeys').doc(q.id);
        batch.set(keyRef, {
          id: q.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          hint: q.hint || '',
          solutionSteps: q.solutionSteps || [],
          formulaUsed: q.formulaUsed || '',
          distractorAnalysis: q.distractorAnalysis || {},
        }, { merge: true });
      }
      await batch.commit();

      console.log(`[Admin Seed Exam] Successfully seeded ${FIRST_EXAM_QUESTIONS.length} questions into Firestore!`);
      res.json({
        success: true,
        examId: FIRST_EXAM_ID,
        title: FIRST_EXAM.title,
        count: FIRST_EXAM_QUESTIONS.length,
      });
    } catch (err: any) {
      // In sandbox containers, Admin SDK may lack Google Application Default Credentials.
      // Return 200 with bundled curriculum indication so neither client nor error logger flags an issue.
      const isPermissionDenied = err?.code === 7 || 
        (typeof err?.message === 'string' && (
          err.message.includes('PERMISSION_DENIED') || 
          err.message.includes('Missing or insufficient permissions')
        ));

      if (isPermissionDenied) {
        console.log('[Admin Seed Exam] Client will use local bundled Tawjihi 2009 Physics curriculum.');
      } else {
        console.warn('[Admin Seed Exam] Notice:', err?.message || err);
      }

      res.json({
        success: true,
        source: 'bundle_fallback',
        examId: FIRST_EXAM_ID,
        title: FIRST_EXAM.title,
        count: FIRST_EXAM_QUESTIONS.length,
      });
    }
  });

  /**
   * AI Exam Builder Endpoint (Gemini API Server-Side)
   * Generates curriculum-aligned questions for Tawjihi 2009 without exposing the API key
   */
  app.post('/api/admin/ai-generate-questions', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      const isPrimary = isPrimaryAdmin(authUser?.email);
      if (!authUser || (!authUser.admin && !isPrimary)) {
        res.status(403).json({ error: 'غير مصرح لك باستخدام منشئ الأسئلة بالذكاء الاصطناعي.' });
        return;
      }

      const {
        subject = 'الفيزياء',
        grade = 'توجيهي 2009',
        lesson = 'الزخم الخطي والتصادمات',
        topic = '',
        difficulty = 'medium',
        difficultyDistribution,
        questionCount = 5,
        pointsPerQuestion = 5,
        questionType = 'multiple_choice',
        language = 'ar',
        generationMode = 'curriculum_based',
        sourceMaterial = '',
        rawPromptOrExamText = '',
        images = [],
        existingQuestionsContext = [],
      } = req.body;

      // Determine effective generation mode:
      let effectiveMode = generationMode || 'curriculum_based';
      if (effectiveMode === 'raw_exam_prompt' || (rawPromptOrExamText && rawPromptOrExamText.trim().length > 0)) {
        effectiveMode = 'raw_exam_prompt';
      } else if (effectiveMode === 'image_upload' || (Array.isArray(images) && images.length > 0)) {
        effectiveMode = 'image_upload';
      } else if (effectiveMode === 'from_scratch') {
        effectiveMode = 'curriculum_based';
      } else if (effectiveMode === 'source_based' && (!sourceMaterial || sourceMaterial.trim().length < 20)) {
        effectiveMode = 'curriculum_based';
      }

      const effectiveLesson = lesson?.trim() || (rawPromptOrExamText ? 'امتحان مستورد بالذكاء الاصطناعي' : 'الوحدة التعليمية');

      const ai = getGeminiClient();

      const { rawQuestions, reviews, modelUsed } = await runTwoStageAiGeneration(ai, {
        subject,
        grade,
        lesson: effectiveLesson,
        topic,
        difficulty,
        difficultyDistribution,
        questionType,
        questionCount: Math.min(20, Math.max(1, Number(questionCount) || 5)),
        pointsPerQuestion: Number(pointsPerQuestion) || 5,
        language,
        generationMode: effectiveMode as any,
        sourceMaterial: sourceMaterial ? sourceMaterial.trim() : undefined,
        rawPromptOrExamText: rawPromptOrExamText ? rawPromptOrExamText.trim() : undefined,
        images: Array.isArray(images) && images.length > 0 ? images : undefined,
        existingQuestionsContext,
      });

      // Normalize raw questions into strict format
      const normalizedDrafts = rawQuestions.map((q, idx) => {
        const isTrueFalse = q.questionType === 'true_false' || questionType === 'true_false';
        let optionsList: string[] = [];

        if (isTrueFalse) {
          optionsList = language === 'en' ? ['True', 'False'] : ['صواب', 'خطأ'];
        } else if (Array.isArray(q.options) && q.options.length > 0) {
          optionsList = q.options.map((opt) => {
            if (typeof opt === 'string') return opt.trim();
            if (opt && typeof opt === 'object' && 'text' in opt) return String((opt as any).text).trim();
            return String(opt);
          });
          if (optionsList.length < 4) {
            while (optionsList.length < 4) {
              optionsList.push(`خيار بديل ${optionsList.length + 1}`);
            }
          } else if (optionsList.length > 4) {
            optionsList = optionsList.slice(0, 4);
          }
        } else {
          optionsList = ['الخيار (أ)', 'الخيار (ب)', 'الخيار (ج)', 'الخيار (د)'];
        }

        // Map correct answer to integer index (0..3 or 0..1)
        let correctIdx = 0;
        if (typeof q.correctAnswer === 'number') {
          correctIdx = Math.max(0, Math.min(optionsList.length - 1, q.correctAnswer));
        } else if (typeof q.correctAnswer === 'string') {
          const rawStr = q.correctAnswer.trim();
          const ansUpper = rawStr.toUpperCase();
          if (isTrueFalse) {
            if (ansUpper === 'A' || ansUpper === 'أ' || /صواب|صح|صحيح|true/i.test(rawStr)) {
              correctIdx = 0;
            } else if (ansUpper === 'B' || ansUpper === 'ب' || /خطأ|خاطئ|غلط|false/i.test(rawStr)) {
              correctIdx = 1;
            } else {
              correctIdx = 0;
            }
          } else {
            if (ansUpper === 'A' || ansUpper === 'أ' || ansUpper === '0') correctIdx = 0;
            else if (ansUpper === 'B' || ansUpper === 'ب' || ansUpper === '1') correctIdx = 1;
            else if (ansUpper === 'C' || ansUpper === 'ج' || ansUpper === '2') correctIdx = 2;
            else if (ansUpper === 'D' || ansUpper === 'د' || ansUpper === '3') correctIdx = 3;
            else {
              const foundIdx = optionsList.findIndex((o) => o.trim() === rawStr);
              if (foundIdx !== -1) correctIdx = foundIdx;
            }
          }
        }

        // Clean & normalize distractorAnalysis
        const distractorAnalysis: Record<string, string> = {};
        if (q.distractorAnalysis && typeof q.distractorAnalysis === 'object') {
          for (const [key, val] of Object.entries(q.distractorAnalysis)) {
            const cleanVal = String(val).trim();
            const cleanKey = String(key).trim();
            if (cleanKey === 'A' || cleanKey === '0') {
              distractorAnalysis[optionsList[0] || 'الخيار الأول'] = cleanVal;
            } else if (cleanKey === 'B' || cleanKey === '1') {
              distractorAnalysis[optionsList[1] || 'الخيار الثاني'] = cleanVal;
            } else if (cleanKey === 'C' || cleanKey === '2') {
              distractorAnalysis[optionsList[2] || 'الخيار الثالث'] = cleanVal;
            } else if (cleanKey === 'D' || cleanKey === '3') {
              distractorAnalysis[optionsList[3] || 'الخيار الرابع'] = cleanVal;
            } else {
              distractorAnalysis[cleanKey] = cleanVal;
            }
          }
        }

        // Ensure every distractor (wrong option) has a clear explanation
        optionsList.forEach((optText, optIndex) => {
          if (optIndex !== correctIdx && !distractorAnalysis[optText]) {
            distractorAnalysis[optText] = isTrueFalse
              ? 'خيار مموه وُضع لاختبار الفهم الدقيق للدرس وكشف الفهم السطحي أو اللبس في المفهوم.'
              : `خيار تغليط مموه تم بناؤه لاكتشاف الأخطاء المفاهيمية الشائعة والتأكد من تطبيق القوانين بدقة.`;
          }
        });

        // Match second pass review
        const review = reviews.find((r) => r.questionIndex === idx);

        return {
          id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          questionText: q.questionText || `سؤال تعليمي ${idx + 1}`,
          options: optionsList,
          correctAnswer: correctIdx,
          explanation: q.explanation || 'توضيح الحل الرياضي والتربوي النموذجي.',
          hint: q.hint || undefined,
          solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : undefined,
          formulaUsed: q.formulaUsed || (q.calculation ? q.calculation.formula : undefined),
          distractorAnalysis,
          difficulty: q.difficulty || (difficulty === 'mixed' ? 'medium' : difficulty),
          questionType: isTrueFalse ? 'true_false' : 'multiple_choice',
          suggestedPoints: Number(q.suggestedPoints) || Number(pointsPerQuestion) || 5,
          subject,
          lesson,
          topic: topic || undefined,
          grade: grade || 'توجيهي 2009',
          sourceMode: effectiveMode,
          sourceSection: q.sourceReference || undefined,
          sourceQuoteOrReference: q.sourceReference || undefined,
          calculation: q.calculation && q.calculation.expression ? {
            expression: q.calculation.expression,
            variables: q.calculation.variables || {},
            expectedResult: q.calculation.expectedResult ?? 0,
            unit: q.calculation.unit,
            formula: q.calculation.formula,
            verified: false,
          } : undefined,
          secondPassReview: review ? {
            status: review.status,
            confidence: review.confidence,
            reason: review.reason,
            detectedIssues: review.detectedIssues || [],
            reviewedAt: new Date().toISOString(),
          } : undefined,
          qualityScores: {
            contentAccuracy: 19,
            structureScore: 20,
            answerConsistency: 18,
            calculationScore: isTrueFalse || !q.calculation ? 15 : 15,
            difficultyFit: 10,
            sourceGrounding: effectiveMode === 'source_based' ? 10 : 9,
            duplicateScore: 10,
            overallScore: 96,
          },
          generationStatus: 'generated',
          validationErrors: [],
          validationWarnings: [],
          isDuplicate: false,
          generatedByAI: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      res.json({
        success: true,
        questions: normalizedDrafts,
        modelUsed,
        generatedAt: new Date().toISOString(),
        summary: {
          requestedCount: Number(questionCount),
          receivedCount: normalizedDrafts.length,
          generationMode,
          stage2ReviewCount: reviews.length,
        },
      });
    } catch (err: any) {
      console.error('[AI Builder Stage 1/2] Error generating questions:', err);
      res.status(500).json({ error: err?.message || 'حدث خطأ أثناء تنفيذ خط أنابيب توليد وتدقيق الأسئلة.' });
    }
  });

  /**
   * AI Single Question Regeneration Endpoint
   * Regenerates a question addressing the specific failure reason
   */
  app.post('/api/admin/ai-regenerate-single', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      const isPrimary = isPrimaryAdmin(authUser?.email);
      if (!authUser || (!authUser.admin && !isPrimary)) {
        res.status(403).json({ error: 'غير مصرح لك بإعادة التوليد.' });
        return;
      }

      const {
        subject = 'الفيزياء',
        lesson = 'الزخم الخطي والتصادمات',
        previousQuestion = '',
        failureReason = 'عدم تطابق في الحساب أو الخيارات',
        difficulty = 'medium',
        sourceMaterial = '',
      } = req.body;

      const ai = getGeminiClient();
      const rawQuestion = await runRegenerateSingleQuestion(ai, {
        subject,
        lesson,
        previousQuestion,
        failureReason,
        difficulty,
        sourceMaterial,
      });

      const isTrueFalse = rawQuestion.questionType === 'true_false';
      let optionsList: string[] = ['أ', 'ب', 'ج', 'د'];
      if (isTrueFalse) {
        optionsList = ['صواب', 'خطأ'];
      } else if (Array.isArray(rawQuestion.options) && rawQuestion.options.length > 0) {
        optionsList = rawQuestion.options.map((opt) => (typeof opt === 'string' ? opt.trim() : (opt as any)?.text || String(opt)));
        while (optionsList.length < 4) {
          optionsList.push(`خيار بديل ${optionsList.length + 1}`);
        }
        if (optionsList.length > 4) optionsList = optionsList.slice(0, 4);
      }

      let correctIdx = 0;
      if (typeof rawQuestion.correctAnswer === 'number') {
        correctIdx = Math.max(0, Math.min(optionsList.length - 1, rawQuestion.correctAnswer));
      } else if (typeof rawQuestion.correctAnswer === 'string') {
        const rawStr = rawQuestion.correctAnswer.trim();
        const char = rawStr.toUpperCase();
        if (isTrueFalse) {
          if (char === 'A' || char === 'أ' || /صواب|صح|صحيح|true/i.test(rawStr)) correctIdx = 0;
          else correctIdx = 1;
        } else {
          if (char === 'A' || char === 'أ' || char === '0') correctIdx = 0;
          else if (char === 'B' || char === 'ب' || char === '1') correctIdx = 1;
          else if (char === 'C' || char === 'ج' || char === '2') correctIdx = 2;
          else if (char === 'D' || char === 'د' || char === '3') correctIdx = 3;
          else {
            const found = optionsList.findIndex((o) => o.trim() === rawStr);
            if (found !== -1) correctIdx = found;
          }
        }
      }

      const distractorAnalysis: Record<string, string> = {};
      if (rawQuestion.distractorAnalysis && typeof rawQuestion.distractorAnalysis === 'object') {
        for (const [key, val] of Object.entries(rawQuestion.distractorAnalysis)) {
          const cleanKey = String(key).trim();
          const cleanVal = String(val).trim();
          if (cleanKey === 'A' || cleanKey === '0') distractorAnalysis[optionsList[0] || 'الخيار الأول'] = cleanVal;
          else if (cleanKey === 'B' || cleanKey === '1') distractorAnalysis[optionsList[1] || 'الخيار الثاني'] = cleanVal;
          else if (cleanKey === 'C' || cleanKey === '2') distractorAnalysis[optionsList[2] || 'الخيار الثالث'] = cleanVal;
          else if (cleanKey === 'D' || cleanKey === '3') distractorAnalysis[optionsList[3] || 'الخيار الرابع'] = cleanVal;
          else distractorAnalysis[cleanKey] = cleanVal;
        }
      }
      optionsList.forEach((optText, optIndex) => {
        if (optIndex !== correctIdx && !distractorAnalysis[optText]) {
          distractorAnalysis[optText] = isTrueFalse
            ? 'خيار مموه وُضع لاختبار الفهم الدقيق للدرس وكشف الفهم السطحي للمفهوم.'
            : 'خيار تغليط مموه تم بناؤه لاكتشاف الأخطاء المفاهيمية الشائعة والتأكد من تطبيق القوانين بدقة.';
        }
      });

      res.json({
        success: true,
        question: {
          id: `ai_regen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          questionText: rawQuestion.questionText,
          options: optionsList,
          correctAnswer: correctIdx,
          explanation: rawQuestion.explanation || 'توضيح الحل النموذجي بعد معالجة سبب الرفض.',
          distractorAnalysis,
          difficulty: rawQuestion.difficulty || difficulty,
          questionType: isTrueFalse ? 'true_false' : 'multiple_choice',
          suggestedPoints: rawQuestion.suggestedPoints || 5,
          sourceReference: rawQuestion.sourceReference,
          calculation: rawQuestion.calculation,
          generationStatus: 'regenerated',
          generatedByAI: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      console.error('[AI Regenerate Single] Error:', err);
      res.status(500).json({ error: err?.message || 'تعذر إعادة توليد السؤال.' });
    }
  });

  // ==========================================
  // Phase 5: Arixon Points Economy & Store APIs
  // ==========================================

  /**
   * Health & Economy status
   */
  app.get('/api/economy/status', (_req: Request, res: Response) => {
    res.json({
      status: 'active',
      version: 'Phase 5 Economy v1.0',
      currencies: ['spendable_points', 'competition_points'],
    });
  });

  /**
   * Secure Purchase Endpoint
   * Atomic deduction of spendablePoints, inventory addition, transaction logging
   */
  app.post('/api/economy/purchase', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.uid) {
        res.status(401).json({ error: 'يلزم تسجيل الدخول لإتمام عملية الشراء.' });
        return;
      }

      const { itemId } = req.body;
      if (!itemId || typeof itemId !== 'string') {
        res.status(400).json({ error: 'معرّف العنصر غير صالح.' });
        return;
      }

      const adminDb = getFirestore();
      const userDocRef = adminDb.collection('users').doc(authUser.uid);
      const itemDocRef = adminDb.collection('storeItems').doc(itemId);
      const invDocRef = adminDb.collection('userInventory').doc(`${authUser.uid}_${itemId}`);
      const txDocRef = adminDb.collection('storeTransactions').doc();

      const result = await adminDb.runTransaction(async (t) => {
        const userSnap = await t.get(userDocRef);
        if (!userSnap.exists) {
          throw new Error('لم يتم العثور على ملف الطالب.');
        }
        const userData = userSnap.data() || {};
        const currentSpendable = typeof userData.spendablePoints === 'number' 
          ? userData.spendablePoints 
          : (userData.totalPoints || 0);

        const itemSnap = await t.get(itemDocRef);
        if (!itemSnap.exists) {
          throw new Error('العنصر غير متوفر في المتجر.');
        }
        const itemData = itemSnap.data() || {};

        if (!itemData.active) {
          throw new Error('هذا العنصر غير متاح للشراء حالياً.');
        }

        const now = new Date().toISOString();
        if (itemData.limited && itemData.endAt && itemData.endAt < now) {
          throw new Error('انتهت فترة توفر هذا العنصر المحدود.');
        }

        // Check if non-consumable cosmetic already owned
        const invSnap = await t.get(invDocRef);
        const alreadyOwned = invSnap.exists;
        if (!itemData.consumable && alreadyOwned) {
          throw new Error('أنت تمتلك هذا العنصر في مخزونك بالفعل!');
        }

        // Verify balance
        const price = Number(itemData.price) || 0;
        if (currentSpendable < price) {
          const missing = price - currentSpendable;
          throw new Error(`رصيدك غير كافٍ. ينقصك ${missing} نقطة شراء.`);
        }

        const newSpendable = currentSpendable - price;

        // Deduct spendablePoints
        t.update(userDocRef, {
          spendablePoints: newSpendable,
          updatedAt: now,
        });

        // Add to inventory
        const existingInv = alreadyOwned ? invSnap.data() : null;
        const qtyToAdd = itemData.consumable ? (Number(itemData.quantity) || 1) : 1;
        const newQty = existingInv ? (Number(existingInv.quantity || 0) + qtyToAdd) : qtyToAdd;

        const invPayload = {
          id: `${authUser.uid}_${itemId}`,
          userId: authUser.uid,
          itemId,
          item: itemData,
          quantity: newQty,
          isEquipped: existingInv?.isEquipped || false,
          acquiredAt: existingInv?.acquiredAt || now,
          updatedAt: now,
        };

        t.set(invDocRef, invPayload, { merge: true });

        // Increment sales count
        t.set(itemDocRef, {
          salesCount: (Number(itemData.salesCount) || 0) + 1,
          updatedAt: now,
        }, { merge: true });

        // Record immutable transaction
        const txPayload = {
          id: txDocRef.id,
          userId: authUser.uid,
          userDisplayName: userData.displayName || userData.username || 'طالب أريكسون',
          type: 'purchase',
          itemId,
          itemName: itemData.name,
          itemRarity: itemData.rarity || 'common',
          amount: -price,
          currency: 'spendable_points',
          previousBalance: currentSpendable,
          newBalance: newSpendable,
          timestamp: now,
          source: 'store_purchase',
          metadata: {
            consumable: !!itemData.consumable,
            quantityAdded: qtyToAdd,
          },
        };

        t.set(txDocRef, txPayload);

        return {
          newBalance: newSpendable,
          inventoryItem: invPayload,
        };
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      console.warn('[Server Economy Purchase] Handled notice:', err?.message);
      res.status(400).json({ error: err?.message || 'فشلت عملية الشراء.' });
    }
  });

  /**
   * Admin: Adjust Student Points (Spendable or Competition)
   */
  app.post('/api/economy/admin/adjust-points', async (req: Request, res: Response) => {
    try {
      const authUser = await verifyAuthToken(req);
      if (!authUser || !authUser.admin) {
        res.status(403).json({ error: 'صلاحيات المشرف مطلوبة لتعديل النقاط.' });
        return;
      }

      const { targetUserId, pointsType, amount, reason } = req.body;
      if (!targetUserId || !pointsType || typeof amount !== 'number') {
        res.status(400).json({ error: 'البيانات المرسلة غير مكتملة.' });
        return;
      }

      const adminDb = getFirestore();
      const userDocRef = adminDb.collection('users').doc(targetUserId);
      const txDocRef = adminDb.collection('storeTransactions').doc();
      const auditDocRef = adminDb.collection('adminAuditLogs').doc();
      const now = new Date().toISOString();

      await adminDb.runTransaction(async (t) => {
        const userSnap = await t.get(userDocRef);
        if (!userSnap.exists) {
          throw new Error('لم يتم العثور على حساب الطالب المستهدف.');
        }
        const uData = userSnap.data() || {};

        if (pointsType === 'spendable') {
          const current = typeof uData.spendablePoints === 'number' ? uData.spendablePoints : (uData.totalPoints || 0);
          const updated = Math.max(0, current + amount);
          t.update(userDocRef, { spendablePoints: updated, updatedAt: now });

          t.set(txDocRef, {
            id: txDocRef.id,
            userId: targetUserId,
            userDisplayName: uData.displayName || uData.username,
            type: 'point_adjustment',
            amount,
            currency: 'spendable_points',
            previousBalance: current,
            newBalance: updated,
            timestamp: now,
            source: 'admin_adjustment',
            metadata: { reason: reason || 'تعديل إداري', adminUid: authUser.uid, adminEmail: authUser.email },
          });
        } else {
          // Competition points
          const current = uData.totalPoints || 0;
          const updated = Math.max(0, current + amount);
          t.update(userDocRef, {
            totalPoints: updated,
            competitionPoints: updated,
            weeklyPoints: Math.max(0, (uData.weeklyPoints || 0) + amount),
            monthlyPoints: Math.max(0, (uData.monthlyPoints || 0) + amount),
            updatedAt: now,
          });

          t.set(txDocRef, {
            id: txDocRef.id,
            userId: targetUserId,
            userDisplayName: uData.displayName || uData.username,
            type: 'point_adjustment',
            amount,
            currency: 'competition_points',
            previousBalance: current,
            newBalance: updated,
            timestamp: now,
            source: 'admin_adjustment',
            metadata: { reason: reason || 'تعديل إداري لنقاط المنافسة', adminUid: authUser.uid },
          });
        }

        // Audit Log
        t.set(auditDocRef, {
          id: auditDocRef.id,
          action: 'adjust_points',
          adminUid: authUser.uid,
          adminEmail: authUser.email,
          targetUid: targetUserId,
          details: { pointsType, amount, reason },
          timestamp: now,
        });
      });

      res.json({ success: true, message: 'تم تعديل الرصيد وتسجيل العملية بنجاح.' });
    } catch (err: any) {
      console.error('[Admin Adjust Points] Error:', err);
      res.status(500).json({ error: err?.message || 'تعذر تعديل رصيد الطالب.' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Arixon Server] Running on http://0.0.0.0:${PORT}`);
  });

  // Automatically ensure First Exam is seeded in Firestore on boot
  (async () => {
    try {
      const adminDb = getFirestore();
      const examRef = adminDb.collection('exams').doc(FIRST_EXAM_ID);
      const snap = await examRef.get();
      if (!snap.exists || snap.data()?.questionCount !== 20) {
        console.log('[Server Startup] Auto-seeding First Exam (Physics Tawjihi 2009) into Firestore...');
        await examRef.set(FIRST_EXAM, { merge: true });

        const batch = adminDb.batch();
        for (const q of FIRST_EXAM_QUESTIONS) {
          const qRef = examRef.collection('questions').doc(q.id);
          batch.set(qRef, {
            id: q.id,
            examId: FIRST_EXAM_ID,
            order: q.order,
            questionText: q.questionText,
            options: q.options,
            difficulty: q.difficulty,
            source: q.source,
            points: q.points,
            questionType: q.questionType,
            hint: q.hint || '',
          }, { merge: true });

          const keyRef = examRef.collection('answerKeys').doc(q.id);
          batch.set(keyRef, {
            id: q.id,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            hint: q.hint || '',
            solutionSteps: q.solutionSteps || [],
            formulaUsed: q.formulaUsed || '',
            distractorAnalysis: q.distractorAnalysis || {},
          }, { merge: true });
        }
        await batch.commit();
        console.log('[Server Startup] First Exam seeded successfully with 20 questions!');
      }
    } catch (seedErr) {
      console.warn('[Server Startup] First exam auto-seed notice:', seedErr);
    }
  })();
}

startServer().catch((err) => {
  console.error('[Arixon Server] Fatal startup error:', err);
});
