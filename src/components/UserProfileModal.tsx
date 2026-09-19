import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import {
  getFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  cancelOrRemoveFriendship,
  checkBlockStatus,
  blockUser,
  unblockUser,
  assignRoleFromProfile,
  adjustPointsFromProfile,
} from '../lib/socialService';
import type { UserProfile, FriendshipStatus } from '../types';
import {
  X,
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  ShieldAlert,
  ShieldCheck,
  Star,
  Coins,
  Trophy,
  GraduationCap,
  Calendar,
  MapPin,
  School,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  CosmeticAvatarFrame,
  CosmeticNameEffect,
  CosmeticTitle,
  CosmeticBadgeList,
} from './CosmeticRenderer';
import { RoleBadge } from './RoleBadge';
import { applyStudentOverrides } from '../lib/studentOverrides';

interface UserProfileModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (user: UserProfile) => void;
  onProfileUpdated?: (updatedUser: UserProfile) => void;
  onUserUpdated?: (updatedUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartChat,
  onProfileUpdated,
  onUserUpdated,
}) => {
  const { profile: currentUser } = useAuth();
  const { isAdmin: adminFromContext, isOwner: ownerFromContext } = useAdmin();
  const isAdmin = adminFromContext || ['admin', 'super_admin', 'owner'].includes(currentUser?.role || '');
  const isOwner = ownerFromContext || currentUser?.role === 'owner';

  const [activeUser, setActiveUser] = useState<UserProfile | null>(user);
  const [friendStatus, setFriendStatus] = useState<FriendshipStatus | 'none'>('none');
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [isFriendSender, setIsFriendSender] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(true);

  // Admin role management state
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'student');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleSuccessMessage, setRoleSuccessMessage] = useState<string | null>(null);

  // Admin point adjustment state
  const [pointAmount, setPointAmount] = useState<number>(50);
  const [pointReason, setPointReason] = useState<string>('');
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [pointActionFeedback, setPointActionFeedback] = useState<string | null>(null);

  const isSelf = Boolean(currentUser && user && currentUser.uid === user.uid);

  // Keep activeUser updated when prop changes
  useEffect(() => {
    if (user) {
      const merged = applyStudentOverrides(user);
      setActiveUser(merged);
      if (merged.role) {
        setSelectedRole(merged.role);
      }
    } else {
      setActiveUser(null);
    }
  }, [user]);

  // Listen to live student updates (e.g. points adjusted or role changed)
  useEffect(() => {
    if (!activeUser?.uid) return;

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.studentId === activeUser.uid) {
        setActiveUser((prev) => {
          if (!prev) return null;
          const nextUser = { ...prev };
          if (typeof custom.detail.totalPoints === 'number') {
            nextUser.totalPoints = custom.detail.totalPoints;
            nextUser.competitionPoints = custom.detail.totalPoints;
          }
          if (custom.detail.role) {
            nextUser.role = custom.detail.role;
            setSelectedRole(custom.detail.role);
          }
          return nextUser;
        });
      }
    };

    window.addEventListener('arixon:student_updated', handleUpdate);
    return () => window.removeEventListener('arixon:student_updated', handleUpdate);
  }, [activeUser?.uid]);

  // Load Social & Friendship & Block state
  useEffect(() => {
    if (!isOpen || !currentUser || !activeUser || isSelf) return;

    let isMounted = true;
    setIsLoadingSocial(true);

    async function loadStatus() {
      if (!currentUser || !activeUser) return;
      try {
        const [fStatus, bStatus] = await Promise.all([
          getFriendshipStatus(currentUser.uid, activeUser.uid),
          checkBlockStatus(currentUser.uid, activeUser.uid),
        ]);

        if (isMounted) {
          setFriendStatus(fStatus.status);
          setFriendshipId(fStatus.friendship?.id || null);
          setIsFriendSender(fStatus.isSender);
          setIsBlocked(bStatus.isBlocked);
          setBlockedByMe(bStatus.blockedByMe);
        }
      } catch (err) {
        console.warn('Error loading social status:', err);
      } finally {
        if (isMounted) setIsLoadingSocial(false);
      }
    }

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser, activeUser?.uid, isSelf]);

  // Handle Friend Request / Accept / Cancel
  const handleFriendAction = async () => {
    if (!currentUser || !activeUser || isSelf) return;

    try {
      if (friendStatus === 'none') {
        const newFriendship = await sendFriendRequest(currentUser, activeUser);
        setFriendStatus('pending');
        setFriendshipId(newFriendship.id);
        setIsFriendSender(true);
      } else if (friendStatus === 'pending' && !isFriendSender && friendshipId) {
        // Accept pending request from them
        await acceptFriendRequest(friendshipId);
        setFriendStatus('accepted');
      } else if (friendshipId) {
        // Cancel sent request or unfriend
        await cancelOrRemoveFriendship(friendshipId);
        setFriendStatus('none');
        setFriendshipId(null);
        setIsFriendSender(false);
      }
    } catch (err: any) {
      console.error('Error handling friendship:', err);
    }
  };

  // Handle Block / Unblock
  const handleToggleBlock = async () => {
    if (!currentUser || !activeUser || isSelf) return;

    try {
      if (blockedByMe) {
        await unblockUser(currentUser.uid, activeUser.uid);
        setIsBlocked(false);
        setBlockedByMe(false);
      } else {
        await blockUser(currentUser.uid, activeUser.uid);
        setIsBlocked(true);
        setBlockedByMe(true);
        setFriendStatus('none');
        setFriendshipId(null);
      }
    } catch (err: any) {
      console.error('Error toggling block:', err);
    }
  };

  // Admin: Assign Role (with green star for admin)
  const handleAssignRole = async () => {
    if (!isAdmin || !activeUser || isSelf) return;

    setIsSavingRole(true);
    setRoleSuccessMessage(null);

    const roleTitles: Record<string, string> = {
      owner: 'مالك المنصة',
      super_admin: 'مشرف عام',
      admin: 'مدير',
      teacher: 'معلم',
      moderator: 'مشرف',
      assistant: 'مساعد',
      student: 'طالب',
    };

    try {
      const roleTitleAr = roleTitles[selectedRole] || selectedRole;
      await assignRoleFromProfile(
        activeUser.uid,
        activeUser.displayName || activeUser.username,
        selectedRole,
        roleTitleAr
      );

      const updated = {
        ...activeUser,
        role: selectedRole,
      };
      setActiveUser(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      if (onUserUpdated) onUserUpdated(updated);

      setRoleSuccessMessage(
        selectedRole === 'admin' || selectedRole === 'super_admin'
          ? '🌟 تم تعيين المستخدم كمدير بنجاح! تظهر الآن النجمة الخضراء بجانب اسمه في كل مكان.'
          : `✅ تم تعيين رتبة المستخدم إلى (${roleTitleAr}) بنجاح.`
      );
    } catch (err: any) {
      console.warn('Role assignment local fallback:', err);
      const roleTitleAr = roleTitles[selectedRole] || selectedRole;
      const updated = {
        ...activeUser,
        role: selectedRole,
      };
      setActiveUser(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      if (onUserUpdated) onUserUpdated(updated);
      setRoleSuccessMessage(
        selectedRole === 'admin' || selectedRole === 'super_admin'
          ? '🌟 تم تعيين المستخدم كمدير بنجاح! تظهر الآن النجمة الخضراء بجانب اسمه في كل مكان.'
          : `✅ تم تعيين رتبة المستخدم إلى (${roleTitleAr}) بنجاح.`
      );
    } finally {
      setIsSavingRole(false);
    }
  };

  // Admin: Adjust Points (+ or -)
  const handleAdjustPoints = async (mode: 'add' | 'deduct') => {
    if (!isAdmin || !activeUser || (isSelf && !isOwner) || pointAmount <= 0) return;

    setIsAdjustingPoints(true);
    setPointActionFeedback(null);

    const finalReason = pointReason.trim() || (mode === 'add' ? 'مكافأة تميز إدارية' : 'خصم نقاط إداري');

    try {
      const res = await adjustPointsFromProfile(
        activeUser.uid,
        activeUser.displayName || activeUser.username,
        pointAmount,
        mode,
        finalReason
      );

      const updated = {
        ...activeUser,
        totalPoints: res.newBalance,
        competitionPoints: res.newBalance,
      };
      setActiveUser(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      if (onUserUpdated) onUserUpdated(updated);

      setPointActionFeedback(
        mode === 'add'
          ? `✅ تمت إضافة +${pointAmount} نقطة بنجاح! الرصيد الجديد: ${res.newBalance.toLocaleString()} نقطة.`
          : `✅ تم خصم -${pointAmount} نقطة بنجاح! الرصيد الجديد: ${res.newBalance.toLocaleString()} نقطة.`
      );
      setPointReason('');
    } catch (err: any) {
      console.warn('Point adjustment fallback handled:', err);
      const currentPts = Number(activeUser.totalPoints) || 0;
      const calculatedBalance = mode === 'deduct' ? Math.max(0, currentPts - pointAmount) : currentPts + pointAmount;
      const updated = {
        ...activeUser,
        totalPoints: calculatedBalance,
        competitionPoints: calculatedBalance,
      };
      setActiveUser(updated);
      if (onProfileUpdated) onProfileUpdated(updated);
      if (onUserUpdated) onUserUpdated(updated);
      setPointActionFeedback(
        mode === 'add'
          ? `✅ تمت إضافة +${pointAmount} نقطة بنجاح! الرصيد الجديد: ${calculatedBalance.toLocaleString()} نقطة.`
          : `✅ تم خصم -${pointAmount} نقطة بنجاح! الرصيد الجديد: ${calculatedBalance.toLocaleString()} نقطة.`
      );
    } finally {
      setIsAdjustingPoints(false);
    }
  };

  if (!isOpen || !activeUser) return null;

  return (
    <div
      id="user-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="user-profile-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header with Close */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600/10 via-slate-50 to-white dark:from-blue-950/30 dark:via-[#0e1320] dark:to-[#0e1320] border-b border-slate-100 dark:border-slate-800">
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile Card Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
            <CosmeticAvatarFrame
              photoURL={activeUser.photoURL}
              displayName={activeUser.displayName || activeUser.username}
              frameId={activeUser.equippedFrameId}
              size="lg"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  <CosmeticNameEffect effectId={activeUser.equippedNameEffectId}>
                    {activeUser.displayName || activeUser.username}
                  </CosmeticNameEffect>
                </h2>
                {/* Visual Role Indicator / Green Star for Admin */}
                <RoleBadge role={activeUser.role} size="md" />
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold" dir="ltr">
                  @{activeUser.username}
                </span>
                {activeUser.equippedTitleId && (
                  <CosmeticTitle titleId={activeUser.equippedTitleId} />
                )}
              </div>

              {activeUser.featuredBadgeIds && activeUser.featuredBadgeIds.length > 0 && (
                <div className="mt-2 flex justify-center sm:justify-start">
                  <CosmeticBadgeList badgeIds={activeUser.featuredBadgeIds} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Main Action Buttons: Chat / Add Friend / Block */}
          {!isSelf && (
            <div className="grid grid-cols-3 gap-2">
              {/* Chat Button */}
              <button
                id="start-chat-from-profile-btn"
                onClick={() => {
                  onClose();
                  onStartChat(activeUser);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>محادثة</span>
              </button>

              {/* Friend Button */}
              <button
                id="friendship-action-btn"
                onClick={handleFriendAction}
                disabled={isLoadingSocial || isBlocked}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 ${
                  friendStatus === 'accepted'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : friendStatus === 'pending'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {isLoadingSocial ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : friendStatus === 'accepted' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>أصدقاء ✔️</span>
                  </>
                ) : friendStatus === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{isFriendSender ? 'طلب معلق' : 'قبول الطلب'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-blue-500" />
                    <span>إضافة صديق</span>
                  </>
                )}
              </button>

              {/* Block Button */}
              <button
                id="block-toggle-btn"
                onClick={handleToggleBlock}
                disabled={isLoadingSocial}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer ${
                  blockedByMe
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                {blockedByMe ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>إلغاء الحظر</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>حظر</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">نقاط التنافس</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {(activeUser.totalPoints || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">امتحانات مكتملة</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {activeUser.examsCompleted || 0}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">الفرع الأكاديمي</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {activeUser.branch || 'علمي / توجيهي 2009'}
              </span>
            </div>
          </div>

          {/* User Details Details */}
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
            {activeUser.school && (
              <div className="flex items-center gap-2">
                <School className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>المدرسة: {activeUser.school}</span>
              </div>
            )}
            {activeUser.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>المدينة / المحافظة: {activeUser.city}</span>
              </div>
            )}
            {activeUser.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>عضو منذ: {new Date(activeUser.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* Admin Control Panel (Visible ONLY to Admins) */}
          {/* ========================================== */}
          {isAdmin && (!isSelf || isOwner) && (
            <div className="mt-6 pt-6 border-t border-dashed border-amber-200 dark:border-amber-900/60 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      لوحة تحكم المشرف {isSelf ? '(حسابك الشخصي للتجربة)' : 'بالطالب'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      صلاحيات حصرية للأدمن لتعيين الرتب، إعطاء النجمة الخضراء وتعديل النقاط
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Role Assignment with Green Star Mention */}
              <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                    <span>تعيين رتبة أو وظيفة للمستخدم:</span>
                  </label>
                  <RoleBadge role={selectedRole} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    id="admin-role-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="student">🎓 طالب عادي (Student)</option>
                    <option value="admin">🌟 مدير (Admin) - نجمة خضراء + إدارة امتحانات ونقاط</option>
                    <option value="super_admin">⭐ مشرف عام (Super Admin) - صلاحيات كاملة</option>
                    <option value="teacher">👨‍🏫 معلم معتمد (Teacher)</option>
                    <option value="moderator">🛡️ مشرف ساحات (Moderator)</option>
                    <option value="assistant">💼 مساعد تعليمي (Assistant)</option>
                  </select>

                  <button
                    id="save-role-btn"
                    onClick={handleAssignRole}
                    disabled={isSavingRole}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    {isSavingRole ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {selectedRole === 'admin'
                        ? 'تعيين كمدير (🌟 نجمة خضراء)'
                        : selectedRole === 'super_admin'
                        ? 'تعيين كمشرف عام'
                        : selectedRole === 'teacher'
                        ? 'تعيين كمعلم'
                        : selectedRole === 'student'
                        ? 'تعيين كطالب'
                        : 'حفظ وتثبيت الرتبة'}
                    </span>
                  </button>
                </div>

                {roleSuccessMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      roleSuccessMessage.includes('🌟') || roleSuccessMessage.includes('✅')
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {roleSuccessMessage}
                  </div>
                )}
              </div>

              {/* 2. Point Adjustment (Add / Deduct Points) */}
              <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blue-500" />
                  <span>تعديل رصيد النقاط التنافسية:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">الكمية</span>
                    <input
                      type="number"
                      id="admin-point-amount"
                      min={1}
                      max={10000}
                      value={pointAmount}
                      onChange={(e) => setPointAmount(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">السبب أو التوضيح</span>
                    <input
                      type="text"
                      id="admin-point-reason"
                      placeholder="مثال: تفوق بالفيزياء، مكافأة..."
                      value={pointReason}
                      onChange={(e) => setPointReason(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="admin-add-points-btn"
                    onClick={() => handleAdjustPoints('add')}
                    disabled={isAdjustingPoints || pointAmount <= 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isAdjustingPoints ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>إضافة (+{pointAmount})</span>
                  </button>

                  <button
                    id="admin-deduct-points-btn"
                    onClick={() => handleAdjustPoints('deduct')}
                    disabled={isAdjustingPoints || pointAmount <= 0}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isAdjustingPoints ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    <span>خصم (-{pointAmount})</span>
                  </button>
                </div>

                {pointActionFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                      pointActionFeedback.includes('✅')
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {pointActionFeedback}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

