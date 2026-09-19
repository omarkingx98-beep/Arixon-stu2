import React, { useState } from 'react';
import type { UserInventoryItem, StoreItemType } from '../../types/economy';
import type { UserProfile } from '../../types';
import { 
  Package, 
  Sparkles, 
  Check, 
  SlidersHorizontal, 
  ShoppingBag, 
  ExternalLink,
  Info,
  Clock,
  Zap,
  Palette
} from 'lucide-react';
import { 
  AvatarWithFrame, 
  NameWithEffect, 
  TitleBadge, 
  RarityBadge,
  renderStoreIcon 
} from '../CosmeticRenderer';

interface StoreInventoryViewProps {
  inventory: UserInventoryItem[];
  profile: UserProfile;
  onOpenCustomizer: () => void;
  onGoToStoreCatalog: () => void;
}

export const StoreInventoryView: React.FC<StoreInventoryViewProps> = ({
  inventory,
  profile,
  onOpenCustomizer,
  onGoToStoreCatalog,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'consumable' | 'cosmetic'>('all');

  const filteredItems = inventory.filter((inv) => {
    if (filterType === 'consumable') return inv.item.consumable;
    if (filterType === 'cosmetic') return !inv.item.consumable;
    return true;
  });

  const consumablesCount = inventory.filter(i => i.item.consumable).length;
  const cosmeticsCount = inventory.filter(i => !i.item.consumable).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-right">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              حقيبة المخزون والأدوات 🎒
            </h3>
            <p className="text-xs text-slate-300">
              لديك {inventory.length} عنصر مسجل ومحفوظ في حسابك بشكل دائم
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCustomizer}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all active:scale-98 cursor-pointer"
        >
          <Palette className="w-4 h-4" />
          <span>تخصيص المظهر وتجهيز العناصر</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            الكل ({inventory.length})
          </button>
          <button
            onClick={() => setFilterType('cosmetic')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'cosmetic'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            مظاهر تجميلية ({cosmeticsCount})
          </button>
          <button
            onClick={() => setFilterType('consumable')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'consumable'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            أدوات مساعدة للاختبار ({consumablesCount})
          </button>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد عناصر في هذا القسم
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            تصفح متجر أريكسون واقتنِ أدوات المساعدة أو المظاهر التنافسية بنقاط الشراء!
          </p>
          <button
            onClick={onGoToStoreCatalog}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>الانتقال لكتالوج المتجر</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((inv) => {
            const isConsumable = inv.item.consumable;
            const isEquipped = 
              inv.item.id === profile.equippedFrameId ||
              inv.item.id === profile.equippedNameEffectId ||
              inv.item.id === profile.equippedTitleId ||
              inv.item.id === profile.equippedThemeId ||
              (profile.featuredBadgeIds || []).includes(inv.item.id);

            return (
              <div
                key={inv.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                  isEquipped
                    ? 'border-blue-500/80 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131929] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <RarityBadge rarity={inv.item.rarity} />
                    {isConsumable ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        الكمية: {inv.quantity}
                      </span>
                    ) : isEquipped ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        <span>مجهّز حالياً</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 shadow-xs">
                      {inv.item.previewConfig?.badgeIcon ? (
                        <span className="text-xl">{inv.item.previewConfig.badgeIcon}</span>
                      ) : (
                        renderStoreIcon(inv.item.icon, 'w-6 h-6')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {inv.item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {inv.item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  {isConsumable ? (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>يُستخدم تلقائياً أثناء الامتحان</span>
                    </span>
                  ) : (
                    <button
                      onClick={onOpenCustomizer}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>تجهيز في الملف</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400">
                    {new Date(inv.acquiredAt).toLocaleDateString('ar-JO')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
