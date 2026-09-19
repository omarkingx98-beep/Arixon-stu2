import React from 'react';
import { 
  Star, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Check, 
  FileText, 
  Package, 
  Sparkles, 
  BookOpen 
} from 'lucide-react';
import type { StoreProduct } from '../../types/store';

interface StoreProductCardProps {
  product: StoreProduct;
  currency?: string;
  onSelect: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  isInCart?: boolean;
  isInWishlist?: boolean;
  onToggleWishlist?: (productId: string, e: React.MouseEvent) => void;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  currency = '₪',
  onSelect,
  onAddToCart,
  isInCart = false,
  isInWishlist = false,
  onToggleWishlist,
}) => {
  const isOutOfStock = product.type === 'physical' && product.stock <= 0;
  const isDigital = product.type === 'digital' || product.type === 'bundle';
  const hasDiscount = !!(product.oldPrice && product.oldPrice > product.price);

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative flex flex-col bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
    >
      {/* Cover Image & Badges Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img 
          src={product.coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'} 
          alt={product.nameAr}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500 text-white shadow-sm flex items-center gap-1">
              <span>خصم</span>
              <span>{product.discountPercentage || Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)}%</span>
            </span>
          )}
          {product.badge && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500 text-white shadow-sm">
              {product.badge}
            </span>
          )}
        </div>

        {/* Top Left: Type Pill & Wishlist button */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold backdrop-blur-md shadow-sm flex items-center gap-1 ${
            product.type === 'digital' 
              ? 'bg-blue-600/90 text-white' 
              : product.type === 'bundle'
              ? 'bg-purple-600/90 text-white'
              : 'bg-emerald-600/90 text-white'
          }`}>
            {product.type === 'digital' ? (
              <>
                <FileText className="w-3 h-3" />
                <span>رقمي PDF</span>
              </>
            ) : product.type === 'bundle' ? (
              <>
                <Sparkles className="w-3 h-3" />
                <span>باقة شاملة</span>
              </>
            ) : (
              <>
                <Package className="w-3 h-3" />
                <span>مطبوع</span>
              </>
            )}
          </span>

          {onToggleWishlist && (
            <button
              onClick={(e) => onToggleWishlist(product.id, e)}
              aria-label="إضافة للمفضلة"
              className={`p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                isInWishlist 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg shadow">
              نفذت الكمية
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
              {product.ratingCount > 0 && (
                <span className="text-slate-400 font-normal">({product.ratingCount})</span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.nameAr}
          </h3>

          {/* Short description */}
          {product.shortDescriptionAr && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.shortDescriptionAr}
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 tracking-tight">
                {product.price}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {currency}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  {product.oldPrice} {currency}
                </span>
              )}
            </div>
            {isDigital && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                وصول فوري للمكتبة الرقمية
              </span>
            )}
          </div>

          <button
            onClick={(e) => onAddToCart(product, e)}
            disabled={isOutOfStock}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
              isInCart
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : isOutOfStock
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>بالسلة</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
