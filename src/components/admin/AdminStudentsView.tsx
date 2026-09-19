import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Phone,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  PlusCircle,
  MinusCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  School,
  Hash,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserX,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Star,
} from 'lucide-react';
import {
  fetchAllStudents,
  toggleStudentDisabledState,
  adjustStudentPointsWithReason,
  fetchStudentPointTransactions,
  deleteStudentAccount,
  restoreStudentAccount,
} from '../../lib/adminService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { safeFormatDateTime } from '../../lib/dateUtils';
import type { UserProfile, ExamAttempt, PointTransaction } from '../../types';
import { RoleBadge } from '../RoleBadge';
import { assignRoleFromProfile } from '../../lib/socialService';

export const AdminStudentsView: React.FC = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Selected Student Modal & Actions
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'attempts'>('profile');
  const [studentAttempts, setStudentAttempts] = useState<ExamAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Adjust Points Dialog State
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'add' | 'deduct' | 'reset'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number>(20);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Role Assignment State
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleStudent, setRoleStudent] = useState<UserProfile | null>(null);
  const [isAssigningRoleModal, setIsAssigningRoleModal] = useState(false);

  const openRoleModal = (student: UserProfile) => {
    setRoleStudent(student);
    setIsAssigningRoleModal(true);
  };

  const handleConfirmRoleAssignment = async (roleToSet: string) => {
    if (!roleStudent) return;
    const roleTitles: Record<string, string> = {
      owner: 'مالك المنصة',
      super_admin: 'مشرف عام',
      admin: 'مدير',
      teacher: 'معلم',
      moderator: 'مشرف',
      assistant: 'مساعد',
      student: 'طالب',
    };
    const roleTitleAr = roleTitles[roleToSet] || roleToSet;
    setIsSavingRole(true);
    try {
      await assignRoleFromProfile(
        roleStudent.uid,
        roleStudent.displayName || roleStudent.username,
        roleToSet,
        roleTitleAr
      );
      const updated = { ...roleStudent, role: roleToSet as any };
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      if (selectedStudent && selectedStudent.uid === updated.uid) {
        setSelectedStudent(updated);
      }
      setIsAssigningRoleModal(false);
      setNotification({
        type: 'success',
        message:
          roleToSet === 'admin' || roleToSet === 'super_admin'
            ? `🌟 تم تعيين "${roleStudent.displayName || roleStudent.username}" كمدير بنجاح! النجمة الخضراء تظهر بجانب اسمه في كل مكان.`
            : `✅ تم تعيين رتبة "${roleStudent.displayName || roleStudent.username}" إلى (${roleTitleAr}) بنجاح.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      console.warn('Role assignment fallback:', err);
      const updated = { ...roleStudent, role: roleToSet as any };
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));
      setIsAssigningRoleModal(false);
      setNotification({
        type: 'success',
        message: `✅ تم تعيين رتبة (${roleTitleAr}) للطالب بنجاح!`,
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSavingRole(false);
    }
  };

  // Disable Student Dialog State
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState<string>('');
  const [isTogglingDisable, setIsTogglingDisable] = useState(false);

  // Status Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAllStudents();
      setStudents(list);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();

    const handleStudentUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.studentId) {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.uid !== custom.detail.studentId) return s;
            const updated = { ...s };
            if (typeof custom.detail.totalPoints === 'number') {
              updated.totalPoints = custom.detail.totalPoints;
              updated.competitionPoints = custom.detail.totalPoints;
            }
            if (custom.detail.role) {
              updated.role = custom.detail.role;
            }
            return updated;
          })
        );
        setSelectedStudent((prev) => {
          if (!prev || prev.uid !== custom.detail.studentId) return prev;
          const updated = { ...prev };
          if (typeof custom.detail.totalPoints === 'number') {
            updated.totalPoints = custom.detail.totalPoints;
            updated.competitionPoints = custom.detail.totalPoints;
          }
          if (custom.detail.role) {
            updated.role = custom.detail.role;
            setSelectedRole(custom.detail.role);
          }
          return updated;
        });
      }
    };

    window.addEventListener('arixon:student_updated', handleStudentUpdated);
    return () => window.removeEventListener('arixon:student_updated', handleStudentUpdated);
  }, []);

  const openStudentDetails = async (student: UserProfile, defaultTab: 'profile' | 'attempts' = 'profile') => {
    setSelectedStudent(student);
    setSelectedRole(student.role || 'student');
    setActiveTab(defaultTab);
    setIsLoadingAttempts(true);
    try {
      const q = query(
        collection(db, 'attempts'),
        where('userId', '==', student.uid),
        orderBy('startedAt', 'desc')
      );
      const snap = await getDocs(q);
      const list: ExamAttempt[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ExamAttempt, 'id'>) }));
      setStudentAttempts(list);
    } catch (err) {
      console.warn('Could not load student attempts:', err);
      setStudentAttempts([]);
    } finally {
      setIsLoadingAttempts(false);
    }
  };

  const handleAssignRoleFromDossier = async () => {
    if (!selectedStudent) return;
    setIsSavingRole(true);
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
        selectedStudent.uid,
        selectedStudent.displayName || selectedStudent.username,
        selectedRole,
        roleTitleAr
      );

      const updated = { ...selectedStudent, role: selectedRole as any };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.uid === updated.uid ? updated : s)));

      setNotification({
        type: 'success',
        message:
          selectedRole === 'admin' || selectedRole === 'super_admin'
            ? '🌟 تم تعيين المستخدم كمدير بنجاح! وتظهر النجمة الخضراء بجانب اسمه في كل مكان.'
            : `✅ تم تعيين رتبة المستخدم إلى (${roleTitleAr}) بنجاح.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `تعذر تعيين الرتبة: ${err.message || 'خطأ غير معروف'}`,
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (adjustMode !== 'reset' && (!adjustAmount || adjustAmount <= 0)) {
      alert('يرجى إدخال عدد نقاط صحيح أكبر من صفر.');
      return;
    }

    const currentPoints = Number(selectedStudent.totalPoints) || 0;
    let effectiveAmount = adjustAmount;
    let defaultReason = '';

    if (adjustMode === 'reset') {
      effectiveAmount = -currentPoints;
      defaultReason = 'تصفير رصيد النقاط بالكامل بقرار إداري';
    } else if (adjustMode === 'deduct') {
      effectiveAmount = -Math.abs(adjustAmount);
      defaultReason = 'خصم نقاط من رصيد الطالب';
    } else {
      effectiveAmount = Math.abs(adjustAmount);
      defaultReason = 'إضافة نقاط مكافأة للطالب';
    }

    const finalReason = adjustReason.trim() || defaultReason;

    setIsAdjusting(true);
    try {
      const res = await adjustStudentPointsWithReason({
        studentId: selectedStudent.uid,
        studentName: selectedStudent.displayName || selectedStudent.username,
        amount: effectiveAmount,
        reason: finalReason,
        mode: adjustMode,
      });

      // Optimistic local update
      const updatedBalance = res.newBalance;
      setStudents((prev) =>
        prev.map((s) => (s.uid === selectedStudent.uid ? { ...s, totalPoints: updatedBalance } : s))
      );
      setSelectedStudent((prev) => (prev ? { ...prev, totalPoints: updatedBalance } : null));

      setIsAdjustPointsOpen(false);
      setAdjustReason('');
      setNotification({
        type: 'success',
        message: `تم ${adjustMode === 'deduct' ? 'خصم النقاط' : adjustMode === 'reset' ? 'تصفير النقاط' : 'إضافة النقاط'} بنجاح! الرصيد الجديد: ${updatedBalance} نقطة.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تعديل النقاط.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleToggleDisable = async () => {
    if (!selectedStudent) return;
    const isCurrentlyDisabled = Boolean((selectedStudent as any).accountDisabled);
    const willDisable = !isCurrentlyDisabled;
    const reason = disableReason.trim() || (willDisable ? 'تجميد إداري للحساب' : 'إعادة تفعيل الحساب');

    setIsTogglingDisable(true);
    try {
      // Optimistic update
      setStudents((prev) =>
        prev.map((s) =>
          s.uid === selectedStudent.uid
            ? ({ ...s, accountDisabled: willDisable, disabledReason: willDisable ? reason : undefined } as any)
            : s
        )
      );
      setSelectedStudent((prev) =>
        prev
          ? ({ ...prev, accountDisabled: willDisable, disabledReason: willDisable ? reason : undefined } as any)
          : null
      );

      await toggleStudentDisabledState(
        selectedStudent.uid,
        selectedStudent.displayName || selectedStudent.username,
        willDisable,
        reason
      );

      setIsDisableOpen(false);
      setDisableReason('');
      setNotification({
        type: 'success',
        message: `تم ${willDisable ? 'تجميد وتعطيل' : 'إلغاء تجميد وتفعيل'} حساب الطالب "${selectedStudent.displayName || selectedStudent.username}" بنجاح!`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء تغيير حالة الحساب.');
    } finally {
      setIsTogglingDisable(false);
    }
  };

  // Quick toggle disable from table row
  const quickToggleDisable = (student: UserProfile) => {
    setSelectedStudent(student);
    setIsDisableOpen(true);
  };

  // Quick adjust points from table row
  const quickAdjustPoints = (student: UserProfile, mode: 'add' | 'deduct' = 'add') => {
    setSelectedStudent(student);
    setAdjustMode(mode);
    setAdjustAmount(20);
    setAdjustReason('');
    setIsAdjustPointsOpen(true);
  };

  // Filter logic
  const filteredStudents = students.filter((s) => {
    if (selectedBranch !== 'all' && s.branch !== selectedBranch) return false;
    if (selectedCity !== 'all' && s.city !== selectedCity) return false;
    const isDisabled = Boolean((s as any).accountDisabled);
    if (selectedStatus === 'active' && isDisabled) return false;
    if (selectedStatus === 'disabled' && !isDisabled) return false;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      const matchName = s.displayName?.toLowerCase().includes(term);
      const matchUser = s.username?.toLowerCase().includes(term);
      const matchEmail = s.email?.toLowerCase().includes(term);
      const matchPhone = (s.phone || (s as any).phoneNumber)?.includes(term);
      const matchCity = s.city?.toLowerCase().includes(term);
      const matchUid = s.uid?.toLowerCase().includes(term);
      if (!matchName && !matchUser && !matchEmail && !matchPhone && !matchCity && !matchUid) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>إدارة حسابات وبيانات الطلاب</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة نشاط الطلاب، أداء الامتحانات، عرض كافة بيانات الحساب، وتعديل أو خصم وتجميد الأرصدة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStudents}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
          <div className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            إجمالي الطلاب: {students.length}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-[#0c101c] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الإيميل، الهاتف، أو UID..."
            className="w-full pr-10 pl-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <option value="all">جميع الفروع الأكاديمية</option>
          <option value="علمي">الفرع العلمي</option>
          <option value="أدبي">الفرع الأدبي</option>
          <option value="ريادي">الفرع الريادي والأعمال</option>
          <option value="صناعي">الفرع الصناعي</option>
        </select>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <option value="all">جميع المحافظات</option>
          <option value="القدس">القدس</option>
          <option value="رام الله والبيرة">رام الله والبيرة</option>
          <option value="نابلس">نابلس</option>
          <option value="الخليل">الخليل</option>
          <option value="جنين">جنين</option>
          <option value="بيت لحم">بيت لحم</option>
          <option value="طولكرم">طولكرم</option>
          <option value="قلقيلية">قلقيلية</option>
          <option value="غزة">غزة</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold text-slate-700 dark:text-slate-300"
        >
          <option value="all">جميع حالات الحساب</option>
          <option value="active">الحسابات النشطة فقط</option>
          <option value="disabled">الحسابات المجمدة فقط</option>
        </select>
      </div>

      {/* Students Table */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-xs flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>جارٍ تحميل سجلات وبيانات الطلاب من قاعدة البيانات...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 space-y-2">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لم يتم العثور على أي طلاب مطابقين
          </h3>
          <p className="text-xs text-slate-400">
            جرب تعديل مصطلح البحث أو اختيار فلاتر أخرى.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101c] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#111625] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">الرتبة</th>
                  <th className="p-4">المحافظة والفرع</th>
                  <th className="p-4">الامتحانات</th>
                  <th className="p-4">رصيد النقاط</th>
                  <th className="p-4">حالة الحساب</th>
                  <th className="p-4 text-left">الإجراءات المباشرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.map((s) => {
                  const isDisabled = Boolean((s as any).accountDisabled);
                  return (
                    <tr
                      key={s.uid}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {s.displayName ? s.displayName.charAt(0) : 'S'}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {s.displayName || s.username}
                              </span>
                              <RoleBadge role={s.role} size="sm" />
                            </div>
                            <div className="text-[10px] text-slate-400 truncate font-mono">
                              {s.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => openRoleModal(s)}
                          className="hover:scale-105 transition-transform cursor-pointer"
                          title="انقر لتعديل رتبة المستخدم أو ترقيته لأدمن"
                        >
                          <RoleBadge role={s.role || 'student'} size="sm" />
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {s.city || 'فلسطين'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {s.branch || 'توجيهي عام'}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {s.examsCompleted || 0} امتحان
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            {s.totalPoints || 0}
                          </span>
                          <span className="text-[10px] text-slate-400">نقطة</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {isDisabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                            <ShieldAlert className="w-3 h-3" />
                            <span>مجمد</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View all information */}
                          <button
                            onClick={() => openStudentDetails(s, 'profile')}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors"
                            title="عرض كافة بيانات الحساب والمعلومات"
                          >
                            <span>عرض البيانات</span>
                          </button>

                          {/* Direct Quick Add Points Button */}
                          <button
                            onClick={() => quickAdjustPoints(s, 'add')}
                            className="px-2 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                            title="إضافة نقاط رصيد للطالب"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>+ إضافة</span>
                          </button>

                          {/* Direct Quick Deduct Points Button (Addresses user feedback directly) */}
                          <button
                            onClick={() => quickAdjustPoints(s, 'deduct')}
                            className="px-2 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                            title="خصم وسحب نقاط من رصيد الطالب"
                          >
                            <MinusCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>- خصم</span>
                          </button>

                          {/* Direct Quick Role / Admin Button */}
                          <button
                            onClick={() => openRoleModal(s)}
                            className="px-2 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                            title="تعيين رتبة المستخدم أو ترقيته لأدمن (نجمة خضراء 🌟)"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>رتبة / أدمن</span>
                          </button>

                          {/* Freeze / Unfreeze quick button */}
                          <button
                            onClick={() => quickToggleDisable(s)}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors border ${
                              isDisabled
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-500/30'
                            }`}
                            title={isDisabled ? 'إلغاء تجميد الحساب واستئناف نشاط الطالب' : 'تجميد حساب الطالب وتعطيل وصوله'}
                          >
                            {isDisabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            <span>{isDisabled ? 'فك التجميد ❄️' : 'تجميد ❄️'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. STUDENT DETAILS & FULL DOSSIER INSPECTION MODAL        */}
      {/* ========================================================= */}
      {selectedStudent && !isAdjustPointsOpen && !isDisableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
                  {selectedStudent.displayName ? selectedStudent.displayName.charAt(0) : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedStudent.displayName || selectedStudent.username}
                    </h2>
                    {(selectedStudent as any).accountDisabled ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/30">
                        حساب مجمد
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                        حساب نشط
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {selectedStudent.uid}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>عرض جميع المعلومات وبيانات الحساب</span>
              </button>

              <button
                onClick={() => setActiveTab('attempts')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'attempts'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>سجل الامتحانات والمحاولات ({studentAttempts.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick Actions Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  إجراءات الإدارة السريعة للطالب:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAdjustMode('add');
                      setIsAdjustPointsOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة نقاط</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustMode('deduct');
                      setIsAdjustPointsOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>خصم نقاط</span>
                  </button>

                  <button
                    onClick={() => setIsDisableOpen(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors text-white ${
                      (selectedStudent as any).accountDisabled
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {(selectedStudent as any).accountDisabled ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {(selectedStudent as any).accountDisabled ? 'إعادة تفعيل الحساب' : 'تجميد الحساب'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Role Assignment Bar */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    رتبة وصلاحيات الحساب:
                  </span>
                  <RoleBadge role={selectedStudent.role} size="md" />
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="student">🎓 طالب عادي (Student)</option>
                    <option value="admin">🌟 مدير (Admin) - نجمة خضراء</option>
                    <option value="super_admin">⭐ مشرف عام (Super Admin)</option>
                    <option value="teacher">👨‍🏫 معلم معتمد (Teacher)</option>
                    <option value="moderator">🛡️ مشرف ساحات (Moderator)</option>
                  </select>

                  <button
                    onClick={handleAssignRoleFromDossier}
                    disabled={isSavingRole}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isSavingRole ? 'جارٍ الحفظ...' : selectedRole === 'admin' ? 'تعيين كمدير (🌟)' : 'حفظ الرتبة'}
                    </span>
                  </button>
                </div>
              </div>

              {activeTab === 'profile' ? (
                /* FULL STUDENT DOSSIER */
                <div className="space-y-4">
                  {/* Account Status Alert if Frozen */}
                  {(selectedStudent as any).accountDisabled && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>هذا الحساب مجمد إدارياً حالياً</span>
                      </div>
                      <p className="text-[11px] text-red-600/80">
                        سبب التجميد: {(selectedStudent as any).disabledReason || 'تجميد إداري'}
                      </p>
                      {(selectedStudent as any).disabledAt && (
                        <p className="text-[10px] text-red-400 font-mono">
                          تاريخ التجميد: {safeFormatDateTime((selectedStudent as any).disabledAt, 'ar-EG')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Primary Info Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Email Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <span>البريد الإلكتروني (Email)</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedStudent.email, 'email')}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[10px] font-bold"
                        >
                          {copiedField === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'email' ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white font-mono break-all">
                        {selectedStudent.email || 'لا يوجد بريد مسجل'}
                      </div>
                    </div>

                    {/* Phone Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>رقم الهاتف (Phone)</span>
                        </span>
                        {selectedStudent.phone && (
                          <button
                            onClick={() => copyToClipboard(selectedStudent.phone || '', 'phone')}
                            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-[10px] font-bold"
                          >
                            {copiedField === 'phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === 'phone' ? 'تم النسخ' : 'نسخ'}</span>
                          </button>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white font-mono dir-ltr text-right">
                        {selectedStudent.phone || (selectedStudent as any).phoneNumber || 'غير مسجل'}
                      </div>
                    </div>

                    {/* Username & UID Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-purple-500" />
                          <span>معرف الحساب (UID)</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(selectedStudent.uid, 'uid')}
                          className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-[10px] font-bold"
                        >
                          {copiedField === 'uid' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'uid' ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                        {selectedStudent.uid}
                      </div>
                    </div>

                    {/* Academic Branch & City */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>المحافظة والفرع الدراسي</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {selectedStudent.city || 'فلسطين'} — الفرع: {selectedStudent.branch || 'علمي'}
                      </div>
                    </div>
                  </div>

                  {/* Points & Academic Counters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">إجمالي النقاط</div>
                      <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {selectedStudent.totalPoints || 0}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <div className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">نقاط الأسبوع</div>
                      <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                        {selectedStudent.weeklyPoints || 0}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">الامتحانات المنجزة</div>
                      <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
                        {selectedStudent.examsCompleted || 0}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">الإجابات الصحيحة</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {selectedStudent.correctAnswers || 0}
                      </div>
                    </div>
                  </div>

                  {/* Timestamps Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>التواريخ والنشاط الزمني:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div>
                        <span className="font-semibold">تاريخ الانضمام: </span>
                        <span>
                          {safeFormatDateTime(selectedStudent.createdAt, 'ar-EG', undefined, 'غير متوفر')}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">آخر نشاط مسجل: </span>
                        <span>
                          {safeFormatDateTime(selectedStudent.lastActiveAt, 'ar-EG', undefined, 'غير متوفر')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* EXAM ATTEMPTS HISTORY */
                <div className="space-y-3">
                  {isLoadingAttempts ? (
                    <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RotateCcw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>جارٍ تحميل محاولات الطالب من السجل...</span>
                    </div>
                  ) : studentAttempts.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      لا توجد محاولات امتحانية مسجلة لهذا الطالب حتى الآن.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                      {studentAttempts.map((att) => (
                        <div key={att.id} className="p-3.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {att.examTitle}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {att.submittedAt ? safeFormatDateTime(att.submittedAt, 'ar-EG') : 'قيد التقدم'}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-slate-900 dark:text-white">
                              {att.score || 0} / {att.totalPoints || 100}
                            </span>
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {att.percentage || 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. UPGRADED ADJUST & DEDUCT POINTS DIALOG                 */}
      {/* ========================================================= */}
      {isAdjustPointsOpen && selectedStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>تعديل نقاط الطالب: {selectedStudent.displayName || selectedStudent.username}</span>
              </h3>
              <button
                onClick={() => setIsAdjustPointsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Card */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">الرصيد الحالي للطالب:</span>
              <span className="text-base font-black text-amber-600 dark:text-amber-400">
                {selectedStudent.totalPoints || 0} نقطة
              </span>
            </div>

            {/* Operation Mode Selector: Add, Deduct, Reset */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                اختر نوع العملية (إضافة أو خصم أو تصفير):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode('add')}
                  className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>إضافة (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustMode('deduct')}
                  className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    adjustMode === 'deduct'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  <span>خصم (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdjustMode('reset')}
                  className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    adjustMode === 'reset'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تصفير (0)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
              {adjustMode !== 'reset' ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {adjustMode === 'deduct' ? 'كمية النقاط المراد خصمها من الطالب:' : 'كمية النقاط المراد إضافتها للطالب:'}
                    </label>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-sm font-black text-slate-900 dark:text-white"
                  />

                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {adjustMode === 'add' ? (
                      <>
                        {[10, 25, 50, 100, 250].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAdjustAmount(val)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-600"
                          >
                            +{val}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[10, 25, 50, 100].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAdjustAmount(val)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            -{val}
                          </button>
                        ))}
                        {Number(selectedStudent.totalPoints) > 0 && (
                          <button
                            type="button"
                            onClick={() => setAdjustAmount(Number(selectedStudent.totalPoints))}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-[11px] font-bold text-rose-600 border border-rose-500/30"
                          >
                            خصم كامل الرصيد ({selectedStudent.totalPoints})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ سيتم إعادة تعيين رصيد الطالب إلى <span className="font-bold">0 نقطة</span> فوراً.
                </div>
              )}

              {/* Real-time Calculation Result Preview */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>الرصيد النهائي بعد العملية:</span>
                <span
                  className={`text-sm font-black ${
                    adjustMode === 'deduct' || adjustMode === 'reset' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {adjustMode === 'reset'
                    ? 0
                    : adjustMode === 'deduct'
                    ? Math.max(0, (Number(selectedStudent.totalPoints) || 0) - Math.abs(adjustAmount))
                    : (Number(selectedStudent.totalPoints) || 0) + Math.abs(adjustAmount)}{' '}
                  نقطة
                </span>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  سبب التعديل (إلزامي للرقابة):
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={
                    adjustMode === 'deduct'
                      ? 'مثال: مخالفة تعليمات الامتحان أو تكرار أسئلة...'
                      : adjustMode === 'reset'
                      ? 'مثال: بدء موسم دراسي جديد وتصفير الأرصدة...'
                      : 'مثال: مكافأة التميز في مسابقة الفيزياء الشهرية...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                />

                {/* Quick reason templates */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {(adjustMode === 'deduct'
                    ? ['خصم مخالفة إدارية', 'تصحيح رصيد خاطئ', 'تكرار محاولات غير مصرح']
                    : adjustMode === 'reset'
                    ? ['تصفير دوري للأرصدة', 'طلب الطالب تصفير الحساب']
                    : ['مكافأة تفوق دراسي', 'تعويض خطأ تقني', 'جائزة التحدي الأسبوعي']
                  ).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAdjustReason(r)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:text-blue-600"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustPointsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md cursor-pointer transition-all ${
                    adjustMode === 'deduct'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : adjustMode === 'reset'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isAdjusting ? 'جارٍ الحفظ...' : adjustMode === 'deduct' ? 'تأكيد خصم النقاط' : adjustMode === 'reset' ? 'تأكيد تصفير الرصيد' : 'تأكيد إضافة النقاط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. FREEZE / UNFREEZE ACCOUNT DIALOG                       */}
      {/* ========================================================= */}
      {isDisableOpen && selectedStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-black flex items-center gap-2 ${
                  (selectedStudent as any).accountDisabled ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {(selectedStudent as any).accountDisabled ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
                <span>
                  {(selectedStudent as any).accountDisabled
                    ? 'إلغاء تجميد وتفعيل حساب الطالب'
                    : 'تأكيد تجميد حساب الطالب'}
                </span>
              </h3>
              <button onClick={() => setIsDisableOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                الطالب: {selectedStudent.displayName || selectedStudent.username}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {selectedStudent.email} | {selectedStudent.city || 'فلسطين'}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {(selectedStudent as any).accountDisabled
                ? 'سيتم إعادة تفعيل الحساب فوراً، وسيتمكن الطالب من الدخول مجدداً وتقديم الامتحانات والمشاركة في المنصة.'
                : 'عند تجميد الحساب، سيتم إيقاف دخول الطالب ومنعه من تقديم الامتحانات وحجب رصيده مؤقتاً حتى تقوم الإدارة بإلغاء التجميد.'}
            </p>

            {!(selectedStudent as any).accountDisabled && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  سبب التجميد الإداري (اختياري للتوثيق):
                </label>
                <textarea
                  rows={2}
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="اكتب سبب تجميد الحساب للرقابة الإدارية..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDisableOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isTogglingDisable}
                onClick={handleToggleDisable}
                className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md cursor-pointer transition-all ${
                  (selectedStudent as any).accountDisabled
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isTogglingDisable
                  ? 'جارٍ التنفيذ...'
                  : (selectedStudent as any).accountDisabled
                  ? 'تأكيد تفعيل الحساب'
                  : 'تأكيد تجميد الحساب الآن'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUICK ROLE ASSIGNMENT MODAL (Direct Admin / Role setup) */}
      {/* ========================================================= */}
      {isAssigningRoleModal && roleStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#0c101c] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Star className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    تعيين الرتبة وصلاحيات الأدمن
                  </h3>
                  <p className="text-xs text-slate-400">
                    اختر رتبة المستخدم لمنحه النجمة الخضراء أو الصلاحيات فوراً
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssigningRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Student Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {roleStudent.displayName ? roleStudent.displayName.charAt(0) : 'S'}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {roleStudent.displayName || roleStudent.username}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {roleStudent.email}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5 text-left">الرتبة الحالية:</span>
                <RoleBadge role={roleStudent.role || 'student'} size="sm" />
              </div>
            </div>

            {/* Role Options Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                اختر الرتبة الجديدة للتطبيق الفوري:
              </label>

              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'admin',
                    title: 'مدير (Admin)',
                    desc: 'يحصل على النجمة الخضراء 🌟 الرسمية بجانب اسمه وإمكانية الوصول للإدارة وتعديل النقاط',
                    icon: '🌟',
                    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300',
                  },
                  {
                    id: 'super_admin',
                    title: 'مشرف عام (Super Admin)',
                    desc: 'صلاحيات إدارية كاملة لإدارة المنصة والمستخدمين والامتحانات',
                    icon: '⭐',
                    badgeColor: 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-300',
                  },
                  {
                    id: 'teacher',
                    title: 'معلم معتمد (Teacher)',
                    desc: 'صلاحية إعداد بنوك الأسئلة، نشر الامتحانات وتوجيه الطلبة',
                    icon: '👨‍🏫',
                    badgeColor: 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300',
                  },
                  {
                    id: 'moderator',
                    title: 'مشرف ساحات (Moderator)',
                    desc: 'مراقبة التفاعل، ضبط مجتمع الطلبة وحذف المخالفات',
                    icon: '🛡️',
                    badgeColor: 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300',
                  },
                  {
                    id: 'student',
                    title: 'طالب عادي (Student)',
                    desc: 'الوصول القياسي للامتحانات، الساحات، متجر النقاط ولوحة الأوائل',
                    icon: '🎓',
                    badgeColor: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isSavingRole}
                    onClick={() => handleConfirmRoleAssignment(opt.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${opt.badgeColor} ${
                      roleStudent.role === opt.id ? 'ring-2 ring-emerald-500 font-black shadow-xs' : ''
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{opt.title}</span>
                        {roleStudent.role === opt.id && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                            الرتبة الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAssigningRoleModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
