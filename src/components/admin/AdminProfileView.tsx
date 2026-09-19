import React from 'react';
import {
  Shield,
  ShieldCheck,
  User,
  Mail,
  Key,
  Calendar,
  Lock,
  ExternalLink,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';

interface AdminProfileViewProps {
  onBackToStudentApp: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({ onBackToStudentApp }) => {
  const { adminProfile, isSuperAdmin } = useAdmin();
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Card */}
      <div className="bg-white dark:bg-[#0c101c] p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {adminProfile?.displayName?.charAt(0) || 'O'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {adminProfile?.displayName || 'Omar King X99'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <ShieldCheck className="w-3 h-3" />
                <span>{isSuperAdmin ? 'المشرف العام الأعلى (Super Admin)' : 'مشرف إداري'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {adminProfile?.email || user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToStudentApp}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة واجهة الطالب</span>
          </button>

          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Security & Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credentials & System ID Card */}
        <div className="bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span>معلومات المصادقة والأمان</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#13192a]">
              <span className="text-[10px] text-slate-400 block">معرف المستخدم الإداري (Firebase UID):</span>
              <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                {user?.uid || 'authenticated-uid'}
              </code>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#13192a]">
              <span className="text-[10px] text-slate-400 block">مزود تسجيل الدخول (Identity Provider):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google OAuth 2.0' : 'Firebase Auth'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#13192a]">
              <span className="text-[10px] text-slate-400 block">حالة التحقق والصلاحية:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حساب موثق بصلاحيات المشرف العام الكاملة</span>
              </span>
            </div>
          </div>
        </div>

        {/* Assigned System Permissions */}
        <div className="bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>الصلاحيات الإدارية الفعالة (RBAC)</span>
          </h2>

          <ul className="space-y-2 text-xs">
            {[
              'إدارة ونشر الامتحانات وتحديد أوقات البدء والإغلاق',
              'التحكم الكامل في بنك الأسئلة المركزي، التعديل والأرشفة',
              'الاستيراد والتصدير الجماعي للأسئلة بتنسيقات CSV/JSON',
              'توليد الأسئلة الذكية عبر Gemini AI ومراجعتها يدوياً',
              'الاطلاع على بيانات وسجلات الطلاب وتعديل أرصدة النقاط',
              'إمكانية تجميد الحسابات المخالفة وإعادة تفعيلها',
              'إدارة التحديات التنافسية والإعلانات الوزارية',
              'مراقبة سجل العمليات الرقابية الدائم (Audit Trail)',
              'إدارة إعدادات المنظومة الشاملة ووضع الصيانة',
            ].map((perm, idx) => (
              <li key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
