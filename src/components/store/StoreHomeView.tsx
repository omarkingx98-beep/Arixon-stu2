import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Zap, 
  Flame, 
  Star, 
  ShieldCheck, 
  Truck, 
  Download, 
  FileText,
  Clock,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import type { StoreProduct, StoreCategory, StoreBanner, StoreSettings } from '../../types/store';
import { StoreProductCard } from './StoreProductCard';

interface StoreHomeViewProps {
  products: StoreProduct[];
  categories: StoreCategory[];
  banners: StoreBanner[];
  settings: StoreSettings;
  currency?: string;
  cartProductIds: string[];
  wishlistProductIds: string[];
  onSelectProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onNavigateToCategory: (categoryId: string) => void;
  onOpenCatalog: () => void;
  onOpenLibrary: () => void;
}

export const StoreHomeView: React.FC<StoreHomeViewProps> = ({
  products,
  categories,
  banners,
  settings,
  currency = '₪',
  cartProductIds,
  wishlistProductIds,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  onNavigateToCategory,
  onOpenCatalog,
  onOpenLibrary,
}) => {
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter(p => p.isBestSeller).slice(0, 4);
  const onSaleProducts = products.filter(p => (p.oldPrice && p.oldPrice > p.price) || (p.discountPercentage && p.discountPercentage > 0)).slice(0, 4);

  return (
    <div className="flex flex-col gap-8 animate-fadeIn pb-16">
      {/* 1. Top Store Announcement Banner (if set) */}
      {settings.storeAnnouncement && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
            <span>{settings.storeAnnouncement}</span>
          </div>
          <button
            onClick={onOpenCatalog}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-colors cursor-pointer shrink-0"
          >
            اكتشف العروض
          </button>
        </div>
      )}

      {/* 2. Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 lg:p-12 border border-slate-800 shadow-xl">
        {/* Background glow effects */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>متجر Arixon التعليمي المعتمد • توجيهي 2009</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
            كل ما يلزمك للتفوق في مكان واحد: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">دوسيات، بنوك أسئلة، وحقائب شاملة</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            تصفح مذكرات المواد الأساسية المعدة خصيصاً للمنهاج الفلسطيني لجيل 2009. احصل على نسختك الرقمية فوراً أو اطلب نسختك الورقية الفاخرة حتى باب بيتك.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenCatalog}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-blue-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>تصفح كافة المواد والكتب</span>
            </button>

            <button
              onClick={onOpenLibrary}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-xs sm:text-sm font-bold transition-all border border-white/15 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>مكتبتي الرقمية</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Value Props Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">محتوى معتمد</span>
            <span className="text-[10px] text-slate-500">حسب أحدث تعديلات الوزارة</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">وصول رقمي فوري</span>
            <span className="text-[10px] text-slate-500">تفتح الملفات بمكتبتك فوراً</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">شحن ورقي لكافة المدن</span>
            <span className="text-[10px] text-slate-500">توصيل للمنزل أو المدرسة</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">طرق دفع محلية متعددة</span>
            <span className="text-[10px] text-slate-500">جوال باي، بال بي، بنك فلسطين</span>
          </div>
        </div>
      </div>

      {/* 4. Categories Grid */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
            تصنيفات المواد الدراسية
          </h2>
          <button
            onClick={onOpenCatalog}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigateToCategory(cat.id)}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center text-center gap-2 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform"
                style={{ backgroundColor: cat.color || '#2563eb' }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {cat.nameAr}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Special Offers / Flash Sale Section */}
      {onSaleProducts.length > 0 && (
        <div className="flex flex-col gap-3.5 p-5 rounded-3xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-rose-500 text-white shadow-sm">
                <Flame className="w-4 h-4 fill-white" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100">
                  عروض وتخفيضات خاصة
                </h2>
                <span className="text-[11px] text-rose-700 dark:text-rose-300">
                  وفر حتى 40% على الباقات والدوسيات لفترة محدودة
                </span>
              </div>
            </div>

            <button
              onClick={onOpenCatalog}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>المزيد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {onSaleProducts.map((p) => (
              <StoreProductCard
                key={p.id}
                product={p}
                currency={currency}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                isInCart={cartProductIds.includes(p.id)}
                isInWishlist={wishlistProductIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Featured Products */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              أبرز المنتجات المختارة
            </h2>
          </div>
          <button
            onClick={onOpenCatalog}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>عرض المتجر بالكامل</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4)).map((p) => (
            <StoreProductCard
              key={p.id}
              product={p}
              currency={currency}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              isInCart={cartProductIds.includes(p.id)}
              isInWishlist={wishlistProductIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </div>

      {/* 7. Promotional Digital Library Box */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-sky-600 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="flex flex-col gap-2 max-w-xl text-center sm:text-right">
          <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold self-center sm:self-start">
            ميزة حصرية لطلبة Arixon
          </span>
          <h3 className="text-lg sm:text-2xl font-black">
            مكتبتك التعليمية الرقمية ترافقك أينما ذهبت
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
            جميع الملخصات والأسئلة التي تقتنيها تُحفظ في حسابك للأبد. يمكنك قراءتها من الهاتف أو الحاسوب، أو طباعتها على ورق بجودة فائقة الدقة.
          </p>
        </div>

        <button
          onClick={onOpenLibrary}
          className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-blue-700 text-xs sm:text-sm font-black transition-all shadow-md shrink-0 cursor-pointer"
        >
          الدخول إلى مكتبتي الآن
        </button>
      </div>

      {/* 8. Best Sellers */}
      {bestSellers.length > 0 && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                الأكثر طلباً من طلبة التوجيهي
              </h2>
            </div>
            <button
              onClick={onOpenCatalog}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestSellers.map((p) => (
              <StoreProductCard
                key={p.id}
                product={p}
                currency={currency}
                onSelect={onSelectProduct}
                onAddToCart={onAddToCart}
                isInCart={cartProductIds.includes(p.id)}
                isInWishlist={wishlistProductIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
