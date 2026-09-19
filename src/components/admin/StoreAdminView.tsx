import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Tag, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Save, 
  AlertCircle,
  Truck,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import type { 
  StoreProduct, 
  StoreOrder, 
  StoreCoupon, 
  StoreSettings, 
  StoreCategory,
  ProductType
} from '../../types/store';
import { DEFAULT_STORE_SETTINGS } from '../../types/store';
import { 
  getStoreProducts, 
  createStoreProduct, 
  updateStoreProduct, 
  deleteStoreProduct,
  getAllStoreOrders,
  updateOrderPaymentStatus,
  getStoreCoupons,
  createStoreCoupon,
  deleteStoreCoupon,
  getStoreSettings,
  updateStoreSettings,
  getStoreCategories
} from '../../lib/storeService';
import { formatArabicDate } from '../../lib/dateUtils';

type AdminStoreTab = 'products' | 'orders' | 'coupons' | 'settings';

export const StoreAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminStoreTab>('orders');

  // Products state
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Orders state
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<StoreOrder | null>(null);

  // Coupons state
  const [coupons, setCoupons] = useState<StoreCoupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats, ords, coups, sets] = await Promise.all([
        getStoreProducts({ onlyPublished: false }), // get all including unpublished
        getStoreCategories(),
        getAllStoreOrders(),
        getStoreCoupons(),
        getStoreSettings()
      ]);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setCoupons(coups);
      setSettings(sets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: 'paid' | 'pending' | 'failed') => {
    try {
      await updateOrderPaymentStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(prev => prev ? { ...prev, paymentStatus: status } : null);
      }
      showStatus(status === 'paid' ? 'تم تأكيد الدفع وفتح المواد الرقمية للطالب فوراً!' : 'تم تحديث حالة الطلب');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  // Product Form State
  const [productForm, setProductForm] = useState<Partial<StoreProduct>>({
    nameAr: '',
    category: 'الفيزياء',
    categoryId: 'physics',
    type: 'digital',
    price: 35,
    oldPrice: 50,
    stock: 999,
    coverImage: '',
    shortDescriptionAr: '',
    descriptionAr: '',
    isActive: true,
    isFeatured: false,
    isBestSeller: false,
    digitalContent: {
      fileFormat: 'PDF عالي الجودة',
      pageCount: 80,
      fileSize: '15 MB',
      accessInstructionsAr: 'متاح للقراءة الفورية والتحميل'
    }
  });

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      nameAr: '',
      category: categories[0]?.nameAr || 'الفيزياء',
      categoryId: categories[0]?.id || 'physics',
      type: 'digital',
      price: 35,
      oldPrice: 50,
      stock: 999,
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
      shortDescriptionAr: '',
      descriptionAr: '',
      isActive: true,
      isFeatured: false,
      isBestSeller: false,
      digitalContent: {
        fileFormat: 'PDF عالي الجودة',
        pageCount: 80,
        fileSize: '15 MB',
        accessInstructionsAr: 'متاح للقراءة الفورية والتحميل'
      }
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: StoreProduct) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAr?.trim() || !productForm.price) return;

    try {
      if (editingProduct) {
        await updateStoreProduct({ ...productForm, id: editingProduct.id } as Partial<StoreProduct>);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm } as StoreProduct : p));
        showStatus('تم تعديل المنتج بنجاح');
      } else {
        const created = await createStoreProduct(productForm as any);
        setProducts(prev => [created, ...prev]);
        showStatus('تمت إضافة المنتج الجديد بنجاح');
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('فشل حفظ المنتج');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) return;
    try {
      await deleteStoreProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showStatus('تم حذف المنتج');
    } catch (err) {
      console.error(err);
    }
  };

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 15,
    minOrderAmount: 0,
    maxUses: 100,
    isActive: true
  });

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    try {
      const created = await createStoreCoupon({
        code: couponForm.code.toUpperCase().trim(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        usageLimit: Number(couponForm.maxUses) || 999,
        usedCount: 0,
        isActive: true
      });
      setCoupons(prev => [created, ...prev]);
      setIsCouponModalOpen(false);
      setCouponForm({ code: '', discountType: 'percentage', discountValue: 15, minOrderAmount: 0, maxUses: 100, isActive: true });
      showStatus('تم إنشاء الكوبون بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    try {
      await deleteStoreCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      showStatus('تم حذف الكوبون');
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStoreSettings(settings);
      showStatus('تم حفظ إعدادات المتجر وبيانات الدفع بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ الإعدادات');
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.paymentStatus === orderStatusFilter;
  });

  // Filtered Products
  const filteredProducts = products.filter(p => 
    p.nameAr.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16 font-sans">
      {/* Toast */}
      {statusMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Admin Store Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              إدارة متجر Arixon Store
            </h1>
            <p className="text-xs text-slate-500">
              التحكم في المنتجات، تدقيق الطلبات وتفعيل المواد الرقمية، الكوبونات، وإعدادات الشحن والدفع
            </p>
          </div>
        </div>

        <button
          onClick={loadAllData}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 self-end sm:self-center transition-colors cursor-pointer"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>الطلبات والمبيعات</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المنتجات والدوسيات ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'coupons'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>كوبونات الخصم ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات الدفع والشحن</span>
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  orderStatusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
                }`}
              >
                كافة الطلبات ({orders.length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  orderStatusFilter === 'pending' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                بانتظار التأكيد ({orders.filter(o => o.paymentStatus === 'pending').length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  orderStatusFilter === 'paid' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                المدفوعة والمؤكدة ({orders.filter(o => o.paymentStatus === 'paid').length})
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                لا توجد طلبات في هذا القسم
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">رقم الطلب</th>
                      <th className="p-3.5">الطالب وبياناته</th>
                      <th className="p-3.5">المنتجات</th>
                      <th className="p-3.5">المبلغ</th>
                      <th className="p-3.5">طريقة الدفع</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات المراجعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-3.5 font-mono font-black text-slate-900 dark:text-slate-100">
                          #{order.orderNumber}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {formatArabicDate(order.createdAt)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <strong className="block text-slate-900 dark:text-slate-100">
                            {order.customerName}
                          </strong>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {order.customerPhone}
                          </span>
                          {order.shippingAddress && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
                              📍 {order.shippingAddress.city}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 max-w-xs truncate">
                          <span className="text-slate-700 dark:text-slate-300">
                            {order.items.map(i => `${i.productName} (${i.quantity})`).join('، ')}
                          </span>
                        </td>

                        <td className="p-3.5 font-black text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {order.total} {settings.currency}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                            {order.paymentMethod}
                          </span>
                          {order.paymentReference && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              مرجع: {order.paymentReference}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {order.paymentStatus === 'paid' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>مدفوع ومفعل</span>
                            </span>
                          ) : order.paymentStatus === 'failed' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              ملغي
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>قيد المراجعة</span>
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {order.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'paid')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                                title="تأكيد الدفع وفتح المواد الرقمية فوراً"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تأكيد الدفع</span>
                              </button>
                            )}

                            {order.paymentStatus === 'pending' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'failed')}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold transition-all cursor-pointer"
                                title="إلغاء الطلب"
                              >
                                إلغاء
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="عرض التفاصيل الكاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="البحث في المنتجات والدوسيات..."
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleOpenNewProduct}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج أو دوسية جديدة</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">النوع</th>
                    <th className="p-3.5">السعر</th>
                    <th className="p-3.5">المبيعات</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={prod.coverImage} 
                            alt="" 
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {prod.nameAr}
                            </span>
                            {prod.badge && (
                              <span className="text-[10px] text-amber-500 font-bold">
                                {prod.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {prod.category}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800">
                          {prod.type === 'digital' ? 'رقمي' : prod.type === 'bundle' ? 'باقة' : 'ورقي'}
                        </span>
                      </td>

                      <td className="p-3.5 font-black text-blue-600 dark:text-blue-400">
                        {prod.price} {settings.currency}
                      </td>

                      <td className="p-3.5 text-slate-500">
                        {prod.salesCount || 0} عملية بيع
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          prod.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {prod.isActive ? 'نشط ومعروض' : 'معطل'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.nameAr)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              قسائم وكوبونات التخفيض النشطة
            </h3>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء كود خصم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1">
                  <p>قيمة الخصم: <strong>{c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue} ${settings.currency}`}</strong></p>
                  <p>الحد الأدنى للطلب: {c.minOrderAmount || 0} {settings.currency}</p>
                  <p>مرات الاستخدام: {c.usedCount || 0} / {c.maxUses || 'غير محدود'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General & Shipping */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              إعدادات المتجر العامة والشحن
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                العملة المستخدمة
              </label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  رسوم التوصيل الورقي (₪)
                </label>
                <input
                  type="number"
                  value={settings.shippingFee}
                  onChange={(e) => setSettings({ ...settings, shippingFee: Number(e.target.value) })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  الحد الأدنى للشحن المجاني (₪)
                </label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                نص الإعلان أو العرض بأعلى المتجر
              </label>
              <input
                type="text"
                value={settings.storeAnnouncement || ''}
                onChange={(e) => setSettings({ ...settings, storeAnnouncement: e.target.value })}
                placeholder="مثال: خصم 20% لفترة محدودة على كافة دوسيات التوجيهي!"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              بيانات استقبال الدفع والتحويلات
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                رقم محفظة جوال باي (Jawwal Pay)
              </label>
              <input
                type="text"
                value={settings.paymentInstructions.jawwalPayWallet || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentInstructions: { ...settings.paymentInstructions, jawwalPayWallet: e.target.value }
                })}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                رقم محفظة بال بي (PalPay)
              </label>
              <input
                type="text"
                value={settings.paymentInstructions.palpayWallet || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  paymentInstructions: { ...settings.paymentInstructions, palpayWallet: e.target.value }
                })}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  حساب بنك فلسطين
                </label>
                <input
                  type="text"
                  value={settings.paymentInstructions.bopAccount || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentInstructions: { ...settings.paymentInstructions, bopAccount: e.target.value }
                  })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  الآيبان IBAN
                </label>
                <input
                  type="text"
                  value={settings.paymentInstructions.bopIban || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    paymentInstructions: { ...settings.paymentInstructions, bopIban: e.target.value }
                  })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في الإعدادات</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* PRODUCT CREATE/EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f1422] w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج تعليمي جديد'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-bold">اسم المنتج بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameAr || ''}
                    onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                    placeholder="مثال: دوسية الفيزياء الشاملة - الكهرباء والمغناطيسية"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">المادة / التصنيف *</label>
                  <select
                    value={productForm.categoryId || 'physics'}
                    onChange={(e) => {
                      const sel = categories.find(c => c.id === e.target.value);
                      setProductForm({ 
                        ...productForm, 
                        categoryId: e.target.value,
                        category: sel?.nameAr || e.target.value
                      });
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nameAr}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">نوع المنتج *</label>
                  <select
                    value={productForm.type || 'digital'}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value as ProductType })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer"
                  >
                    <option value="digital">رقمي PDF قابل للقراءة والتحميل</option>
                    <option value="physical">مطبوع ورقي يتم شحنه للمنزل</option>
                    <option value="bundle">باقة تعليمية شاملة</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">السعر النهائي (₪) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    value={productForm.oldPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, oldPrice: Number(e.target.value) })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-bold">رابط صورة الغلاف (URL) *</label>
                  <input
                    type="url"
                    required
                    value={productForm.coverImage || ''}
                    onChange={(e) => setProductForm({ ...productForm, coverImage: e.target.value })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-bold">وصف قصير</label>
                  <input
                    type="text"
                    value={productForm.shortDescriptionAr || ''}
                    onChange={(e) => setProductForm({ ...productForm, shortDescriptionAr: e.target.value })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-bold">الوصف الكامل والتفصيلي</label>
                  <textarea
                    rows={3}
                    value={productForm.descriptionAr || ''}
                    onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  />
                </div>

                {/* Digital specific */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col gap-2">
                  <span className="font-bold text-blue-900 dark:text-blue-300">مواصفات الملف الرقمي (تظهر عند الشراء وبالمكتبة):</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="صيغة الملف (مثال: PDF عالي الدقة)"
                      value={productForm.digitalContent?.fileFormat || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        digitalContent: { ...productForm.digitalContent, fileFormat: e.target.value }
                      })}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="عدد الصفحات"
                      value={productForm.digitalContent?.pageCount || ''}
                      onChange={(e) => setProductForm({
                        ...productForm,
                        digitalContent: { ...productForm.digitalContent, pageCount: Number(e.target.value) }
                      })}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isActive ?? true}
                      onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    />
                    <span>نشط في المتجر</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured ?? false}
                      onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    />
                    <span>مميز (Featured)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  حفظ المنتج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUPON CREATE MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f1422] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col gap-4 animate-scaleIn text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm">إنشاء قسيمة خصم جديدة</h3>
              <button onClick={() => setIsCouponModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleSaveCoupon} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold">رمز الكود *</label>
                <input
                  type="text"
                  required
                  placeholder="ARIXON20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold">نوع الخصم</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (₪)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold">القيمة</label>
                  <input
                    type="number"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold cursor-pointer"
                >
                  إنشاء الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f1422] w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 flex flex-col gap-4 animate-scaleIn text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  تفاصيل الطلب #{selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 flex flex-col gap-1">
                <p>اسم الطالب: <strong>{selectedOrderDetails.customerName}</strong></p>
                <p>رقم الهاتف: <strong className="font-mono">{selectedOrderDetails.customerPhone}</strong></p>
                {selectedOrderDetails.customerEmail && <p>البريد: {selectedOrderDetails.customerEmail}</p>}
                {selectedOrderDetails.shippingAddress && (
                  <p>العنوان: {selectedOrderDetails.shippingAddress.city} - {selectedOrderDetails.shippingAddress.addressLine}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">المنتجات:</h4>
                {selectedOrderDetails.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60">
                    <span>{it.productName} (×{it.quantity})</span>
                    <span className="font-bold">{it.price * it.quantity} {settings.currency}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 font-black text-sm">
                <span>المبلغ النهائي:</span>
                <span className="text-blue-600 dark:text-blue-400">{selectedOrderDetails.total} {settings.currency}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedOrderDetails.paymentStatus !== 'paid' && (
                <button
                  onClick={() => handleUpdateOrderStatus(selectedOrderDetails.id, 'paid')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  تأكيد الدفع وتفعيل المواد للطالب
                </button>
              )}
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
