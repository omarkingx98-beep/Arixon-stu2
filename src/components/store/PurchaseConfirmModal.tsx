import React, { useState } from 'react';
import type { StoreItem, UserInventoryItem } from '../../types/economy';
import { purchaseStoreItem } from '../../lib/pointEconomyService';
import { 
  X, 
  ShoppingBag, 
  Coins, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Trophy
} from 'lucide-react';
import { RarityBadge } from '../CosmeticRenderer';

interface PurchaseConfirmModalProps {
  item: StoreItem | null;
  userId: string;
  userDisplayName?: string;
  userSpendableBalance: number;
  userCompetitionBalance: number;
  onClose: () => void;
  onSuccess: (newItem: UserInventoryItem, newBalance: number) => void;
}

export const PurchaseConfirmModal: React.FC<PurchaseConfirmModalProps> = ({
  item,
  userId,
  userDisplayName,
  userSpendableBalance,
  userCompetitionBalance,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!item) return null;

  const remainingSpendable = userSpendableBalance - item.price;
  const canAfford = remainingSpendable >= 0;

  const handleConfirmPurchase = async () => {
    if (!canAfford || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await purchaseStoreItem(userId, item.id, userDisplayName);
      if (result.success && result.inventoryItem && typeof result.newBalance === 'number') {
        setIsDone(true);
        setTimeout(() => {
          onSuccess(result.inventoryItem!, result.newBalance!);
        }, 1200);
      } else {
        setErrorMessage(result.error || 'فشلت عملية الشراء.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'تعذر إتمام الشراء. يرجى إعادة المحاولة.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="purchase-confirm-modal"
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-scaleUp"
      >
        {/* Close Button */}
        {!isProcessing && !isDone && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isDone ? (
          /* Success Screen */
          <div className="py-8 text-center animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              تهانينا! تم الشراء بنجاح 🎉
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              تمت إضافة <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span> إلى مخزونك وأصبح جاهزاً للاستخدام.
            </p>
          </div>
        ) : (
          /* Confirm Screen */
          <>
            <div className="text-center pt-2 pb-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                تأكيد عملية الشراء
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                هل ترغب بإنفاق نقاط الشراء لاقتناء هذا العنصر؟
              </p>
            </div>

            {/* Item Card Overview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.name}
                  </span>
                  <RarityBadge rarity={item.rarity} />
                </div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  {item.price.toLocaleString()} نقطة
                </span>
              </div>

              <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>رصيد نقاط الشراء الحالي:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {userSpendableBalance.toLocaleString()} نقطة
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ثمن العنصر:</span>
                  <span className="font-bold text-red-500">
                    - {item.price.toLocaleString()} نقطة
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold border-t border-dashed border-slate-200 dark:border-slate-700 pt-1.5">
                  <span>الرصيد المتبقي بعد الشراء:</span>
                  <span className={canAfford ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-red-500 font-black'}>
                    {remainingSpendable.toLocaleString()} نقطة
                  </span>
                </div>
              </div>
            </div>

            {/* Competition Points Safety Notice */}
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Trophy className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold block">نقاط المنافسة في أمان تام 🏆</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
                  رصيد المنافسة ولوحة الصدارة الخاص بك ({userCompetitionBalance.toLocaleString()} نقطة) لا يتأثر ولا ينقص إطلاقاً بأي عملية شراء في المتجر.
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={!canAfford || isProcessing}
                onClick={handleConfirmPurchase}
                className={`flex-2 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                  canAfford && !isProcessing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-98'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ معالجة العملية...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>تأكيد الخصم والشراء</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
