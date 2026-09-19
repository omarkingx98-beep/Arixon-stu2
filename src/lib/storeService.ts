import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  StoreProduct,
  StoreCategory,
  StoreCoupon,
  StoreOrder,
  ProductReview,
  DigitalLibraryItem,
  StoreSettings,
  StoreBanner,
  OrderStatus,
  PaymentStatus,
  ProductType
} from '../types/store';

// Helper to remove undefined fields before Firestore write
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// Default store settings
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeEnabled: true,
  maintenanceMode: false,
  maintenanceMessageAr: 'المتجر تحت التحديث حالياً، سنعود قريباً لخدمتكم بأفضل المنتجات التعليمية.',
  currency: '₪',
  currencyCode: 'ILS',
  shippingFee: 15,
  freeShippingThreshold: 100,
  enabledPaymentMethods: {
    cod: true,
    bop: true,
    palpay: true,
    jawwal_pay: true,
    pib: true,
    bank_transfer: true,
    cash: true
  },
  paymentInstructions: {
    bopAccount: '0450-123456-001',
    bopIban: 'PS96PALS045000123456001001',
    bopName: 'منصة Arixon التعليمية',
    palpayWallet: '0599000000',
    jawwalPayWallet: '0599000000',
    pibAccount: '12345678',
    generalInstructionsAr: 'يرجى تحويل المبلغ الإجمالي إلى أحد الحسابات الموضحة أعلاه وكتابة رقم الهاتف أو اسم الطالب في خانة الملاحظات، ثم إدخال رقم المعاملة أو إرفاق إشعار الدفع لتأكيد الطلب فوراً.'
  },
  couponsEnabled: true,
  reviewsEnabled: true,
  wishlistEnabled: true,
  storeAnnouncement: '🔥 خصومات خاصة لطلبة توجيهي 2009 على جميع الدوسيات وباقات الامتحانات!',
  showSalesCount: true,
  whatsappContact: '00970599000000'
};

// ==========================================
// 1. PRODUCTS SERVICE
// ==========================================

export async function getStoreProducts(filters?: {
  categoryId?: string;
  type?: ProductType;
  search?: string;
  onlyPublished?: boolean;
  onSale?: boolean;
  featuredOnly?: boolean;
}): Promise<StoreProduct[]> {
  try {
    const productsRef = collection(db, 'storeProducts');
    let q = query(productsRef);

    const snap = await getDocs(q);
    let items: StoreProduct[] = [];

    snap.forEach((d) => {
      const data = d.data() as StoreProduct;
      items.push({ ...data, id: d.id });
    });

    // In-memory filters for flexible multi-field filtering without complex composite indexes
    if (filters?.onlyPublished !== false) {
      items = items.filter(p => p.isPublished && !p.isArchived);
    } else {
      items = items.filter(p => !p.isArchived);
    }

    if (filters?.categoryId && filters.categoryId !== 'all') {
      items = items.filter(p => p.categoryId === filters.categoryId || p.category === filters.categoryId);
    }

    if (filters?.type) {
      items = items.filter(p => p.type === filters.type);
    }

    if (filters?.featuredOnly) {
      items = items.filter(p => p.isFeatured);
    }

    if (filters?.onSale) {
      items = items.filter(p => (p.oldPrice && p.oldPrice > p.price) || (p.discountPercentage && p.discountPercentage > 0));
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.toLowerCase().trim();
      items = items.filter(p => 
        p.nameAr.toLowerCase().includes(term) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
        (p.shortDescriptionAr && p.shortDescriptionAr.toLowerCase().includes(term)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Sort: Featured first, then newest
    items.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return items;
  } catch (err) {
    console.error('[Store] Failed to fetch products:', err);
    return [];
  }
}

export async function getProductById(productId: string): Promise<StoreProduct | null> {
  try {
    const docRef = doc(db, 'storeProducts', productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...(snap.data() as StoreProduct), id: snap.id };
  } catch (err) {
    console.error('[Store] Error fetching product by id:', err);
    return null;
  }
}

export async function saveProduct(product: Partial<StoreProduct>): Promise<StoreProduct> {
  const now = new Date().toISOString();
  const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Calculate discount percentage if old price given
  let discountPercentage = product.discountPercentage;
  if (product.oldPrice && product.price && product.oldPrice > product.price) {
    discountPercentage = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  }

  const fullProduct: StoreProduct = {
    id,
    nameAr: product.nameAr || 'منتج تعليمي جديد',
    nameEn: product.nameEn || '',
    shortDescriptionAr: product.shortDescriptionAr || '',
    shortDescriptionEn: product.shortDescriptionEn || '',
    descriptionAr: product.descriptionAr || '',
    descriptionEn: product.descriptionEn || '',
    price: Number(product.price) || 0,
    oldPrice: product.oldPrice ? Number(product.oldPrice) : undefined,
    discountPercentage,
    category: product.category || 'عام',
    categoryId: product.categoryId || 'general',
    type: product.type || 'digital',
    sku: product.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    stock: product.stock !== undefined ? Number(product.stock) : 999,
    lowStockThreshold: product.lowStockThreshold || 5,
    images: product.images && product.images.length > 0 ? product.images : [product.coverImage || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'],
    coverImage: product.coverImage || (product.images?.[0] || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'),
    tags: product.tags || [],
    isFeatured: !!product.isFeatured,
    isBestSeller: !!product.isBestSeller,
    isPublished: product.isPublished !== undefined ? product.isPublished : true,
    isArchived: false,
    digitalContent: product.digitalContent,
    bundleItemIds: product.bundleItemIds || [],
    shippingRequired: product.type === 'physical',
    salesCount: product.salesCount || 0,
    viewsCount: product.viewsCount || 0,
    rating: product.rating || 5,
    ratingCount: product.ratingCount || 1,
    badge: product.badge,
    createdAt: product.createdAt || now,
    updatedAt: now
  };

  const docRef = doc(db, 'storeProducts', id);
  await setDoc(docRef, sanitizeForFirestore(fullProduct), { merge: true });
  return fullProduct;
}

export async function deleteProduct(productId: string): Promise<void> {
  // Soft delete (archive) to protect order history integrity
  const docRef = doc(db, 'storeProducts', productId);
  await updateDoc(docRef, { isArchived: true, isPublished: false, updatedAt: new Date().toISOString() });
}

export async function duplicateProduct(productId: string): Promise<StoreProduct> {
  const original = await getProductById(productId);
  if (!original) throw new Error('المنتج غير موجود');

  const copy: Partial<StoreProduct> = {
    ...original,
    id: undefined,
    nameAr: `${original.nameAr} (نسخة)`,
    nameEn: original.nameEn ? `${original.nameEn} (Copy)` : '',
    sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    salesCount: 0,
    viewsCount: 0,
    ratingCount: 0,
    rating: 5,
    createdAt: undefined,
    updatedAt: undefined
  };

  return saveProduct(copy);
}

export async function recordProductView(productId: string): Promise<void> {
  try {
    const docRef = doc(db, 'storeProducts', productId);
    await updateDoc(docRef, { viewsCount: increment(1) });
  } catch {}
}

// ==========================================
// 2. CATEGORIES SERVICE
// ==========================================

export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const snap = await getDocs(collection(db, 'storeCategories'));
    const categories: StoreCategory[] = [];
    snap.forEach(d => {
      categories.push({ ...(d.data() as StoreCategory), id: d.id });
    });
    categories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return categories;
  } catch (err) {
    console.error('[Store] Error fetching categories:', err);
    return [];
  }
}

export async function saveCategory(category: Partial<StoreCategory>): Promise<StoreCategory> {
  const id = category.id || `cat_${Date.now()}`;
  const fullCategory: StoreCategory = {
    id,
    nameAr: category.nameAr || 'تصنيف جديد',
    nameEn: category.nameEn || '',
    description: category.description || '',
    icon: category.icon || 'BookOpen',
    color: category.color || '#2563eb',
    displayOrder: category.displayOrder || 0,
    isActive: category.isActive !== undefined ? category.isActive : true
  };

  await setDoc(doc(db, 'storeCategories', id), sanitizeForFirestore(fullCategory), { merge: true });
  return fullCategory;
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'storeCategories', categoryId));
}

// ==========================================
// 3. ORDERS SERVICE
// ==========================================

export async function createStoreOrder(orderInput: {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: StoreOrder['items'];
  subtotal: number;
  couponCode?: string;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: StoreOrder['paymentMethod'];
  paymentReference?: string;
  paymentProofUrl?: string;
  shippingAddress?: StoreOrder['shippingAddress'];
}): Promise<StoreOrder> {
  const now = new Date().toISOString();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `ARX-${randomNum}`;
  const orderId = `order_${Date.now()}_${randomNum}`;

  const order: StoreOrder = {
    id: orderId,
    orderNumber,
    userId: orderInput.userId,
    customerName: orderInput.customerName.trim(),
    customerEmail: orderInput.customerEmail.trim(),
    customerPhone: orderInput.customerPhone.trim(),
    items: orderInput.items,
    subtotal: Math.round(orderInput.subtotal * 100) / 100,
    couponCode: orderInput.couponCode || '',
    discount: Math.round(orderInput.discount * 100) / 100,
    shippingFee: Math.round(orderInput.shippingFee * 100) / 100,
    total: Math.round(orderInput.total * 100) / 100,
    paymentMethod: orderInput.paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    paymentReference: orderInput.paymentReference || '',
    paymentProofUrl: orderInput.paymentProofUrl || '',
    shippingAddress: orderInput.shippingAddress,
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(db, 'storeOrders', orderId);
  await setDoc(docRef, sanitizeForFirestore(order));

  // If coupon used, increment usage count
  if (order.couponCode) {
    recordCouponUsage(order.couponCode).catch(console.warn);
  }

  // Increment sales count for each purchased product
  for (const item of order.items) {
    try {
      const prodRef = doc(db, 'storeProducts', item.productId);
      await updateDoc(prodRef, { 
        salesCount: increment(item.quantity),
        stock: increment(-item.quantity)
      });
    } catch {}
  }

  return order;
}

export async function getUserOrders(userId: string): Promise<StoreOrder[]> {
  try {
    const q = query(
      collection(db, 'storeOrders'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const orders: StoreOrder[] = [];
    snap.forEach(d => {
      orders.push({ ...(d.data() as StoreOrder), id: d.id });
    });
    // Sort descending by date
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    console.error('[Store] Error fetching user orders:', err);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<StoreOrder | null> {
  try {
    const docRef = doc(db, 'storeOrders', orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...(snap.data() as StoreOrder), id: snap.id };
  } catch (err) {
    console.error('[Store] Error fetching order by ID:', err);
    return null;
  }
}

export async function getAllOrdersForAdmin(): Promise<StoreOrder[]> {
  try {
    const snap = await getDocs(collection(db, 'storeOrders'));
    const orders: StoreOrder[] = [];
    snap.forEach(d => {
      orders.push({ ...(d.data() as StoreOrder), id: d.id });
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (err) {
    console.error('[Store] Error fetching all admin orders:', err);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, adminNotes?: string): Promise<void> {
  const docRef = doc(db, 'storeOrders', orderId);
  const payload: Record<string, any> = {
    orderStatus: status,
    updatedAt: new Date().toISOString()
  };
  if (adminNotes !== undefined) payload.adminNotes = adminNotes;
  await updateDoc(docRef, sanitizeForFirestore(payload));
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus, adminNotes?: string): Promise<void> {
  const docRef = doc(db, 'storeOrders', orderId);
  const orderSnap = await getDoc(docRef);
  if (!orderSnap.exists()) throw new Error('الطلب غير موجود');
  const order = orderSnap.data() as StoreOrder;

  const payload: Record<string, any> = {
    paymentStatus: status,
    updatedAt: new Date().toISOString()
  };
  if (adminNotes !== undefined) payload.adminNotes = adminNotes;
  
  // If payment changed to paid, auto-update order status if pending
  if (status === 'paid' && order.orderStatus === 'pending') {
    payload.orderStatus = order.items.every(i => i.productType === 'digital') ? 'completed' : 'processing';
  }

  await updateDoc(docRef, sanitizeForFirestore(payload));

  // If status is paid, unlock digital items in the student's Digital Library!
  if (status === 'paid') {
    await grantDigitalAccessForOrder(order);
  }
}

// ==========================================
// 4. DIGITAL LIBRARY SERVICE
// ==========================================

export async function grantDigitalAccessForOrder(order: StoreOrder): Promise<void> {
  const now = new Date().toISOString();
  for (const item of order.items) {
    if (item.productType === 'digital' || item.productType === 'bundle') {
      try {
        const prod = await getProductById(item.productId);
        const libDocId = `lib_${order.userId}_${item.productId}`;
        const libraryItem: DigitalLibraryItem = {
          id: libDocId,
          userId: order.userId,
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          orderId: order.id,
          orderNumber: order.orderNumber,
          grantedAt: now,
          coverImage: prod?.coverImage || item.coverImage,
          digitalContent: prod?.digitalContent || item.digitalContent
        };

        await setDoc(doc(db, 'digitalLibraries', libDocId), sanitizeForFirestore(libraryItem), { merge: true });
      } catch (err) {
        console.error('[Store] Failed to grant digital access for item:', item.productId, err);
      }
    }
  }
}

export async function getUserLibrary(userId: string): Promise<DigitalLibraryItem[]> {
  try {
    const q = query(
      collection(db, 'digitalLibraries'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const items: DigitalLibraryItem[] = [];
    snap.forEach(d => {
      items.push({ ...(d.data() as DigitalLibraryItem), id: d.id });
    });
    items.sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime());
    return items;
  } catch (err) {
    console.error('[Store] Error fetching user library:', err);
    return [];
  }
}

// ==========================================
// 5. COUPONS SERVICE
// ==========================================

export async function validateCoupon(code: string, subtotal: number): Promise<{
  valid: boolean;
  coupon?: StoreCoupon;
  discountAmount: number;
  message: string;
}> {
  try {
    const cleanCode = code.trim().toUpperCase();
    const q = query(collection(db, 'storeCoupons'), where('code', '==', cleanCode), where('isActive', '==', true));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { valid: false, discountAmount: 0, message: 'رمز القسيمة غير صالح أو غير موجود' };
    }

    const coupon = { ...(snap.docs[0].data() as StoreCoupon), id: snap.docs[0].id };

    // Check expiry
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate).getTime();
      if (Date.now() > expiry) {
        return { valid: false, discountAmount: 0, message: 'انتهت صلاحية هذه القسيمة' };
      }
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'تم استنفاذ الحد الأقصى لاستخدام هذه القسيمة' };
    }

    // Check min order amount
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return { 
        valid: false, 
        discountAmount: 0, 
        message: `الحد الأدنى لتطبيق هذه القسيمة هو ${coupon.minOrderAmount} ₪` 
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      coupon,
      discountAmount,
      message: `تم تطبيق خصم بقيمة ${discountAmount} ₪ بنجاح!`
    };
  } catch (err) {
    console.error('[Store] Error validating coupon:', err);
    return { valid: false, discountAmount: 0, message: 'حدث خطأ أثناء فحص القسيمة' };
  }
}

export async function getStoreCoupons(): Promise<StoreCoupon[]> {
  try {
    const snap = await getDocs(collection(db, 'storeCoupons'));
    const coupons: StoreCoupon[] = [];
    snap.forEach(d => coupons.push({ ...(d.data() as StoreCoupon), id: d.id }));
    return coupons;
  } catch (err) {
    console.error('[Store] Error fetching coupons:', err);
    return [];
  }
}

export async function saveCoupon(coupon: Partial<StoreCoupon>): Promise<StoreCoupon> {
  const id = coupon.id || `cpn_${Date.now()}`;
  const fullCoupon: StoreCoupon = {
    id,
    code: (coupon.code || 'SALE10').trim().toUpperCase(),
    discountType: coupon.discountType || 'percentage',
    discountValue: Number(coupon.discountValue) || 10,
    minOrderAmount: Number(coupon.minOrderAmount) || 0,
    maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : undefined,
    startDate: coupon.startDate,
    expiryDate: coupon.expiryDate,
    usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : undefined,
    usedCount: coupon.usedCount || 0,
    isActive: coupon.isActive !== undefined ? coupon.isActive : true
  };

  await setDoc(doc(db, 'storeCoupons', id), sanitizeForFirestore(fullCoupon), { merge: true });
  return fullCoupon;
}

export async function deleteCoupon(couponId: string): Promise<void> {
  await deleteDoc(doc(db, 'storeCoupons', couponId));
}

export async function recordCouponUsage(code: string): Promise<void> {
  try {
    const q = query(collection(db, 'storeCoupons'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { usedCount: increment(1) });
    }
  } catch {}
}

// ==========================================
// 6. WISHLIST SERVICE
// ==========================================

export async function getUserWishlist(userId: string): Promise<string[]> {
  try {
    const docRef = doc(db, 'storeWishlists', userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    return Array.isArray(data.productIds) ? data.productIds : [];
  } catch (err) {
    console.error('[Store] Error getting wishlist:', err);
    return [];
  }
}

export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const docRef = doc(db, 'storeWishlists', userId);
  const snap = await getDoc(docRef);
  let currentIds: string[] = [];
  if (snap.exists() && Array.isArray(snap.data().productIds)) {
    currentIds = snap.data().productIds;
  }

  const index = currentIds.indexOf(productId);
  let isNowInWishlist = false;
  if (index > -1) {
    currentIds.splice(index, 1);
    isNowInWishlist = false;
  } else {
    currentIds.push(productId);
    isNowInWishlist = true;
  }

  await setDoc(docRef, {
    userId,
    productIds: currentIds,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  return isNowInWishlist;
}

// ==========================================
// 7. REVIEWS SERVICE
// ==========================================

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  try {
    const q = query(
      collection(db, 'storeReviews'),
      where('productId', '==', productId),
      where('isVisible', '==', true)
    );
    const snap = await getDocs(q);
    const reviews: ProductReview[] = [];
    snap.forEach(d => reviews.push({ ...(d.data() as ProductReview), id: d.id }));
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  } catch (err) {
    console.error('[Store] Error fetching reviews:', err);
    return [];
  }
}

export async function addProductReview(data: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<ProductReview> {
  // Check if user has purchased this product
  let isVerifiedBuyer = false;
  try {
    const orders = await getUserOrders(data.userId);
    isVerifiedBuyer = orders.some(o => 
      (o.paymentStatus === 'paid' || o.orderStatus === 'completed' || o.orderStatus === 'delivered') &&
      o.items.some(i => i.productId === data.productId)
    );
  } catch {}

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const review: ProductReview = {
    id: reviewId,
    productId: data.productId,
    userId: data.userId,
    userName: data.userName,
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    comment: data.comment.trim(),
    createdAt: new Date().toISOString(),
    isVerifiedBuyer,
    isVisible: true
  };

  await setDoc(doc(db, 'storeReviews', reviewId), sanitizeForFirestore(review));

  // Recalculate average rating on product
  try {
    const allReviews = await getProductReviews(data.productId);
    allReviews.push(review);
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await updateDoc(doc(db, 'storeProducts', data.productId), {
      rating: Math.round(avg * 10) / 10,
      ratingCount: allReviews.length
    });
  } catch {}

  return review;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'storeReviews', reviewId));
}

export async function toggleReviewVisibility(reviewId: string, isVisible: boolean): Promise<void> {
  await updateDoc(doc(db, 'storeReviews', reviewId), { isVisible });
}

// ==========================================
// 8. STORE SETTINGS & BANNERS SERVICE
// ==========================================

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(doc(db, 'storeSettings', 'main'));
    if (!snap.exists()) {
      // Return defaults and write initial doc
      await setDoc(doc(db, 'storeSettings', 'main'), sanitizeForFirestore(DEFAULT_STORE_SETTINGS));
      return DEFAULT_STORE_SETTINGS;
    }
    return { ...DEFAULT_STORE_SETTINGS, ...(snap.data() as StoreSettings) };
  } catch (err) {
    console.error('[Store] Error fetching store settings:', err);
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const merged = { ...DEFAULT_STORE_SETTINGS, ...settings, updatedAt: new Date().toISOString() };
  await setDoc(doc(db, 'storeSettings', 'main'), sanitizeForFirestore(merged), { merge: true });
  return merged;
}

export async function getStoreBanners(): Promise<StoreBanner[]> {
  try {
    const snap = await getDocs(collection(db, 'storeBanners'));
    const banners: StoreBanner[] = [];
    snap.forEach(d => banners.push({ ...(d.data() as StoreBanner), id: d.id }));
    banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return banners;
  } catch (err) {
    console.error('[Store] Error fetching banners:', err);
    return [];
  }
}

export async function saveStoreBanner(banner: Partial<StoreBanner>): Promise<StoreBanner> {
  const id = banner.id || `banner_${Date.now()}`;
  const full: StoreBanner = {
    id,
    titleAr: banner.titleAr || 'عرض مميز',
    titleEn: banner.titleEn || '',
    subtitleAr: banner.subtitleAr || '',
    imageUrl: banner.imageUrl || '',
    targetUrl: banner.targetUrl,
    targetCategory: banner.targetCategory,
    targetProduct: banner.targetProduct,
    badgeText: banner.badgeText,
    buttonTextAr: banner.buttonTextAr || 'اكتشف الآن',
    isActive: banner.isActive !== undefined ? banner.isActive : true,
    displayOrder: banner.displayOrder || 0
  };
  await setDoc(doc(db, 'storeBanners', id), sanitizeForFirestore(full), { merge: true });
  return full;
}

export async function deleteStoreBanner(bannerId: string): Promise<void> {
  await deleteDoc(doc(db, 'storeBanners', bannerId));
}

// ==========================================
// 9. INITIAL DATABASE SEEDING
// ==========================================

export async function seedInitialStoreDataIfEmpty(): Promise<void> {
  try {
    const prodSnap = await getDocs(query(collection(db, 'storeProducts'), limit(1)));
    if (!prodSnap.empty) {
      // Already has store products
      return;
    }

    console.log('[Store Seed] Initializing authentic Tawjihi 2009 educational store catalogue...');

    // 1. Categories
    const categories: StoreCategory[] = [
      { id: 'cat_physics', nameAr: 'الفيزياء', nameEn: 'Physics', description: 'دوسيات، ملخصات ونماذج امتحانات الفيزياء للتوجيهي', icon: 'Atom', color: '#2563eb', displayOrder: 1, isActive: true },
      { id: 'cat_math', nameAr: 'الرياضيات', nameEn: 'Mathematics', description: 'شروحات وحلول تمارين ومسائل كتاب الرياضيات', icon: 'Calculator', color: '#059669', displayOrder: 2, isActive: true },
      { id: 'cat_arabic', nameAr: 'اللغة العربية', nameEn: 'Arabic', description: 'قواعد، بلاغة، ونصوص توجيهي مع إعراب كامل', icon: 'BookOpen', color: '#d97706', displayOrder: 3, isActive: true },
      { id: 'cat_chemistry', nameAr: 'الكيمياء', nameEn: 'Chemistry', description: 'مذكرات الكيمياء ونماذج وزارية محلولة بدقة', icon: 'FlaskConical', color: '#7c3aed', displayOrder: 4, isActive: true },
      { id: 'cat_bundles', nameAr: 'باقات وحقائب شاملة', nameEn: 'Bundles', description: 'باقات متكاملة توفر عليك الوقت والجهد بأسعار مخفضة', icon: 'Package', color: '#e11d48', displayOrder: 5, isActive: true },
      { id: 'cat_exams', nameAr: 'نماذج امتحانات', nameEn: 'Exams & Tests', description: 'نماذج امتحانات تجريبية ووزارية مع الإجابات النموذجية', icon: 'FileCheck', color: '#0891b2', displayOrder: 6, isActive: true },
    ];

    for (const c of categories) {
      await setDoc(doc(db, 'storeCategories', c.id), sanitizeForFirestore(c));
    }

    // 2. Initial High-Quality Products for Tawjihi 2009
    const products: StoreProduct[] = [
      {
        id: 'prod_physics_summary_2009',
        nameAr: 'مذكرة القمة في فيزياء التوجيهي 2009 (شامل الميكانيكا والطاقة)',
        nameEn: 'Top Physics Tawjihi 2009 Summary',
        shortDescriptionAr: 'ملخص رقمي PDF فائق الدقة يغطي قوانين الحركة، حفظ الزخم، والتصادمات مع حلول لأبرز الأسئلة الوزارية.',
        descriptionAr: 'الدوسية المعتمدة لطلبة توجيهي 2009 فرع العلمي والصناعي. تحتوي على تفكيك شامل للقوانين الفيزيائية مع رسومات توضيحية واستراتيجيات الحل السريع لأسئلة الاختيار من متعدد مع إرشادات تجنب الأفخاخ الامتحانية.',
        price: 25,
        oldPrice: 35,
        discountPercentage: 28,
        category: 'الفيزياء',
        categoryId: 'cat_physics',
        type: 'digital',
        sku: 'PHY-2009-SUM',
        stock: 9999,
        coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['فيزياء', 'توجيهي 2009', 'دوسية', 'ملخص', 'علمي'],
        isFeatured: true,
        isBestSeller: true,
        isPublished: true,
        shippingRequired: false,
        salesCount: 142,
        rating: 4.9,
        ratingCount: 38,
        badge: '🔥 الأكثر طلباً',
        digitalContent: {
          fileFormat: 'PDF',
          pageCount: 68,
          fileSize: '14.2 MB',
          downloadUrl: 'https://example.com/arixon-physics-2009-summary.pdf',
          accessInstructionsAr: 'يمكنك فتح الملف مباشرة وقراءته عبر قارئ Arixon الرقمي أو تحميله وطباعته لجهازك.'
        },
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_tawjihi_super_bundle_2009',
        nameAr: 'الحقيبة الشاملة لتفوق التوجيهي 2009 (فيزياء + رياضيات + عربي)',
        nameEn: 'Tawjihi 2009 Super Bundle',
        shortDescriptionAr: 'الباقة الكبرى: تشمل ملخصات المواد الأساسية + بنك 500 سؤال وزاري + نماذج امتحانات تجريبية محلولة.',
        descriptionAr: 'وفر أكثر من 40% مع هذه الباقة المتكاملة المخصصة لطلبة جيل 2009. تتضمن حقيبة الشروحات المركزة في الفيزياء والرياضيات العلمي بالإضافة لمذكرة البلاغة والإعراب في اللغة العربية.',
        price: 55,
        oldPrice: 90,
        discountPercentage: 39,
        category: 'باقات وحقائب شاملة',
        categoryId: 'cat_bundles',
        type: 'bundle',
        sku: 'BNDL-ALL-2009',
        stock: 9999,
        coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['باقة', 'شامل', 'توجيهي', 'عرض خاص', 'خصم'],
        isFeatured: true,
        isBestSeller: true,
        isPublished: true,
        shippingRequired: false,
        salesCount: 89,
        rating: 5.0,
        ratingCount: 24,
        badge: '⭐ توفير 40%',
        digitalContent: {
          fileFormat: 'ZIP & PDF Pack',
          fileSize: '48.5 MB',
          downloadUrl: 'https://example.com/arixon-tawjihi-2009-super-bundle.zip',
          accessInstructionsAr: 'حقيبة متكاملة تضم 4 ملفات PDF رقمية جاهزة للدراسة والطباعة مع إمكانية التصفح من الهاتف.'
        },
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_math_calculus_bank',
        nameAr: 'بنك أسئلة التفاضل والتكامل الوزاري مع الحلول النموذجية',
        nameEn: 'Calculus Question Bank Tawjihi',
        shortDescriptionAr: 'أكثر من 300 سؤال ومسألة حسابية متدرجة في التفاضل وتطبيقاته مع خطوات الحل التفصيلية.',
        descriptionAr: 'مرجع الرياضيات الأقوى لطلبة العلمي. يغطي نظريات الاتصال، قواعد الاشتقاق، المعدلات المرتبطة بالزمن، وتطبيقات القيم القصوى خطوة بخطوة بالرسم والتفسير الدقيق.',
        price: 30,
        oldPrice: 40,
        discountPercentage: 25,
        category: 'الرياضيات',
        categoryId: 'cat_math',
        type: 'digital',
        sku: 'MATH-CALC-300',
        stock: 9999,
        coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['رياضيات', 'تفاضل', 'تكامل', 'علمي', 'توجيهي'],
        isFeatured: true,
        isBestSeller: false,
        isPublished: true,
        shippingRequired: false,
        salesCount: 63,
        rating: 4.8,
        ratingCount: 19,
        badge: '📐 محلول بالتفصيل',
        digitalContent: {
          fileFormat: 'PDF',
          pageCount: 92,
          fileSize: '19.8 MB',
          downloadUrl: 'https://example.com/arixon-math-calculus-bank.pdf',
          accessInstructionsAr: 'ملف PDF ملون عالي الجودة مع خطوط واضحة وخطوات حل نموذجية خطوة بخطوة.'
        },
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_printed_notebook_physics',
        nameAr: 'دفتر الملاحظات الامتحاني الفاخر Arixon (نسخة مطبوعة)',
        nameEn: 'Arixon Premium Printed Study Notebook',
        shortDescriptionAr: 'دفتر سلك فاخر مقوى 120 صفحة مجهز بجداول تلخيص القوانين وخانات المراجعة الدورية السريعة.',
        descriptionAr: 'نسخة ورقية فاخرة مطبوعة تصلك حتى باب بيتك أو مدرستك. مصمم خصيصاً لمساعدة طلبة التوجيهي على تدوين الملاحظات الذكية وتلخيص الأفكار المعقدة بسرعة وبطريقة احترافية.',
        price: 20,
        oldPrice: 25,
        discountPercentage: 20,
        category: 'الفيزياء',
        categoryId: 'cat_physics',
        type: 'physical',
        sku: 'NOTE-BOOK-PHYS-01',
        stock: 45,
        lowStockThreshold: 10,
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['مادي', 'دفتر', 'قرطاسية', 'توصيل'],
        isFeatured: false,
        isBestSeller: false,
        isPublished: true,
        shippingRequired: true,
        salesCount: 31,
        rating: 4.7,
        ratingCount: 12,
        badge: '📦 شحن سريع',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'prod_arabic_grammar_guide',
        nameAr: 'مفتاح الإعراب والبلاغة في اللغة العربية للتوجيهي',
        nameEn: 'Arabic Grammar & Rhetoric Master Guide',
        shortDescriptionAr: 'دليل مبسط لقواعد النحو والصرف والبلاغة المقررة لشهادة الثانوية العامة مع تدريبات شاملة.',
        descriptionAr: 'وداعاً لصعوبات الإعراب في اللغة العربية. يقدم هذا الكتيب شرحاً تطبيقياً لأساليب الشرط والاستثناء والتوكيد بالإضافة لكافة فنون البلاغة كالتشبيه والاستعارة والطباق مع نماذج إعرابية كاملة.',
        price: 20,
        oldPrice: 28,
        discountPercentage: 28,
        category: 'اللغة العربية',
        categoryId: 'cat_arabic',
        type: 'digital',
        sku: 'ARB-GRAM-2009',
        stock: 9999,
        coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80'
        ],
        tags: ['عربي', 'نحو', 'بلاغة', 'إعراب', 'توجيهي'],
        isFeatured: false,
        isBestSeller: true,
        isPublished: true,
        shippingRequired: false,
        salesCount: 77,
        rating: 4.9,
        ratingCount: 29,
        badge: '📝 مفتاح الإعراب',
        digitalContent: {
          fileFormat: 'PDF',
          pageCount: 54,
          fileSize: '9.4 MB',
          downloadUrl: 'https://example.com/arixon-arabic-master-guide.pdf',
          accessInstructionsAr: 'ملف رقمي عالي الدقة مقسم حسب الوحدات الدراسية المقررة في المنهج الفلسطيني.'
        },
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const p of products) {
      await setDoc(doc(db, 'storeProducts', p.id), sanitizeForFirestore(p));
    }

    // 3. Initial promotional coupon
    const welcomeCoupon: StoreCoupon = {
      id: 'cpn_arixon2009',
      code: 'ARIXON2009',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 20,
      maxDiscountAmount: 30,
      usageLimit: 500,
      usedCount: 18,
      isActive: true,
      expiryDate: new Date(Date.now() + 90 * 86400000).toISOString()
    };
    await setDoc(doc(db, 'storeCoupons', welcomeCoupon.id), sanitizeForFirestore(welcomeCoupon));

    // 4. Initial Settings
    await setDoc(doc(db, 'storeSettings', 'main'), sanitizeForFirestore(DEFAULT_STORE_SETTINGS));

    console.log('[Store Seed] Completed successfully.');
  } catch (err) {
    console.warn('[Store Seed] Seeding error notice:', err);
  }
}

// Convenient function aliases for backwards compatibility with component imports
export const createStoreProduct = saveProduct;
export const updateStoreProduct = saveProduct;
export const deleteStoreProduct = deleteProduct;
export const getAllStoreOrders = getAllOrdersForAdmin;
export const updateOrderPaymentStatus = updatePaymentStatus;
export const createStoreCoupon = saveCoupon;
export const updateStoreCoupon = saveCoupon;
export const deleteStoreCoupon = deleteCoupon;
export const updateStoreSettings = saveStoreSettings;
export const initializeStoreDataIfEmpty = seedInitialStoreDataIfEmpty;

