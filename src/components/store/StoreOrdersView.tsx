import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Package, 
  BookOpen, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import type { StoreOrder } from '../../types/store';
import { getUserOrders } from '../../lib/storeService';
import { useAuth } from '../../context/AuthContext';
import { formatArabicDate } from '../../lib/dateUtils';

interface StoreOrdersViewProps {
  currency?: string;
  onViewLibrary: () => void;
  onContinueShopping: () => void;
}

export const StoreOrdersView: React.FC<StoreOrdersViewProps> = ({
  currency = '₪',
  onViewLibrary,
  onContinueShopping,
}) => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.uid) {
      loadOrders();
    }
  }, [profile?.uid]);

  const loadOrders = async () => {
    if (!profile?.uid) return;
    setIsLoading(true);
    try {
      const data = await getUserOrders(profile.uid);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return o.paymentStatus === 'pending';
    if (statusFilter === 'paid') return o.paymentStatus === 'paid';
    return true;
  });

  const getStatusBadge = (order: StoreOrder) => {
    if (order.paymentStatus === 'paid') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>تم الدفع وتأكيد الطلب</span>
        </span>
      );
    }
    if (order.paymentStatus === 'failed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          <span>ملغي / مرفوض</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        <span>قيد مراجعة الدفع</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            طلباتي ومشترياتي
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
            {orders.length} طلبات
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOrders}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
            title="تحديث الطلبات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onViewLibrary}
            className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>مكتبتي الرقمية</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          كافة الطلبات ({orders.length})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'paid'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          الطلبات المؤكدة والمدفوعة ({orders.filter(o => o.paymentStatus === 'paid').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          قيد التدقيق ({orders.filter(o => o.paymentStatus === 'pending').length})
        </button>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          جارٍ تحميل سجل الطلبات...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 px-4 text-center flex flex-col items-center bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
            لا توجد طلبات في هذا القسم
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            استعرض متجر Arixon لاختيار الدوسيات ونماذج الامتحانات المتاحة
          </p>
          <button
            onClick={onContinueShopping}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            تصفح المتجر
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const hasDigital = order.items.some(i => i.productType === 'digital' || i.productType === 'bundle');
            const isPaid = order.paymentStatus === 'paid';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm transition-all"
              >
                {/* Order Top Bar */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-slate-100">
                          #{order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          • {formatArabicDate(order.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {order.items.length} منتجات ({order.items.map(i => i.productName).join('، ')})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400">المجموع:</span>
                      <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                        {order.total} {currency}
                      </span>
                    </div>

                    {getStatusBadge(order)}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4 animate-fadeIn">
                    {/* Items Table */}
                    <div className="flex flex-col gap-2">
                      <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">
                        تفاصيل المنتجات:
                      </h4>
                      {order.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.coverImage && (
                              <img src={item.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {item.productName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                الكمية: {item.quantity} • {item.productType === 'digital' ? 'رقمي PDF' : item.productType === 'bundle' ? 'باقة' : 'مطبوع'}
                              </span>
                            </div>
                          </div>

                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {item.price * item.quantity} {currency}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary & Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <p>طريقة الدفع: <strong>{order.paymentMethod}</strong></p>
                        {order.paymentReference && (
                          <p>المرجع / رقم الحوالة: <strong className="font-mono">{order.paymentReference}</strong></p>
                        )}
                        {order.shippingAddress && (
                          <p>عنوان التوصيل: {order.shippingAddress.city} - {order.shippingAddress.addressLine}</p>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        <p>المجموع الفرعي: {order.subtotal} {currency}</p>
                        {order.discount > 0 && <p className="text-rose-500">الخصم: -{order.discount} {currency}</p>}
                        <p>رسوم التوصيل: {order.shippingFee === 0 ? 'مجاني' : `${order.shippingFee} ${currency}`}</p>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          الإجمالي: {order.total} {currency}
                        </p>
                      </div>
                    </div>

                    {/* Digital Access Direct Action Button */}
                    {hasDigital && (
                      <div className="pt-2 flex justify-end">
                        {isPaid ? (
                          <button
                            onClick={onViewLibrary}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>فتح المواد في مكتبتي الرقمية</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            * سيتم فتح الملفات الرقمية في مكتبتك فور تأكيد الدفع من المشرف.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
