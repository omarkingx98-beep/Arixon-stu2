import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Star, 
  ShoppingBag, 
  Heart, 
  Share2, 
  Check, 
  FileText, 
  Package, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  Download, 
  BookOpen,
  MessageCircle,
  Copy,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import type { StoreProduct, ProductReview } from '../../types/store';
import { getProductReviews, addProductReview, recordProductView } from '../../lib/storeService';
import { useAuth } from '../../context/AuthContext';
import { formatArabicDate } from '../../lib/dateUtils';

interface StoreProductDetailsViewProps {
  product: StoreProduct;
  currency?: string;
  onBack: () => void;
  onAddToCart: (product: StoreProduct, quantity?: number) => void;
  onBuyNow: (product: StoreProduct, quantity?: number) => void;
  isInCart?: boolean;
  isInWishlist?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct: (product: StoreProduct) => void;
  relatedProducts?: StoreProduct[];
}

export const StoreProductDetailsView: React.FC<StoreProductDetailsViewProps> = ({
  product,
  currency = '₪',
  onBack,
  onAddToCart,
  onBuyNow,
  isInCart = false,
  isInWishlist = false,
  onToggleWishlist,
  onSelectProduct,
  relatedProducts = [],
}) => {
  const { profile } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string>(product.coverImage || product.images?.[0] || '');
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  const isDigital = product.type === 'digital' || product.type === 'bundle';
  const isOutOfStock = product.type === 'physical' && product.stock <= 0;
  const hasDiscount = !!(product.oldPrice && product.oldPrice > product.price);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedImage(product.coverImage || product.images?.[0] || '');
    setQuantity(1);
    recordProductView(product.id);
    loadReviews();
  }, [product.id]);

  const loadReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const data = await getProductReviews(product.id);
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `تفقّد هذا المنتج التعليمي المميز على منصة Arixon: "${product.nameAr}" بسعر ${product.price} ${currency}!\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid || !newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewSuccessMsg(null);
    try {
      const created = await addProductReview({
        productId: product.id,
        userId: profile.uid,
        userName: profile.displayName || 'طالب Arixon',
        rating: newRating,
        comment: newComment.trim()
      });
      setReviews(prev => [created, ...prev]);
      setNewComment('');
      setReviewSuccessMsg('شكراً لك! تم إضافة تقييمك بنجاح.');
      setTimeout(() => setReviewSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى المتجر</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleWishlist && (
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isInWishlist 
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-500' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:border-rose-300'
              }`}
              title="إضافة للمفضلة"
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer relative"
            title="نسخ الرابط"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="مشاركة عبر واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">واتساب</span>
          </button>
        </div>
      </div>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 bg-white dark:bg-[#0f1422] p-4 sm:p-6 lg:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Gallery / Images Column (5 Cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
            <img 
              src={selectedImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'} 
              alt={product.nameAr}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />

            {/* Badges on main image */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              {hasDiscount && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500 text-white shadow-md">
                  خصم {product.discountPercentage || Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)}%
                </span>
              )}
              {product.badge && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-white shadow-md">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img 
                      ? 'border-blue-600 dark:border-blue-400 scale-95 shadow-sm' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>محتوى تعليمي معتمد</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              {isDigital ? (
                <>
                  <Download className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>وصول رقمي فوري</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>توصيل سريع وموثوق</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Info & Actions Column (7 Cols) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            {/* Category & Type Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {product.category}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                product.type === 'digital' 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' 
                  : product.type === 'bundle'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
              }`}>
                {product.type === 'digital' ? (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>ملف رقمي PDF</span>
                  </>
                ) : product.type === 'bundle' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>باقة شاملة</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" />
                    <span>نسخة مطبوعة ورقية</span>
                  </>
                )}
              </span>

              {product.sku && (
                <span className="text-[11px] text-slate-400 font-mono">
                  رمز: {product.sku}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              {product.nameAr}
            </h1>

            {/* Rating and Sales */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pb-2">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span className="text-sm">{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                <span className="text-slate-400 font-normal">
                  ({product.ratingCount || 0} تقييم)
                </span>
              </div>
              <span>•</span>
              <span>تم البيع: <strong className="text-slate-700 dark:text-slate-300">{product.salesCount || 0}</strong> مرة</span>
            </div>

            {/* Price Row */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-baseline gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400">
                  {product.price}
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {currency}
                </span>
              </div>

              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-base text-slate-400 line-through font-medium">
                    {product.oldPrice} {currency}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-500 text-white">
                    وفر {product.oldPrice! - product.price} {currency}
                  </span>
                </div>
              )}
            </div>

            {/* Short description */}
            {product.shortDescriptionAr && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                {product.shortDescriptionAr}
              </p>
            )}

            {/* Digital Specs highlight */}
            {isDigital && product.digitalContent && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                {product.digitalContent.fileFormat && (
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span>الصيغة: {product.digitalContent.fileFormat}</span>
                  </span>
                )}
                {product.digitalContent.pageCount && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{product.digitalContent.pageCount} صفحة</span>
                  </span>
                )}
                {product.digitalContent.fileSize && (
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>الحجم: {product.digitalContent.fileSize}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Box: Quantity + Buttons */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {/* Quantity Selector (Only for physical products) */}
            {!isDigital && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الكمية المطلوبة:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                    disabled={quantity >= (product.stock || 99)}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onAddToCart(product, quantity)}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  isInCart
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : isOutOfStock
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {isInCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تمت الإضافة للسلة</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>إضافة إلى السلة</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onBuyNow(product, quantity)}
                disabled={isOutOfStock}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isOutOfStock
                    ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-98'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>شراء الآن والدفع</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description / Specs / Reviews */}
      <div className="bg-white dark:bg-[#0f1422] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-6 lg:p-8">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'description'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            الوصف الكامل
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'specifications'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            المحتويات والمواصفات
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>آراء الطلاب</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {reviews.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'description' && (
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {product.descriptionAr || product.shortDescriptionAr || 'لا يوجد وصف تفصيلي إضافي.'}
          </div>
        )}

        {/* Tab 2: Specifications */}
        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">نوع المنتج:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {product.type === 'digital' ? 'رقمي قابل للتحميل والمشاهدة' : product.type === 'bundle' ? 'حقيبة وباقة شاملة' : 'نسخة ورقية مطبوعة'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">المادة / التصنيف:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{product.category}</span>
            </div>
            {product.digitalContent?.fileFormat && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">صيغة الملف:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{product.digitalContent.fileFormat}</span>
              </div>
            )}
            {product.digitalContent?.pageCount && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">عدد الصفحات:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{product.digitalContent.pageCount} صفحة</span>
              </div>
            )}
            {product.digitalContent?.accessInstructionsAr && (
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-300">
                <strong className="block mb-1">تعليمات الوصول والفتح:</strong>
                <p className="text-xs leading-relaxed">{product.digitalContent.accessInstructionsAr}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            {/* Add Review Form */}
            {profile ? (
              <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  أضف رأيك وتقييمك في هذا المنتج التعليمي
                </h4>

                {reviewSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    {reviewSuccessMsg}
                  </div>
                )}

                {/* Rating stars selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">التقييم:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب ملاحظاتك وتجربتك مع هذا الملخص أو الكتاب لمساعدة زملائك الطلبة..."
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingReview || !newComment.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReview ? 'جارٍ النشر...' : 'نشر التقييم'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 text-center text-xs text-slate-500">
                يرجى تسجيل الدخول لتتمكن من كتابة تقييم.
              </div>
            )}

            {/* Existing Reviews List */}
            {isLoadingReviews ? (
              <div className="text-center py-6 text-xs text-slate-400">جارٍ تحميل التقييمات...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                لا توجد تقييمات حتى الآن. كن أول من يقيّم هذا المنتج!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          {rev.userName.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {rev.userName}
                          </span>
                          {rev.isVerifiedBuyer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                              مشتري موثق
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 stroke-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rev.comment}
                    </p>

                    <span className="text-[10px] text-slate-400">
                      {formatArabicDate(rev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="flex flex-col gap-4 pt-4">
          <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
            منتجات ذات صلة قد تهمك
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectProduct(rel)}
                className="p-3 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-all"
              >
                <img 
                  src={rel.coverImage} 
                  alt="" 
                  className="w-16 h-16 rounded-xl object-cover shrink-0" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col overflow-hidden">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {rel.nameAr}
                  </h4>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 mt-1">
                    {rel.price} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
