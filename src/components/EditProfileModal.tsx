import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../lib/firebase';
import { X, Check, Loader2, User, MapPin, Calendar, MessageCircle, AlertCircle, Shield } from 'lucide-react';

const CITIES = [
  // 🇵🇸 فلسطين الحبيبة
  '🇵🇸 فلسطين - القدس الشريف (العاصمة)',
  '🇵🇸 فلسطين - غزة العزة',
  '🇵🇸 فلسطين - خانيونس',
  '🇵🇸 فلسطين - رفح',
  '🇵🇸 فلسطين - دير البلح',
  '🇵🇸 فلسطين - شمال غزة (جباليا / بيت لاهيا)',
  '🇵🇸 فلسطين - رام الله والبيرة',
  '🇵🇸 فلسطين - نابلس (جبل النار)',
  '🇵🇸 فلسطين - الخليل',
  '🇵🇸 فلسطين - جنين',
  '🇵🇸 فلسطين - طولكرم',
  '🇵🇸 فلسطين - قلقيلية',
  '🇵🇸 فلسطين - بيت لحم',
  '🇵🇸 فلسطين - أريحا',
  '🇵🇸 فلسطين - سلفيت',
  '🇵🇸 فلسطين - طوباس',
  // 🇯🇴 الأردن الشقيق
  '🇯🇴 الأردن - عَمّان (العاصمة)',
  '🇯🇴 الأردن - إربد (عروس الشمال)',
  '🇯🇴 الأردن - الزرقاء',
  '🇯🇴 الأردن - البلقاء (السلط)',
  '🇯🇴 الأردن - مادبا',
  '🇯🇴 الأردن - العقبة',
  '🇯🇴 الأردن - الكرك',
  '🇯🇴 الأردن - معان',
  '🇯🇴 الأردن - الطفيلة',
  '🇯🇴 الأردن - جرش',
  '🇯🇴 الأردن - عجلون',
  '🇯🇴 الأردن - المفرق',
  // أخرى
  '🌍 دولة أخرى / مغترب'
];

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon1',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon2',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon3',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon4',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon5',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon6',
];

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [city, setCity] = useState(profile?.city || 'عَمّان');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '17');
  const [whatsappGroup, setWhatsappGroup] = useState(profile?.whatsappGroup || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || PRESET_AVATARS[0]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!displayName.trim()) {
      setErrorMessage('يرجى إدخال اسم العرض.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const parsedAge = age ? parseInt(age, 10) : undefined;

      await updateUserProfile(profile.uid, {
        displayName: displayName.trim(),
        city: city || undefined,
        age: isNaN(Number(parsedAge)) ? undefined : parsedAge,
        whatsappGroup: whatsappGroup.trim() || undefined,
        photoURL,
      });

      await refreshProfile();
      onClose();
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const msg = err instanceof Error ? err.message : 'فشل تحديث البيانات. يرجى المحاولة مجدداً.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        id="edit-profile-dialog"
        className="w-full max-w-md bg-white dark:bg-[#111625] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 my-8 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h3 className="font-bold text-lg">تعديل الملف الشخصي</h3>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar choice */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
              اختر الصورة الرمزية
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {PRESET_AVATARS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoURL(av)}
                  className={`rounded-xl p-0.5 border-2 transition-transform cursor-pointer ${
                    photoURL === av 
                      ? 'border-blue-600 scale-105' 
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt={`Avatar ${idx + 1}`} className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" />
                </button>
              ))}
            </div>
          </div>

          {/* Username (Read-only identifier) */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">
              اسم المستخدم (ثابت)
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-mono text-sm" dir="ltr">
              @{profile?.username}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              الاسم الظاهر
            </label>
            <div className="relative">
              <input
                id="edit-display-name-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <User className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              المحافظة
            </label>
            <div className="relative">
              <select
                id="edit-city-select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <MapPin className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              العمر
            </label>
            <div className="relative">
              <input
                id="edit-age-input"
                type="number"
                min={14}
                max={25}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* WhatsApp Group */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              اسم أو رمز مجموعة واتساب
            </label>
            <div className="relative">
              <input
                id="edit-whatsapp-input"
                type="text"
                value={whatsappGroup}
                onChange={(e) => setWhatsappGroup(e.target.value)}
                placeholder="مجموعة توجيهي 2009"
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MessageCircle className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              id="save-profile-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
