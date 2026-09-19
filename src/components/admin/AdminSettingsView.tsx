import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Shield,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { fetchAdminSettings, saveAdminSettings } from '../../lib/adminService';
import type { AdminSettings } from '../../types';

export const AdminSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: 'Arixon Students',
    maintenanceMode: false,
    registrationOpen: true,
    defaultDurationMinutes: 30,
    defaultExamDurationMinutes: 30,
    defaultTotalPoints: 100,
    defaultPointsPerQuestion: 5,
    allowRetakesDefault: true,
    leaderboardVisible: true,
    announcementsEnabled: true,
    challengesEnabled: true,
    leaderboardRefreshMinutes: 5,
    systemNotice: '',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const s = await fetchAdminSettings();
        setSettings(s);
      } catch (err) {
        console.error('Error fetching admin settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      await saveAdminSettings(settings);
      setSuccessMessage('تم حفظ الإعدادات وتطبيقها على مستوى المنظومة بنجاح!');
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-16 text-slate-400 text-xs">
        جارٍ تحميل إعدادات المنظومة...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>إعدادات النظام والمنظومة العامة</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            التحكم في أوضاع الصيانة، التسجيل، المعايير الافتراضية للامتحانات، والرسائل العامة
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* System Availability Card */}
        <div className="bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>إتاحة المنظومة والوصول</span>
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#13192a]">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  وضع الصيانة المؤقتة (Maintenance Mode)
                </span>
                <span className="text-[11px] text-slate-400">
                  عند التفعيل، تظهر شاشة تنبيه بالصيانة لجميع الطلبة ويقتصر الدخول على المشرفين فقط.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#13192a]">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  قبول تسجيل طلبة جدد
                </span>
                <span className="text-[11px] text-slate-400">
                  السماح للطلبة الجدد بإنشاء حسابات توجيهي 2009 عبر المصادقة.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registrationOpen}
                  onChange={(e) =>
                    setSettings({ ...settings, registrationOpen: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Examination Defaults */}
        <div className="bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>المعايير الافتراضية للامتحانات والتقييم</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                المدة الافتراضية للامتحان (دقائق)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={settings.defaultExamDurationMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultExamDurationMinutes: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                نقاط السؤال الافتراضية
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.defaultPointsPerQuestion}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultPointsPerQuestion: Number(e.target.value),
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                السماح بإعادة المحاولة افتراضياً
              </label>
              <select
                value={settings.allowRetakesDefault ? 'true' : 'false'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowRetakesDefault: e.target.value === 'true',
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs font-semibold"
              >
                <option value="true">نعم، مسموح</option>
                <option value="false">لا، محاولة واحدة فقط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Broadcast Notice */}
        <div className="bg-white dark:bg-[#0c101c] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>رسالة التنبيه العلوية العامة (System Banner Notice)</span>
          </h2>
          <p className="text-xs text-slate-400">
            تظهر هذه الرسالة كشريط تنبيه علوي في أعلى الشاشة الرئيسية لجميع المستخدمين عند الرغبة.
          </p>
          <input
            type="text"
            value={settings.systemNotice || ''}
            onChange={(e) => setSettings({ ...settings, systemNotice: e.target.value })}
            placeholder="مثال: مرحباً بكم في منصة أريكسون - تم إطلاق نماذج الفيزياء الوزارية الجديدة لتوجيهي 2009"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#13192a] text-xs"
          />
        </div>
      </form>
    </div>
  );
};
