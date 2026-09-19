import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import type { UserInventoryItem, StoreItemType } from '../../types/economy';
import { equipCosmetic, unequipCosmetic } from '../../lib/pointEconomyService';
import { 
  X, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Crown, 
  ShieldCheck, 
  Palette, 
  User, 
  Award,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  AvatarWithFrame, 
  NameWithEffect, 
  TitleBadge, 
  RarityBadge,
  FeaturedBadgesRow 
} from '../CosmeticRenderer';

interface ProfileCustomizationModalProps {
  profile: UserProfile;
  inventory: UserInventoryItem[];
  onClose: () => void;
  onRefreshProfile: () => Promise<void>;
}

export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({
  profile,
  inventory,
  onClose,
  onRefreshProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'frames' | 'effects' | 'titles' | 'badges' | 'themes'>('frames');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filter inventory by cosmetic category
  const frames = inventory.filter(i => i.item.type === 'cosmetic_frame');
  const effects = inventory.filter(i => i.item.type === 'cosmetic_name_effect');
  const titles = inventory.filter(i => i.item.type === 'cosmetic_title');
  const badges = inventory.filter(i => i.item.type === 'cosmetic_badge');
  const themes = inventory.filter(i => i.item.type === 'cosmetic_theme');

  const handleEquip = async (itemId: string, itemType: StoreItemType) => {
    setIsUpdating(itemId);
    try {
      await equipCosmetic(profile.uid, itemId, itemType);
      await onRefreshProfile();
    } catch (err) {
      console.error('Equip error:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUnequip = async (itemType: StoreItemType, itemId?: string) => {
    setIsUpdating(itemId || itemType);
    try {
      await unequipCosmetic(profile.uid, itemType, itemId);
      await onRefreshProfile();
    } catch (err) {
      console.error('Unequip error:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="profile-customization-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/50 border border-fuchsia-200 dark:border-fuchsia-800 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تخصيص مظهري التنافسي
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جهّز الإطارات، التأثيرات، الألقاب، والشارات التي تملكها
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Card Preview */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <AvatarWithFrame
              photoURL={profile.photoURL}
              displayName={profile.displayName}
              frameId={profile.equippedFrameId}
              size="lg"
            />
            <div>
              <NameWithEffect
                name={profile.displayName}
                effectId={profile.equippedNameEffectId}
                className="text-base sm:text-lg font-black text-slate-900 dark:text-white block"
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                  @{profile.username}
                </span>
                <TitleBadge titleId={profile.equippedTitleId} />
              </div>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <span className="text-[10px] text-slate-400 block mb-1">الشارات المثبتة</span>
            <FeaturedBadgesRow badgeIds={profile.featuredBadgeIds} />
            {(!profile.featuredBadgeIds || profile.featuredBadgeIds.length === 0) && (
              <span className="text-xs text-slate-400 italic">لا توجد شارات مثبتة</span>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex px-4 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'frames' as const, label: 'الإطارات', count: frames.length },
            { id: 'effects' as const, label: 'تأثيرات الاسم', count: effects.length },
            { id: 'titles' as const, label: 'الألقاب', count: titles.length },
            { id: 'badges' as const, label: 'الشارات', count: badges.length },
            { id: 'themes' as const, label: 'المظاهر', count: themes.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {activeTab === 'frames' && (
            <div className="space-y-3">
              {profile.equippedFrameId && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    إزالة الإطار والعودة للوضع الافتراضي
                  </span>
                  <button
                    onClick={() => handleUnequip('cosmetic_frame')}
                    className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    إلغاء التجهيز
                  </button>
                </div>
              )}

              {frames.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا تملك أي إطارات حالياً. تصفح المتجر لاقتناء إطارات مميزة!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {frames.map((inv) => {
                    const isEquipped = profile.equippedFrameId === inv.itemId;
                    const loading = isUpdating === inv.itemId;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2d]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AvatarWithFrame
                            photoURL={profile.photoURL}
                            displayName={profile.displayName}
                            frameId={inv.itemId}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {inv.item.name}
                            </div>
                            <RarityBadge rarity={inv.item.rarity} className="mt-1" />
                          </div>
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => isEquipped ? handleUnequip('cosmetic_frame') : handleEquip(inv.itemId, 'cosmetic_frame')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> مجهّز
                            </span>
                          ) : (
                            'تجهيز'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-3">
              {profile.equippedNameEffectId && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    العودة لخط الاسم الافتراضي
                  </span>
                  <button
                    onClick={() => handleUnequip('cosmetic_name_effect')}
                    className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    إلغاء التأثير
                  </button>
                </div>
              )}

              {effects.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا تملك تأثيرات أسماء حالياً. تصفح المتجر لتمييز اسمك!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {effects.map((inv) => {
                    const isEquipped = profile.equippedNameEffectId === inv.itemId;
                    const loading = isUpdating === inv.itemId;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2d]'
                        }`}
                      >
                        <div className="min-w-0">
                          <NameWithEffect
                            name={profile.displayName}
                            effectId={inv.itemId}
                            className="font-bold text-sm block truncate"
                          />
                          <div className="text-[11px] text-slate-400 mt-0.5">{inv.item.name}</div>
                          <RarityBadge rarity={inv.item.rarity} className="mt-1" />
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => isEquipped ? handleUnequip('cosmetic_name_effect') : handleEquip(inv.itemId, 'cosmetic_name_effect')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> مجهّز
                            </span>
                          ) : (
                            'تجهيز'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'titles' && (
            <div className="space-y-3">
              {profile.equippedTitleId && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    إزالة اللقب المعروض
                  </span>
                  <button
                    onClick={() => handleUnequip('cosmetic_title')}
                    className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    إلغاء اللقب
                  </button>
                </div>
              )}

              {titles.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا تملك ألقاباً شرفية حالياً. تصفح المتجر للحصول على لقب!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {titles.map((inv) => {
                    const isEquipped = profile.equippedTitleId === inv.itemId;
                    const loading = isUpdating === inv.itemId;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2d]'
                        }`}
                      >
                        <div>
                          <TitleBadge titleId={inv.itemId} className="text-xs" />
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] truncate">
                            {inv.item.description}
                          </p>
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => isEquipped ? handleUnequip('cosmetic_title') : handleEquip(inv.itemId, 'cosmetic_title')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> مجهّز
                            </span>
                          ) : (
                            'تجهيز'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between">
                <span>يمكنك تثبيت ما يصل إلى 5 شارات مميزة في واجهة ملفك الشخصي.</span>
                <span className="font-bold">
                  {(profile.featuredBadgeIds || []).length} / 5
                </span>
              </div>

              {badges.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا تملك شارات حالياً. حقق إنجازات أو اقتنِ شارات من المتجر!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((inv) => {
                    const isPinned = (profile.featuredBadgeIds || []).includes(inv.itemId);
                    const loading = isUpdating === inv.itemId;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isPinned
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2d]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{inv.item.previewConfig.badgeIcon || '🎖️'}</span>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {inv.item.name}
                            </div>
                            <RarityBadge rarity={inv.item.rarity} className="mt-1" />
                          </div>
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => isPinned ? handleUnequip('cosmetic_badge', inv.itemId) : handleEquip(inv.itemId, 'cosmetic_badge')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isPinned
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPinned ? (
                            'إلغاء التثبيت'
                          ) : (
                            'تثبيت في الواجهة'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-3">
              {themes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  لا تملك مظاهر خاصة حالياً. تصفح المتجر لتغيير طابع بطاقتك!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {themes.map((inv) => {
                    const isEquipped = profile.equippedThemeId === inv.itemId;
                    const loading = isUpdating === inv.itemId;

                    return (
                      <div
                        key={inv.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isEquipped
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161c2d]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center"
                            style={{ backgroundColor: inv.item.previewConfig.themeAccent || '#2563eb' }}
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {inv.item.name}
                            </div>
                            <RarityBadge rarity={inv.item.rarity} className="mt-1" />
                          </div>
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => isEquipped ? handleUnequip('cosmetic_theme') : handleEquip(inv.itemId, 'cosmetic_theme')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {loading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isEquipped ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> مجهّز
                            </span>
                          ) : (
                            'تفعيل'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
