import React from 'react';
import type { StoreTransaction } from '../../types/economy';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  Trophy, 
  Zap, 
  ShieldAlert,
  Coins,
  Calendar
} from 'lucide-react';

interface StoreTransactionsViewProps {
  transactions: StoreTransaction[];
  isLoading?: boolean;
}

export const StoreTransactionsView: React.FC<StoreTransactionsViewProps> = ({
  transactions,
  isLoading = false,
}) => {
  const renderTxIcon = (type: StoreTransaction['type']) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
      case 'reward':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
        );
      case 'usage':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Zap className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Receipt className="w-4 h-4" />
          </div>
        );
    }
  };

  const getTypeNameAr = (type: StoreTransaction['type']) => {
    switch (type) {
      case 'purchase': return 'شراء عنصر من المتجر';
      case 'reward': return 'مكافأة تفوق واختبار';
      case 'usage': return 'استهلاك أداة أثناء الامتحان';
      case 'point_adjustment': return 'تعديل إداري معتمد';
      case 'refund': return 'استرداد نقدي للنقاط';
      default: return 'عملية في الحساب';
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              سجل المعاملات ونقاط الشراء 📜
            </h3>
            <p className="text-[11px] text-slate-400">
              سجل تدقيق رقمي غير قابل للتعديل يوثق كل نقطة يتم اكتسابها أو إنفاقها
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {transactions.length} عملية مسجلة
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Receipt className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            لا توجد معاملات مسجلة بعد
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            ستظهر هنا تلقائياً كافة عمليات الشراء، استخدام الأدوات، والمكافآت التي تحصل عليها.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131929] overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80">
          {transactions.map((tx) => {
            const isDeduction = tx.amount < 0;
            const isZero = tx.amount === 0;

            return (
              <div 
                key={tx.id}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {renderTxIcon(tx.type)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {tx.itemName || getTypeNameAr(tx.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{getTypeNameAr(tx.type)}</span>
                      <span>•</span>
                      <span>{new Date(tx.timestamp).toLocaleString('ar-JO')}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left flex-shrink-0">
                  <div className={`font-black text-xs sm:text-sm flex items-center justify-end gap-1 ${
                    isZero
                      ? 'text-slate-500'
                      : isDeduction 
                        ? 'text-red-500' 
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isDeduction ? (
                      <span>{tx.amount.toLocaleString()}</span>
                    ) : isZero ? (
                      <span>استخدام مجاني</span>
                    ) : (
                      <span>+{tx.amount.toLocaleString()}</span>
                    )}
                    {!isZero && <span className="text-[10px] font-bold">نقطة</span>}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-0.5">
                    الرصيد بعد العملية: {tx.newBalance.toLocaleString()} نقطة
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
