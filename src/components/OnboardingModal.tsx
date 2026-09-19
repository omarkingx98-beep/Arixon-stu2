import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createUserProfile, isUsernameTaken } from '../lib/firebase';
import { Logo } from './Logo';
import { 
  User as UserIcon, 
  AtSign, 
  MapPin, 
  Calendar, 
  Lock, 
  MessageCircle, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Shield,
  Sun,
  Moon,
  Wifi
} from 'lucide-react';

export const CITIES = [
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

export const OnboardingModal: React.FC = () => {
  const { user, setProfileOptimistic } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<string>('17');
  const [city, setCity] = useState<string>('🇵🇸 فلسطين - غزة العزة');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [whatsappGroup, setWhatsappGroup] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Populate defaults from Google User
  useEffect(() => {
    if (user) {
      if (user.displayName) setDisplayName(user.displayName);
      if (user.photoURL) {
        setSelectedAvatar(user.photoURL);
      } else {
        setSelectedAvatar(PRESET_AVATARS[0]);
      }
      // Generate default username candidate from email or name
      const candidate = (user.displayName || user.email?.split('@')[0] || 'student')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 15);
      if (candidate) {
        setUsername(candidate);
      }
    }
  }, [user]);

  // Validate username syntax
  const validateUsername = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameStatus('idle');
  };

  const handleNextFromStep1 = async () => {
    setErrorMessage(null);
    if (!displayName.trim()) {
      setErrorMessage('يرجى إدخال اسمك الكامل.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setErrorMessage('اسم المستخدم يجب أن يكون 3 أحرف إنجليزية أو أرقام على الأقل.');
      return;
    }

    // Check availability in Firestore
    setUsernameStatus('checking');
    const taken = await isUsernameTaken(username.trim());
    if (taken) {
      setUsernameStatus('taken');
      setErrorMessage('اسم المستخدم هذا محجوز مسبقاً، يرجى اختيار اسم آخر.');
      return;
    }
    setUsernameStatus('available');
    setStep(2);
  };

  const handleCompleteSetup = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const parsedAge = age ? parseInt(age, 10) : undefined;
      const cleanWhatsapp = whatsappGroup.trim();

      const profile = await createUserProfile(user, {
        displayName: displayName.trim(),
        username: username.trim(),
        age: isNaN(Number(parsedAge)) ? undefined : parsedAge,
        city: city || undefined,
        gender: gender || undefined,
        whatsappGroup: cleanWhatsapp || undefined,
        photoURL: selectedAvatar || user.photoURL || undefined,
      });

      setProfileOptimistic(profile);
    } catch (err: unknown) {
      console.error('Error creating profile:', err);
      const msg = err instanceof Error ? err.message : 'فشل حفظ الملف الشخصي. يرجى إعادة المحاولة.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#090d16] text-slate-900 dark:text-white flex flex-col justify-between transition-colors duration-200 p-4 sm:p-6 md:p-8">
      {/* Top Header Bar with Theme Toggle & Logo */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <Logo size="md" />

        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            id="onboarding-theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (أبيض)' : 'التبديل إلى الوضع الليلي (أسود)'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>الوضع الأبيض</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500" />
                <span>الوضع الأسود</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-xl mx-auto my-auto py-4">
        <div 
          id="onboarding-modal-card"
          className="w-full bg-white dark:bg-[#111625] rounded-3xl border border-slate-200 dark:border-slate-800/90 shadow-xl p-5 sm:p-8 text-slate-900 dark:text-slate-100 transition-all"
        >
          {/* Header Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إعداد الحساب لأول مرة</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 1 && 'هويتك التنافسية'}
                {step === 2 && 'بياناتك الإضافية (اختيارية)'}
                {step === 3 && 'مراجعة وحفظ الملف الشخصي'}
              </h2>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    step === s 
                      ? 'w-7 bg-blue-600' 
                      : step > s 
                      ? 'w-2 bg-blue-400' 
                      : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Core Required Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                اختر اسم العرض واسم المستخدم الذي سيمثلك في قوائم الصدارة والتحديات.
              </p>

              {/* Display Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="onboarding-display-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: عمر خالد"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] focus:bg-white dark:focus:bg-[#1c263c] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <UserIcon className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              {/* Username */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    اسم المستخدم (Username) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">أحرف إنجليزية وأرقام و _ فقط</span>
                </div>
                <div className="relative">
                  <input
                    id="onboarding-username-input"
                    type="text"
                    dir="ltr"
                    value={username}
                    onChange={(e) => validateUsername(e.target.value)}
                    placeholder="omar_2009"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] focus:bg-white dark:focus:bg-[#1c263c] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide text-left font-mono"
                  />
                  <AtSign className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  {usernameStatus === 'checking' && (
                    <Loader2 className="w-4 h-4 absolute right-3.5 top-3 text-blue-500 animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <Check className="w-4 h-4 absolute right-3.5 top-3 text-emerald-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  سيكون هذا معرّفك الدائم في لوحة الصدارة والتصنيفات.
                </p>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  الصورة الرمزية (Avatar)
                </label>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {user?.photoURL && (
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar(user.photoURL!)}
                      className={`relative rounded-2xl p-0.5 border-2 transition-transform active:scale-95 cursor-pointer ${
                        selectedAvatar === user.photoURL 
                          ? 'border-blue-600 scale-105 shadow-md shadow-blue-500/20' 
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={user.photoURL} 
                        alt="Google avatar" 
                        className="w-12 h-12 rounded-xl object-cover" 
                      />
                      <span className="absolute -bottom-1 -right-1 text-[9px] bg-blue-600 text-white px-1 rounded-full font-bold">
                        Google
                      </span>
                    </button>
                  )}
                  {PRESET_AVATARS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`rounded-2xl p-0.5 border-2 transition-transform active:scale-95 cursor-pointer ${
                        selectedAvatar === avatar 
                          ? 'border-blue-600 scale-105 shadow-md shadow-blue-500/20' 
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={avatar} 
                        alt={`Avatar ${idx + 1}`} 
                        className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-4 flex justify-end">
                <button
                  id="onboarding-step1-next-btn"
                  type="button"
                  onClick={handleNextFromStep1}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <span>المتابعة</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Optional Profile & Privacy Fields */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <span className="font-semibold">سياسة الخصوصية والأمان:</span> هذه الحقول اختيارية ومحمية، ولن يتم كشف بريدك أو تفاصيلك الخاصة في قوائم الصدارة العامة.
                </div>
              </div>

              {/* City / Governorate */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  المحافظة / المدينة <span className="text-xs font-normal text-slate-400">(اختياري)</span>
                </label>
                <div className="relative">
                  <select
                    id="onboarding-city-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] focus:bg-white dark:focus:bg-[#1c263c] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-[#111625] text-slate-900 dark:text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  العمر <span className="text-xs font-normal text-slate-400">(اختياري - مخصص لطلبة توجيهي 2009)</span>
                </label>
                <div className="relative">
                  <input
                    id="onboarding-age-input"
                    type="number"
                    min={14}
                    max={25}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="17"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] focus:bg-white dark:focus:bg-[#1c263c] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <Calendar className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              {/* Gender */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    الجنس <span className="text-xs font-normal text-slate-400">(اختياري وسري)</span>
                  </label>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded">
                    <Lock className="w-2.5 h-2.5" />
                    خاص
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'male', label: 'ذكر' },
                    { id: 'female', label: 'أنثى' },
                    { id: 'prefer_not_to_say', label: 'عدم التحديد' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGender(item.id as typeof gender)}
                      className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        gender === item.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp Group */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  اسم أو رمز مجموعة واتساب <span className="text-xs font-normal text-slate-400">(اختياري للمجموعات الدراسية)</span>
                </label>
                <div className="relative">
                  <input
                    id="onboarding-whatsapp-input"
                    type="text"
                    value={whatsappGroup}
                    onChange={(e) => setWhatsappGroup(e.target.value)}
                    placeholder="مثال: مجموعة توجيهي 2009 العلمي"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-[#182032] focus:bg-white dark:focus:bg-[#1c263c] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <MessageCircle className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <button
                  id="onboarding-step2-next-btn"
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <span>مراجعة وتأكيد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and Finalize */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                تأكد من صحة بياناتك قبل الحفظ، يمكنك تعديلها في أي وقت لاحقاً من قسم الملف الشخصي.
              </p>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#182032]/60 space-y-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={selectedAvatar || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon1'} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white object-cover" 
                  />
                  <div>
                    <h4 className="font-bold text-base">{displayName}</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                      @{username}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 dark:border-slate-700/60 pt-3">
                  <div>
                    <span className="text-slate-400 block">المحافظة:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                      {city || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">العمر:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {age ? `${age} سنة` : 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الجنس:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : 'سري / غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مجموعة واتساب:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                      {whatsappGroup || 'لا يوجد'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Initialization Notice */}
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 p-3 rounded-xl flex items-center gap-2">
                <span>💡</span>
                <span>سيتم تهيئة رصيدك الأولي للنقاط والامتحانات بـ (0 نقطة)، لتبدأ المنافسة العادلة من أول اختبار.</span>
              </div>

              {/* Final Action Buttons */}
              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>تعديل</span>
                </button>

                <button
                  id="onboarding-submit-btn"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteSetup}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جارٍ إنشاء الحساب والمزامنة...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ وبدء الرحلة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info with sync note */}
      <div className="w-full max-w-xl mx-auto pt-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
        <span>منصة Arixon مزودة بخاصية المزامنة السحابية والحفظ التلقائي للبيانات</span>
      </div>
    </div>
  );
};

