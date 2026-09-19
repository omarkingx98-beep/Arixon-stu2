import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Tag, 
  Check, 
  Sparkles, 
  FileText, 
  Package, 
  Truck, 
  AlertCircle,
  X
} from 'lucide-react';
import type { CartItem, StoreCoupon, StoreSettings } from '../../types/store';
import { validateCoupon } from '../../lib/storeService';

interface StoreCartViewProps {
  cart: CartItem[];
  currency?: string;
  settings: StoreSettings;
  appliedCoupon: StoreCoupon | null;
  couponDiscount: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyCoupon: (coupon: StoreCoupon | null, discountAmount: number) => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const StoreCartView: React.FC<StoreCartViewProps> = ({
  cart,
  currency = '₪',
  settings,
  appliedCoupon,
  couponDiscount,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.selectedPrice * item.quantity), 0);
  const hasPhysical = cart.some(i => i.product.type === 'physical');
  
  // Free shipping rule: if only digital, shipping is 0. If physical, check free shipping threshold
  let shippingFee = 0;
  if (hasPhysical) {
    if (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    } else {
      shippingFee = settings.shippingFee || 15;
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const res = await validateCoupon(couponCodeInput.trim(), subtotal);
      if (res.valid && res.coupon) {
        onApplyCoupon(res.coupon, res.discountAmount);
        setCouponSuccess(res.message);
        setCouponCodeInput('');
      } else {
        setCouponError(res.message);
      }
    } catch (err) {
      setCouponError('حدث خطأ أثناء فحص القسيمة');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onApplyCoupon(null, 0);
    setCouponSuccess(null);
    setCouponError(null);
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
        <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">
          سلة المشتريات فارغة
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          لم تقم بإضافة أي ملخصات أو كتب أو نماذج امتحانية حتى الآن. استكشف متجر Arixon لتجهيز مستلزمات دراستك.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          تصفح المتجر الآن
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            سلة المشتريات
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
            {cart.reduce((s, i) => s + i.quantity, 0)} عناصر
          </span>
        </div>

        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <span>متابعة التسوق</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid: Cart Items (8 Cols) + Summary (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {cart.map((item) => {
            const isDigital = item.product.type === 'digital' || item.product.type === 'bundle';
            return (
              <div 
                key={item.productId}
                className="p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                {/* Image & Title */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <img 
                    src={item.product.coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&auto=format&fit=crop&q=80'} 
                    alt="" 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-slate-100" 
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.product.type === 'digital' 
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                          : item.product.type === 'bundle'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.product.type === 'digital' ? 'رقمي' : item.product.type === 'bundle' ? 'باقة' : 'مطبوع'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.product.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                      {item.product.nameAr}
                    </h3>

                    <div className="flex items-baseline gap-1 text-xs font-black text-blue-600 dark:text-blue-400">
                      <span>{item.selectedPrice}</span>
                      <span>{currency}</span>
                      {item.quantity > 1 && (
                        <span className="text-slate-400 text-[11px] font-normal">
                          (الإجمالي: {item.selectedPrice * item.quantity} {currency})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper / Lock & Delete Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  {isDigital ? (
                    <span className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                      نسخة رقمية واحدة
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition-colors cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition-colors cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="حذف من السلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Coupon Box */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Coupon Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-2.5">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>قسيمة خصم</span>
            </h4>

            {appliedCoupon ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{appliedCoupon.code}</span>
                  <span className="text-[11px] font-normal">
                    (-{couponDiscount} {currency})
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title="إلغاء القسيمة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder="أدخل رمز القسيمة (مثال: ARIXON2009)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCodeInput.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all disabled:opacity-40 cursor-pointer"
                >
                  {couponLoading ? '...' : 'تطبيق'}
                </button>
              </form>
            )}

            {couponError && (
              <span className="text-[11px] text-rose-500 font-medium">
                {couponError}
              </span>
            )}
            {couponSuccess && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {couponSuccess}
              </span>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              ملخص الحساب
            </h4>

            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {subtotal} {currency}
              </span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400 font-bold">
                <span>خصم القسيمة:</span>
                <span>-{couponDiscount} {currency}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>رسوم التوصيل:</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {!hasPhysical ? (
                  <span className="text-emerald-600 dark:text-emerald-400">مجاني (منتجات رقمية)</span>
                ) : shippingFee === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">مجاني</span>
                ) : (
                  `${shippingFee} ${currency}`
                )}
              </span>
            </div>

            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                المجموع الكلي:
              </span>
              <div className="flex items-baseline gap-1 text-xl font-black text-blue-600 dark:text-blue-400">
                <span>{finalTotal}</span>
                <span className="text-xs font-bold">{currency}</span>
              </div>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full mt-3 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>متابعة إتمام الطلب والدفع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
