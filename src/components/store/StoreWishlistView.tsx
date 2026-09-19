import React from 'react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import type { StoreProduct } from '../../types/store';
import { StoreProductCard } from './StoreProductCard';

interface StoreWishlistViewProps {
  wishlistProducts: StoreProduct[];
  currency?: string;
  cartProductIds: string[];
  onSelectProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
  onBrowseStore: () => void;
}

export const StoreWishlistView: React.FC<StoreWishlistViewProps> = ({
  wishlistProducts,
  currency = '₪',
  cartProductIds,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  onBrowseStore,
}) => {
  if (wishlistProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
          قائمة المفضلة فارغة
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
          يمكنك حفظ الدوسيات والكتب ونماذج الامتحانات المفضلة لديك بالضغط على أيقونة القلب في أي بطاقة منتج للعودة إليها لاحقاً.
        </p>
        <button
          onClick={onBrowseStore}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
        >
          استكشف المتجر
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span>قائمة المفضلة</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
            {wishlistProducts.length} عناصر
          </span>
        </div>

        <button
          onClick={onBrowseStore}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <span>تصفح المزيد</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {wishlistProducts.map((prod) => (
          <StoreProductCard
            key={prod.id}
            product={prod}
            currency={currency}
            onSelect={onSelectProduct}
            onAddToCart={onAddToCart}
            isInCart={cartProductIds.includes(prod.id)}
            isInWishlist={true}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>
    </div>
  );
};
