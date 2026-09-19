import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Sparkles, 
  Check, 
  X,
  Package,
  FileText,
  Percent,
  RefreshCw
} from 'lucide-react';
import type { StoreProduct, StoreCategory, ProductType } from '../../types/store';
import { StoreProductCard } from './StoreProductCard';

interface StoreCatalogViewProps {
  products: StoreProduct[];
  categories: StoreCategory[];
  currency?: string;
  cartProductIds: string[];
  wishlistProductIds: string[];
  initialCategory?: string;
  onSelectProduct: (product: StoreProduct) => void;
  onAddToCart: (product: StoreProduct, e: React.MouseEvent) => void;
  onToggleWishlist: (productId: string, e: React.MouseEvent) => void;
}

export const StoreCatalogView: React.FC<StoreCatalogViewProps> = ({
  products,
  categories,
  currency = '₪',
  cartProductIds,
  wishlistProductIds,
  initialCategory = 'all',
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'best_seller' | 'rating'>('newest');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.nameAr.toLowerCase().includes(term) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
        (p.shortDescriptionAr && p.shortDescriptionAr.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory || p.category === selectedCategory);
    }

    // Type
    if (selectedType !== 'all') {
      result = result.filter(p => p.type === selectedType);
    }

    // Sale
    if (onSaleOnly) {
      result = result.filter(p => (p.oldPrice && p.oldPrice > p.price) || (p.discountPercentage && p.discountPercentage > 0));
    }

    // In Stock
    if (inStockOnly) {
      result = result.filter(p => p.type !== 'physical' || p.stock > 0);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'best_seller') return (b.salesCount || 0) - (a.salesCount || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [products, searchQuery, selectedCategory, selectedType, onSaleOnly, inStockOnly, sortBy]);

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || onSaleOnly || inStockOnly;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedType('all');
    setOnSaleOnly(false);
    setInStockOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Search & Top Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن دوسية، مادة (فيزياء، رياضيات)، أو اسم أستاذ..."
            className="w-full pl-9 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="newest">الأحدث وصولاً</option>
              <option value="best_seller">الأكثر طلباً</option>
              <option value="rating">الأعلى تقييماً</option>
              <option value="price_asc">السعر: من الأقل</option>
              <option value="price_desc">السعر: من الأعلى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
          }`}
        >
          كافة المواد
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0f1422] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-300'
            }`}
          >
            {cat.nameAr}
          </button>
        ))}
      </div>

      {/* Type & Feature Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Type pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedType === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setSelectedType('digital')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedType === 'digital' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>رقمي PDF</span>
          </button>
          <button
            onClick={() => setSelectedType('physical')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedType === 'physical' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>مطبوع ورقي</span>
          </button>
          <button
            onClick={() => setSelectedType('bundle')}
            className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedType === 'bundle' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>باقات شاملة</span>
          </button>
        </div>

        {/* Quick toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnSaleOnly(!onSaleOnly)}
            className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1 transition-all cursor-pointer ${
              onSaleOnly 
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>عروض وتخفيضات</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              title="إعادة ضبط الفلاتر"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 px-4 text-center flex flex-col items-center bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-1">
            لم نتمكن من العثور على منتجات مطابقة للبحث
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
            جرب كتابة كلمات بحث أخرى مثل (فيزياء، رياضيات، باقة، ملخص) أو قم بإلغاء الفلاتر المحددة.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            إعادة ضبط الفلاتر وعرض الكل
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => (
            <StoreProductCard
              key={product.id}
              product={product}
              currency={currency}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
              isInCart={cartProductIds.includes(product.id)}
              isInWishlist={wishlistProductIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
