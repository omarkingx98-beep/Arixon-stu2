import React from 'react';
import type { StoreItem } from '../../types/economy';
import { 
  X, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { 
  AvatarWithFrame, 
  NameWithEffect, 
  TitleBadge, 
  RarityBadge,
  renderStoreIcon 
} from '../CosmeticRenderer';

interface ItemPreviewModalProps {
  item: StoreItem | null;
  userSpendableBalance: number;
  userPhotoURL?: string | null;
  userDisplayName?: string;
  isOwned?: boolean;
  onClose: () => void;
  onBuy: (item: StoreItem) => void;
}

export const ItemPreviewModal: React.FC<ItemPreviewModalProps> = ({
  item,
  userSpendableBalance,
  userPhotoURL,
  userDisplayName = 'طالب أريكسون',
  isOwned = false,
  onClose,
  onBuy,
}) => {
  if (!item) return null;

  const canAfford = userSpendableBalance >= item.price;
  const missingPoints = item.price - userSpendableBalance;

  // Derive preview attributes based on item type
  const previewFrameId = item.type === 'cosmetic_frame' ? item.id : null;
  const previewEffectId = item.type === 'cosmetic_name_effect' ? item.id : null;
  const previewTitleId = item.type === 'cosmetic_title' ? item.id : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="item-preview-modal-container"
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-scaleUp"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header & Rarity */}
        <div className="text-center pt-2 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <RarityBadge rarity={item.rarity} />
            {item.limited && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                إصدار محدود ⏳
              </span>
            )}
            {item.consumable && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                أداة استهلاكية ({item.quantity || 1} استخدام)
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>{item.name}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {item.description}
          </p>
        </div>

        {/* Live Interactive Preview Box */}
        <div className="my-4 p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-900/90 dark:to-[#161c2d] border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-[11px] font-semibold text-slate-400 mb-3">
            {item.consumable ? 'معاينة الأداة' : 'معاينة المظهر المباشر على بطاقتك'}
          </div>

          {item.consumable ? (
            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-md">
                {renderStoreIcon(item.icon, 'w-10 h-10')}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {item.effectConfig?.descriptionAr || item.name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5">
              <AvatarWithFrame
                photoURL={userPhotoURL}
                displayName={userDisplayName}
                frameId={previewFrameId}
                size="xl"
              />

              <div className="mt-1">
                <NameWithEffect
                  name={userDisplayName}
                  effectId={previewEffectId}
                  className="text-base font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              {previewTitleId && (
                <div className="mt-0.5">
                  <TitleBadge titleId={previewTitleId} />
                </div>
              )}

              {item.type === 'cosmetic_badge' && (
                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <span>{item.previewConfig.badgeIcon || '🎖️'}</span>
                  <span>{item.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Balance & Price Section */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">السعر المطلوب</span>
            <span className="font-black text-slate-900 dark:text-white text-base flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{item.price.toLocaleString()}</span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نقطة شراء</span>
            </span>
          </div>

          <div className="text-left">
            <span className="text-slate-400 block text-[10px]">رصيدك الحالي</span>
            <span className={`font-black text-sm flex items-center justify-end gap-1 ${canAfford ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              <span>{userSpendableBalance.toLocaleString()}</span>
              <span className="text-[10px]">نقطة</span>
            </span>
          </div>
        </div>

        {/* Warning if cannot afford */}
        {!canAfford && (
          <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>ينقصك {missingPoints.toLocaleString()} نقطة شراء للحصول على هذا العنصر.</span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>

          {isOwned ? (
            <button
              disabled
              className="flex-2 py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>مملوك لديك بالفعل</span>
            </button>
          ) : (
            <button
              disabled={!canAfford}
              onClick={() => onBuy(item)}
              className={`flex-2 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                canAfford
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-98'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>شراء الآن</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
