import React from 'react';
import { 
  CheckCircle2, 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  Download, 
  Truck, 
  Clock, 
  Sparkles,
  FileText
} from 'lucide-react';
import type { StoreOrder } from '../../types/store';

interface StoreOrderSuccessViewProps {
  order: StoreOrder;
  currency?: string;
  onViewOrders: () => void;
  onViewLibrary: () => void;
  onContinueShopping: () => void;
}

export const StoreOrderSuccessView: React.FC<StoreOrderSuccessViewProps> = ({
  order,
  currency = '₪',
  onViewOrders,
  onViewLibrary,
  onContinueShopping,
}) => {
  const hasDigital = order.items.some(i => i.productType === 'digital' || i.productType === 'bundle');
  const hasPhysical = order.items.some(i => i.productType === 'physical');

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center py-10 px-4 animate-fadeIn pb-16">
      {/* Celebration Icon */}
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg border border-emerald-100 dark:border-emerald-900/60 mb-5">
        <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
      </div>

      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mb-2">
        تم استلام طلبك بنجاح!
      </span>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mb-2">
        شكراً لك يا {order.customerName}!
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        تم تسجيل طلبك برقم <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm sm:text-base font-black">#{order.orderNumber}</strong>. سنقوم بمراجعة الدفع وتأكيد طلبك في أقرب وقت.
      </p>

      {/* Order Highlights Box */}
      <div className="w-full bg-white dark:bg-[#0f1422] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3.5 text-right mb-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs text-slate-500 font-medium">رقم الطلب:</span>
          <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
            {order.orderNumber}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs text-slate-500 font-medium">إجمالي المبلغ:</span>
          <div className="flex items-baseline gap-1 font-black text-sm text-blue-600 dark:text-blue-400">
            <span>{order.total}</span>
            <span className="text-xs">{currency}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-xs text-slate-500 font-medium">حالة الدفع الحالية:</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>قيد المراجعة والتدقيق</span>
          </span>
        </div>

        {/* What happens next instructions */}
        <div className="pt-2 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
          <strong className="text-slate-900 dark:text-slate-100 font-bold">الخطوة التالية:</strong>
          {hasDigital && (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
              <Download className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                الملخصات الرقمية وحقائب الامتحانات سيتم فتحها تلقائياً داخل <strong>"مكتبتي الرقمية"</strong> في حسابك فور مراجعة الإدارة لإشعار الدفع.
              </p>
            </div>
          )}

          {hasPhysical && (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                سيتم التواصل معك هاتفياً على الرقم ({order.customerPhone}) لتأكيد شحن النسخ الورقية المطبوعة.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {hasDigital && (
          <button
            onClick={onViewLibrary}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>فتح مكتبتي الرقمية</span>
          </button>
        )}

        <button
          onClick={onViewOrders}
          className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>متابعة طلباتي السابقة</span>
        </button>

        <button
          onClick={onContinueShopping}
          className="px-5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-bold transition-all cursor-pointer"
        >
          العودة للمتجر
        </button>
      </div>
    </div>
  );
};
