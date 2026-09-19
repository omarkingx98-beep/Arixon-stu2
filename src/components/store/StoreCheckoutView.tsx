import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Check, 
  Copy, 
  Building, 
  Wallet, 
  DollarSign, 
  FileText,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { 
  CartItem, 
  StoreOrder, 
  StoreSettings, 
  StoreCoupon, 
  PaymentMethodId 
} from '../../types/store';
import { createStoreOrder } from '../../lib/storeService';
import { useAuth } from '../../context/AuthContext';

interface StoreCheckoutViewProps {
  cart: CartItem[];
  currency?: string;
  settings: StoreSettings;
  appliedCoupon: StoreCoupon | null;
  couponDiscount: number;
  onBackToCart: () => void;
  onOrderSuccess: (order: StoreOrder) => void;
}

const PALESTINIAN_CITIES = [
  'القدس الشريف',
  'رام الله والبيرة',
  'نابلس',
  'الخليل',
  'جنين',
  'طولكرم',
  'بيت لحم',
  'قلقيلية',
  'أريحا والأغوار',
  'سلفيت',
  'طوباس',
  'غزة',
  'خان يونس',
  'رفح',
  'دير البلح',
  'شمال غزة'
];

export const StoreCheckoutView: React.FC<StoreCheckoutViewProps> = ({
  cart,
  currency = '₪',
  settings,
  appliedCoupon,
  couponDiscount,
  onBackToCart,
  onOrderSuccess,
}) => {
  const { profile } = useAuth();

  // Contact Info
  const [customerName, setCustomerName] = useState(profile?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(profile?.email || '');
  const [customerPhone, setCustomerPhone] = useState(profile?.whatsappGroup || '');

  // Shipping Address (for physical items)
  const hasPhysical = cart.some(i => i.product.type === 'physical');
  const [city, setCity] = useState('رام الله والبيرة');
  const [addressLine, setAddressLine] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment Selection
  const defaultMethod: PaymentMethodId = hasPhysical ? 'cod' : 'jawwal_pay';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(defaultMethod);
  const [paymentReference, setPaymentReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Financials
  const subtotal = cart.reduce((sum, item) => sum + (item.selectedPrice * item.quantity), 0);
  let shippingFee = 0;
  if (hasPhysical) {
    if (settings.freeShippingThreshold && subtotal >= settings.freeShippingThreshold) {
      shippingFee = 0;
    } else {
      shippingFee = settings.shippingFee || 15;
    }
  }
  const total = Math.max(0, subtotal - couponDiscount + shippingFee);

  const handleCopy = (text?: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label || 'copied');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) {
      setErrorMessage('يجب تسجيل الدخول لإتمام الطلب');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('يرجى كتابة الاسم ورقم الهاتف للتواصل');
      return;
    }

    if (hasPhysical && !addressLine.trim()) {
      setErrorMessage('يرجى كتابة العنوان التفصيلي لتسليم الطلب');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const itemsList = cart.map(i => ({
        productId: i.productId,
        productName: i.product.nameAr,
        productType: i.product.type,
        price: i.selectedPrice,
        quantity: i.quantity,
        coverImage: i.product.coverImage,
        digitalContent: i.product.digitalContent
      }));

      const createdOrder = await createStoreOrder({
        userId: profile.uid,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        items: itemsList,
        subtotal,
        couponCode: appliedCoupon?.code,
        discount: couponDiscount,
        shippingFee,
        total,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        shippingAddress: hasPhysical ? {
          city,
          addressLine: addressLine.trim(),
          notes: deliveryNotes.trim()
        } : undefined
      });

      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'فشل إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى السلة وتعديل الكميات</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>دفع آمن ومعتمد 100%</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Fields (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* 1. Contact Information */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              1. معلومات الطالب وبيانات التواصل
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  الاسم الرباعي للطالب *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="محمد أحمد..."
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  رقم الهاتف أو الواتساب *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="059xxxxxxx أو 056xxxxxxx"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  البريد الإلكتروني (لتأكيد استلام الطلب)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address (Only if physical products exist) */}
          {hasPhysical ? (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3.5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>2. عنوان توصيل النسخ المطبوعة</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">
                  توصيل للمنزل أو المدرسة
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    المدينة / المحافظة *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {PALESTINIAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    العنوان التفصيلي (الشارع، البناية، المعلم) *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="قرب مدرسة...، عمارة..."
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    ملاحظات للمندوب أو شركة التوصيل (اختياري)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="التوصيل بعد الساعة 2 ظهراً..."
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
              <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <strong className="font-bold">جميع المنتجات في سلتك رقمية (PDF وباقات)</strong>
                <p className="leading-relaxed opacity-90">
                  لا يتطلب هذا الطلب أي شحن ورقي. سيتم فتح المواد فوراً داخل <strong>"مكتبتي الرقمية"</strong> في حسابك فور مراجعة وتأكيد الدفع.
                </p>
              </div>
            </div>
          )}

          {/* 3. Payment Method Selection */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-3.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              {hasPhysical ? '3.' : '2.'} طريقة الدفع والتحويل
            </h3>

            {/* Payment Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Jawwal Pay */}
              <div
                onClick={() => setPaymentMethod('jawwal_pay')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'jawwal_pay'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Wallet className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex flex-col text-xs">
                  <span>محفظة جوال باي (Jawwal Pay)</span>
                  <span className="text-[10px] text-slate-400 font-normal">تحويل فوري عبر رقم الهاتف</span>
                </div>
              </div>

              {/* PalPay */}
              <div
                onClick={() => setPaymentMethod('palpay')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'palpay'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex flex-col text-xs">
                  <span>محفظة بال بي (PalPay)</span>
                  <span className="text-[10px] text-slate-400 font-normal">عبر تطبيق محفظتي أو نقاط البيع</span>
                </div>
              </div>

              {/* Bank of Palestine */}
              <div
                onClick={() => setPaymentMethod('bop')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'bop'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="flex flex-col text-xs">
                  <span>بنك فلسطين (Bank of Palestine)</span>
                  <span className="text-[10px] text-slate-400 font-normal">إيداع أو تحويل عبر التطبيق البنكي</span>
                </div>
              </div>

              {/* Palestinian Islamic Bank */}
              <div
                onClick={() => setPaymentMethod('pib')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'pib'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building className="w-5 h-5 text-teal-600 shrink-0" />
                <div className="flex flex-col text-xs">
                  <span>البنك الإسلامي الفلسطيني (PIB)</span>
                  <span className="text-[10px] text-slate-400 font-normal">تحويل بنكي مباشر</span>
                </div>
              </div>

              {/* Cash on delivery (only for physical) */}
              {hasPhysical && (
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    paymentMethod === 'cod'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="flex flex-col text-xs">
                    <span>الدفع عند الاستلام (كاش)</span>
                    <span className="text-[10px] text-slate-400 font-normal">عند وصول المندوب لباب بيتك</span>
                  </div>
                </div>
              )}

              {/* Cash via Center */}
              <div
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex flex-col text-xs">
                  <span>نقداً في المركز / المشرف المعتمد</span>
                  <span className="text-[10px] text-slate-400 font-normal">تسليم للمشرف في مدرستك أو المركز</span>
                </div>
              </div>
            </div>

            {/* Instruction Box for Selected Payment Method */}
            <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>بيانات التحويل:</span>
              </div>

              {paymentMethod === 'jawwal_pay' && (
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span>رقم محفظة جوال باي: <strong>{settings.paymentInstructions.jawwalPayWallet || '0599000000'}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.paymentInstructions.jawwalPayWallet || '0599000000', 'jawwal')}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                  >
                    {copiedField === 'jawwal' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {paymentMethod === 'palpay' && (
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span>رقم محفظة PalPay: <strong>{settings.paymentInstructions.palpayWallet || '0599000000'}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.paymentInstructions.palpayWallet || '0599000000', 'palpay')}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                  >
                    {copiedField === 'palpay' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {paymentMethod === 'bop' && (
                <div className="flex flex-col gap-1.5 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span>رقم الحساب: <strong>{settings.paymentInstructions.bopAccount || '0450-123456-001'}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopy(settings.paymentInstructions.bopAccount, 'bop')}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {settings.paymentInstructions.bopIban && (
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>الآيبان: <strong className="font-mono">{settings.paymentInstructions.bopIban}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.paymentInstructions.bopIban, 'iban')}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <span className="text-[11px] text-slate-400">اسم المستفيد: {settings.paymentInstructions.bopName || 'منصة Arixon التعليمية'}</span>
                </div>
              )}

              {paymentMethod === 'pib' && (
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span>رقم حساب البنك الإسلامي: <strong>{settings.paymentInstructions.pibAccount || '12345678'}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.paymentInstructions.pibAccount || '12345678', 'pib')}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  سيتم تجهيز طلبك وشحنه فوراً، وتدفع المبلغ الإجمالي للمندوب عند استلام الطرد الورقي.
                </p>
              )}

              {paymentMethod !== 'cod' && (
                <div className="flex flex-col gap-1 pt-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    رقم المعاملة / الحوالة أو الملاحظة لتأكيد الدفع سريعاً:
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="مثال: رقم الحوالة 83910 أو اسم الحساب المحوّل منه"
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Action (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              ملخص الطلب ({cart.length} منتجات)
            </h4>

            {/* Cart mini preview */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {cart.map((i) => (
                <div key={i.productId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={i.product.coverImage} alt="" className="w-8 h-8 rounded object-cover shrink-0" referrerPolicy="no-referrer" />
                    <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                      {i.product.nameAr}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0 mr-2">
                    {i.selectedPrice * i.quantity} {currency}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{subtotal} {currency}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                  <span>خصم القسيمة ({appliedCoupon?.code}):</span>
                  <span>-{couponDiscount} {currency}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>رسوم التوصيل:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {hasPhysical ? (shippingFee === 0 ? 'مجاني' : `${shippingFee} ${currency}`) : 'مجاني (رقمي)'}
                </span>
              </div>

              <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">المبلغ النهائي المطلوب:</span>
                <div className="flex items-baseline gap-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                  <span>{total}</span>
                  <span className="text-xs font-bold">{currency}</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>جارٍ إرسال وتأكيد الطلب...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد وإرسال الطلب الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
