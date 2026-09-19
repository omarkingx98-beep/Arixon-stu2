import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Search, 
  Store as StoreIcon,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Coins,
  Trophy,
  Package,
  Receipt,
  Palette
} from 'lucide-react';
import type { 
  StoreProduct, 
  StoreCategory, 
  StoreBanner, 
  StoreSettings, 
  StoreOrder, 
  CartItem, 
  StoreCoupon
} from '../../types/store';
import { DEFAULT_STORE_SETTINGS } from '../../types/store';
import type { 
  StoreItem, 
  UserInventoryItem, 
  StoreTransaction 
} from '../../types/economy';
import { 
  getStoreProducts, 
  getStoreCategories, 
  getStoreBanners, 
  getStoreSettings, 
  initializeStoreDataIfEmpty 
} from '../../lib/storeService';
import { 
  getStoreItems, 
  getUserInventory, 
  getUserTransactions 
} from '../../lib/pointEconomyService';
import { StoreHomeView } from './StoreHomeView';
import { StoreCatalogView } from './StoreCatalogView';
import { StoreProductDetailsView } from './StoreProductDetailsView';
import { StoreCartView } from './StoreCartView';
import { StoreCheckoutView } from './StoreCheckoutView';
import { StoreOrderSuccessView } from './StoreOrderSuccessView';
import { StoreOrdersView } from './StoreOrdersView';
import { StoreLibraryView } from './StoreLibraryView';
import { StoreWishlistView } from './StoreWishlistView';
import { StorePointsCatalogView } from './StorePointsCatalogView';
import { StoreInventoryView } from './StoreInventoryView';
import { StoreTransactionsView } from './StoreTransactionsView';
import { ItemPreviewModal } from './ItemPreviewModal';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';
import { ProfileCustomizationModal } from './ProfileCustomizationModal';
import { useAuth } from '../../context/AuthContext';

type StoreSubView = 
  | 'points-catalog'
  | 'inventory'
  | 'transactions'
  | 'home' 
  | 'catalog' 
  | 'product-details' 
  | 'cart' 
  | 'checkout' 
  | 'order-success' 
  | 'orders' 
  | 'library' 
  | 'wishlist';

interface StoreViewProps {
  onNavigateToAuth?: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ onNavigateToAuth }) => {
  const { profile, refreshProfile, setProfileOptimistic } = useAuth();
  const [subView, setSubView] = useState<StoreSubView>('points-catalog');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<StoreOrder | null>(null);

  // Phase 5 Economy States
  const [pointItems, setPointItems] = useState<StoreItem[]>([]);
  const [userInventory, setUserInventory] = useState<UserInventoryItem[]>([]);
  const [userTransactions, setUserTransactions] = useState<StoreTransaction[]>([]);
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<StoreItem | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Balances
  const spendableBalance = typeof profile?.spendablePoints === 'number' 
    ? profile.spendablePoints 
    : (profile?.totalPoints || 0);
  const competitionBalance = profile?.totalPoints || 0;

  // Data states for Books/Products Store
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [banners, setBanners] = useState<StoreBanner[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('arixon_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState<StoreCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Wishlist State (Persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('arixon_store_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quick Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Cart & Wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('arixon_store_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('arixon_store_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds]);

  // Load Economy & Store Data
  const loadStoreData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Load Phase 5 Points Store Catalog
      const items = await getStoreItems();
      setPointItems(items);

      // 2. Load User Inventory & Transactions if logged in
      if (profile?.uid) {
        const [inv, txs] = await Promise.all([
          getUserInventory(profile.uid),
          getUserTransactions(profile.uid)
        ]);
        setUserInventory(inv);
        setUserTransactions(txs);
      }

      // 3. Load Academic books / products
      await initializeStoreDataIfEmpty();
      const [prods, cats, bans, sets] = await Promise.all([
        getStoreProducts({ onlyPublished: true }),
        getStoreCategories(),
        getStoreBanners(),
        getStoreSettings()
      ]);

      setProducts(prods);
      setCategories(cats);
      setBanners(bans);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.uid]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Handle Purchase Success
  const handlePurchaseSuccess = (newItem: UserInventoryItem, newBalance: number) => {
    setBuyingItem(null);
    setPreviewItem(null);

    // Update inventory state
    setUserInventory(prev => {
      const idx = prev.findIndex(i => i.itemId === newItem.itemId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newItem;
        return copy;
      }
      return [newItem, ...prev];
    });

    // Update profile optimistic spendable points
    if (profile) {
      setProfileOptimistic({
        ...profile,
        spendablePoints: newBalance,
      });
    }

    showToast(`تم شراء "${newItem.item.name}" بنجاح! الرصيد المتبقي: ${newBalance.toLocaleString()} نقطة`);

    // Reload transactions & fresh profile in background
    if (profile?.uid) {
      getUserTransactions(profile.uid).then(setUserTransactions).catch(() => {});
      refreshProfile().catch(() => {});
    }
  };

  // Cart Handlers
  const handleAddToCart = (product: StoreProduct, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      if (existing) {
        // Digital locked to 1
        if (product.type === 'digital' || product.type === 'bundle') {
          showToast('هذا المنتج رقمي وموجود بالفعل في سلتك');
          return prevCart;
        }
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, {
          productId: product.id,
          product,
          quantity: (product.type === 'digital' || product.type === 'bundle') ? 1 : quantity,
          selectedPrice: product.price
        }];
      }
    });

    showToast(`تمت إضافة "${product.nameAr}" إلى السلة`);
  };

  const handleBuyNow = (product: StoreProduct, quantity = 1) => {
    handleAddToCart(product, quantity);
    setSubView('checkout');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
    showToast('تمت إزالة المنتج من السلة');
  };

  const handleApplyCoupon = (coupon: StoreCoupon | null, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discountAmount);
  };

  // Wishlist Handlers
  const handleToggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlistIds(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('تمت الإزالة من المفضلة');
        return prev.filter(id => id !== productId);
      } else {
        showToast('تمت الإضافة إلى المفضلة ❤️');
        return [...prev, productId];
      }
    });
  };

  // Navigation Helpers
  const handleSelectProduct = (product: StoreProduct) => {
    setSelectedProduct(product);
    setSubView('product-details');
  };

  const handleNavigateToCategory = (catId: string) => {
    setSelectedCategoryFilter(catId);
    setSubView('catalog');
  };

  const handleOrderSuccess = (order: StoreOrder) => {
    setLastPlacedOrder(order);
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setSubView('order-success');
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + (i.selectedPrice * i.quantity), 0);

  const wishlistProducts = products.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Store Top Navigation Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Brand / Title & Main Links */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSubView('points-catalog')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm shrink-0 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>متجر Arixon</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-1" />

          {/* Navigation Pills */}
          <button
            onClick={() => setSubView('points-catalog')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              subView === 'points-catalog'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>متجر النقاط والمظاهر 🌟</span>
          </button>

          <button
            onClick={() => setSubView('inventory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              subView === 'inventory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>مخزوني ({userInventory.length})</span>
          </button>

          <button
            onClick={() => setSubView('transactions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              subView === 'transactions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>سجل العمليات</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-1" />

          <button
            onClick={() => setSubView('home')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              subView === 'home' || subView === 'catalog'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>الكتب والدوسيات 📚</span>
          </button>

          <button
            onClick={() => setSubView('library')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
              subView === 'library'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>مكتبتي</span>
          </button>
        </div>

        {/* Right Actions: Balances & Shortcuts */}
        <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
          {/* Quick Customizer Button */}
          {profile && (
            <button
              onClick={() => setShowCustomizer(true)}
              className="px-3 py-1.5 rounded-xl border border-fuchsia-300 dark:border-fuchsia-800 bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-bold flex items-center gap-1.5 hover:bg-fuchsia-100 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>تخصيص المظهر</span>
            </button>
          )}

          {/* Spendable Points Indicator */}
          <button
            onClick={() => setSubView('points-catalog')}
            className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
            title="نقاط الشراء المتاحة"
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>{spendableBalance.toLocaleString()}</span>
            <span className="text-[10px] font-normal">نقطة شراء</span>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => setSubView('wishlist')}
            className={`p-2 rounded-xl border transition-all relative cursor-pointer ${
              subView === 'wishlist'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:border-rose-300'
            }`}
            title="المفضلة"
          >
            <Heart className={`w-4 h-4 ${wishlistIds.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setSubView('cart')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subView === 'cart' || subView === 'checkout'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span>السلة</span>
            {cartSubtotal > 0 && (
              <span className="font-mono font-black border-r border-slate-300 dark:border-slate-600 pr-1.5 mr-0.5">
                {cartSubtotal} {settings.currency}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main View Switcher */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            جارٍ تحميل المتجر ونقاط الحساب...
          </span>
        </div>
      ) : (
        <>
          {subView === 'points-catalog' && (
            <StorePointsCatalogView
              items={pointItems}
              ownedItemIds={userInventory.map(i => i.itemId)}
              spendableBalance={spendableBalance}
              competitionBalance={competitionBalance}
              onPreviewItem={(item) => setPreviewItem(item)}
              onBuyItem={(item) => setBuyingItem(item)}
              onOpenCustomizer={() => setShowCustomizer(true)}
              onOpenInventory={() => setSubView('inventory')}
              onOpenTransactions={() => setSubView('transactions')}
            />
          )}

          {subView === 'inventory' && (
            <StoreInventoryView
              inventory={userInventory}
              profile={profile || ({} as any)}
              onOpenCustomizer={() => setShowCustomizer(true)}
              onGoToStoreCatalog={() => setSubView('points-catalog')}
            />
          )}

          {subView === 'transactions' && (
            <StoreTransactionsView
              transactions={userTransactions}
              isLoading={isLoading}
            />
          )}

          {subView === 'home' && (
            <StoreHomeView
              products={products}
              categories={categories}
              banners={banners}
              settings={settings}
              currency={settings.currency}
              cartProductIds={cart.map(i => i.productId)}
              wishlistProductIds={wishlistIds}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
              onToggleWishlist={handleToggleWishlist}
              onNavigateToCategory={handleNavigateToCategory}
              onOpenCatalog={() => {
                setSelectedCategoryFilter('all');
                setSubView('catalog');
              }}
              onOpenLibrary={() => setSubView('library')}
            />
          )}

          {subView === 'catalog' && (
            <StoreCatalogView
              products={products}
              categories={categories}
              currency={settings.currency}
              initialCategory={selectedCategoryFilter}
              cartProductIds={cart.map(i => i.productId)}
              wishlistProductIds={wishlistIds}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          {subView === 'product-details' && selectedProduct && (
            <StoreProductDetailsView
              product={selectedProduct}
              currency={settings.currency}
              isInCart={cart.some(i => i.productId === selectedProduct.id)}
              isInWishlist={wishlistIds.includes(selectedProduct.id)}
              onBack={() => setSubView('catalog')}
              onAddToCart={(p, q) => handleAddToCart(p, q)}
              onBuyNow={handleBuyNow}
              onToggleWishlist={() => handleToggleWishlist(selectedProduct.id)}
              onSelectProduct={handleSelectProduct}
              relatedProducts={products.filter(p => p.id !== selectedProduct.id && p.categoryId === selectedProduct.categoryId)}
            />
          )}

          {subView === 'cart' && (
            <StoreCartView
              cart={cart}
              currency={settings.currency}
              settings={settings}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onApplyCoupon={handleApplyCoupon}
              onProceedToCheckout={() => setSubView('checkout')}
              onContinueShopping={() => setSubView('catalog')}
            />
          )}

          {subView === 'checkout' && (
            <StoreCheckoutView
              cart={cart}
              currency={settings.currency}
              settings={settings}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              onBackToCart={() => setSubView('cart')}
              onOrderSuccess={handleOrderSuccess}
            />
          )}

          {subView === 'order-success' && lastPlacedOrder && (
            <StoreOrderSuccessView
              order={lastPlacedOrder}
              currency={settings.currency}
              onViewOrders={() => setSubView('orders')}
              onViewLibrary={() => setSubView('library')}
              onContinueShopping={() => setSubView('catalog')}
            />
          )}

          {subView === 'orders' && (
            <StoreOrdersView
              currency={settings.currency}
              onViewLibrary={() => setSubView('library')}
              onContinueShopping={() => setSubView('catalog')}
            />
          )}

          {subView === 'library' && (
            <StoreLibraryView
              onBrowseStore={() => setSubView('catalog')}
            />
          )}

          {subView === 'wishlist' && (
            <StoreWishlistView
              wishlistProducts={wishlistProducts}
              currency={settings.currency}
              cartProductIds={cart.map(i => i.productId)}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
              onToggleWishlist={handleToggleWishlist}
              onBrowseStore={() => setSubView('catalog')}
            />
          )}
        </>
      )}

      {/* Item Interactive Preview Modal */}
      {previewItem && (
        <ItemPreviewModal
          item={previewItem}
          userSpendableBalance={spendableBalance}
          userPhotoURL={profile?.photoURL}
          userDisplayName={profile?.displayName || profile?.username}
          isOwned={!previewItem.consumable && userInventory.some(i => i.itemId === previewItem.id)}
          onClose={() => setPreviewItem(null)}
          onBuy={(item) => {
            setPreviewItem(null);
            setBuyingItem(item);
          }}
        />
      )}

      {/* Item Purchase Confirmation Modal */}
      {buyingItem && profile && (
        <PurchaseConfirmModal
          item={buyingItem}
          userId={profile.uid}
          userDisplayName={profile.displayName || profile.username}
          userSpendableBalance={spendableBalance}
          userCompetitionBalance={competitionBalance}
          onClose={() => setBuyingItem(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Profile Customization Modal */}
      {showCustomizer && profile && (
        <ProfileCustomizationModal
          profile={profile}
          inventory={userInventory}
          onClose={() => setShowCustomizer(false)}
          onRefreshProfile={async () => {
            await refreshProfile();
            const inv = await getUserInventory(profile.uid);
            setUserInventory(inv);
          }}
        />
      )}
    </div>
  );
};
