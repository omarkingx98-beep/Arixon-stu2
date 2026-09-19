import React, { useState } from 'react';
import type { StoreItem, StoreCategoryType, ItemRarity } from '../../types/economy';
import { 
  ShoppingBag, 
  Sparkles, 
  Flame, 
  Coins, 
  Trophy, 
  Palette, 
  Package, 
  Receipt, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Filter,
  Check,
  Zap,
  Tag
} from 'lucide-react';
import { 
  AvatarWithFrame, 
  NameWithEffect, 
  TitleBadge, 
  RarityBadge,
  renderStoreIcon 
} from '../CosmeticRenderer';

interface StorePointsCatalogViewProps {
  items: StoreItem[];
  ownedItemIds: string[];
  spendableBalance: number;
  competitionBalance: number;
  onPreviewItem: (item: StoreItem) => void;
  onBuyItem: (item: StoreItem) => void;
  onOpenCustomizer: () => void;
  onOpenInventory: () => void;
  onOpenTransactions: () => void;
}

export const StorePointsCatalogView: React.FC<StorePointsCatalogViewProps> = ({
  items,
  ownedItemIds,
  spendableBalance,
  competitionBalance,
  onPreviewItem,
  onBuyItem,
  onOpenCustomizer,
  onOpenInventory,
  onOpenTransactions,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StoreCategoryType | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedRarity !== 'all' && item.rarity !== selectedRarity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  // Highlight featured or limited items
  const featuredItem = items.find(i => i.limited && i.rarity === 'legendary') || items[0];

  return (
    <div className="space-y-6">
      {/* Economy Balances Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/50 to-slate-900/60 border border-blue-500/20 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Balances Display */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center md:justify-start">
          {/* Spendable Points */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-amber-300 font-bold block">
                نقاط الشراء المتاحة (Store)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {spendableBalance.toLocaleString()}
                </span>
                <span className="text-xs text-amber-400/80 font-bold">نقطة</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-px bg-slate-700/60" />

          {/* Competition Points */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-blue-300 font-bold block">
                نقاط المنافسة والتصنيف (Leaderboard)
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {competitionBalance.toLocaleString()}
                </span>
                <span className="text-xs text-blue-400/80 font-bold">نقطة دائمة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Hub Navigation */}
        <div className="flex items-center gap-2 flex-wrap justify-center w-full md:w-auto">
          <button
            onClick={onOpenCustomizer}
            className="px-3.5 py-2 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>تخصيص مظهري</span>
          </button>

          <button
            onClick={onOpenInventory}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>مخزوني ({ownedItemIds.length})</span>
          </button>

          <button
            onClick={onOpenTransactions}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>سجل النقاط</span>
          </button>
        </div>
      </div>

      {/* Featured Spotlight Banner */}
      {featuredItem && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border border-amber-500/30 p-5 sm:p-6 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-right">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-amber-950 shadow-xl shadow-amber-500/30 flex-shrink-0">
                {featuredItem.previewConfig?.badgeIcon ? (
                  <span className="text-3xl">{featuredItem.previewConfig.badgeIcon}</span>
                ) : (
                  renderStoreIcon(featuredItem.icon, 'w-10 h-10')
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-amber-950 shadow-xs">
                    العنصر المميز لهذا الأسبوع ✨
                  </span>
                  <RarityBadge rarity={featuredItem.rarity} />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {featuredItem.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg leading-relaxed">
                  {featuredItem.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
              <button
                onClick={() => onPreviewItem(featuredItem)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة المظهر</span>
              </button>

              <button
                onClick={() => onBuyItem(featuredItem)}
                disabled={ownedItemIds.includes(featuredItem.id)}
                className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  ownedItemIds.includes(featuredItem.id)
                    ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-amber-950 font-black shadow-amber-500/30'
                }`}
              >
                {ownedItemIds.includes(featuredItem.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>مملوك لديك</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>{featuredItem.price.toLocaleString()} نقطة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أداة أو إطار أو لقب..."
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Rarity Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 ml-1 shrink-0">الندرة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'common', label: 'شائع' },
              { id: 'rare', label: 'نادر' },
              { id: 'epic', label: 'ملحمي' },
              { id: 'legendary', label: 'أسطوري' },
              { id: 'mythic', label: 'خرافي' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRarity(r.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRarity === r.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'كافة الأقسام 🌐' },
            { id: 'exam_consumables', label: 'أدوات الامتحان ⚡' },
            { id: 'avatar_frames', label: 'إطارات الصور 🖼️' },
            { id: 'name_effects', label: 'تأثيرات الاسم ✨' },
            { id: 'honor_titles', label: 'الألقاب الشرفية 🎖️' },
            { id: 'badges', label: 'شارات الإنجاز 🏅' },
            { id: 'profile_themes', label: 'مظاهر الملف 🎨' },
            { id: 'limited_bundles', label: 'حزم محدودة ⏳' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-[#111625] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Store Catalog Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            لم يتم العثور على عناصر تطابق البحث
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            جرب اختيار قسم آخر أو تغيير معايير البحث والندرة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isOwned = !item.consumable && ownedItemIds.includes(item.id);
            const canAfford = spendableBalance >= item.price;

            return (
              <div
                key={item.id}
                className="group p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131929] hover:border-blue-500/50 transition-all shadow-xs hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between mb-3">
                    <RarityBadge rarity={item.rarity} />
                    {item.limited && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25">
                        محدود ⏳
                      </span>
                    )}
                    {item.consumable && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/25">
                        استهلاكي
                      </span>
                    )}
                  </div>

                  {/* Icon / Avatar Preview */}
                  <div className="h-28 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-[#171e31] border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-3 group-hover:scale-102 transition-transform">
                    {item.type === 'cosmetic_frame' ? (
                      <AvatarWithFrame
                        photoURL="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon1"
                        frameId={item.id}
                        size="lg"
                      />
                    ) : item.type === 'cosmetic_name_effect' ? (
                      <div className="text-center">
                        <NameWithEffect
                          name="طالب متميز"
                          effectId={item.id}
                          className="text-lg font-black block"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">تأثير الاسم</span>
                      </div>
                    ) : item.type === 'cosmetic_title' ? (
                      <div className="text-center p-2">
                        <TitleBadge titleId={item.id} className="text-xs" />
                        <span className="text-[10px] text-slate-400 mt-1.5 block">لقب شرفي</span>
                      </div>
                    ) : item.type === 'cosmetic_badge' ? (
                      <div className="flex flex-col items-center">
                        <span className="text-3xl">{item.previewConfig.badgeIcon || '🎖️'}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                          شارة واجهة
                        </span>
                      </div>
                    ) : item.type === 'cosmetic_theme' ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-2xl border-2 border-white dark:border-slate-700 shadow-md"
                          style={{ backgroundColor: item.previewConfig.themeAccent || '#3b82f6' }}
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                        {renderStoreIcon(item.icon, 'w-7 h-7')}
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed h-8">
                    {item.description}
                  </p>
                </div>

                {/* Pricing & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-slate-400">السعر:</span>
                    <div className="flex items-center gap-1 font-black text-sm text-slate-900 dark:text-white">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.price.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">نقطة</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewItem(item)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="معاينة"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {isOwned ? (
                      <button
                        disabled
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>مملوك</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyItem(item)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 active:scale-98'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{canAfford ? 'اقتناء' : 'نقاط غير كافية'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
