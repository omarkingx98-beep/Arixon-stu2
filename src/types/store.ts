import type { SubjectId } from './index';

export type ProductType = 'digital' | 'physical' | 'bundle' | 'subscription';

export interface DigitalContentConfig {
  downloadUrl?: string;
  externalUrl?: string;
  embedUrl?: string;
  accessInstructionsAr?: string;
  fileSize?: string;
  fileFormat?: string; // e.g. "PDF", "ZIP", "Video", "Drive"
  pageCount?: number;
}

export interface StoreProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn?: string;
  descriptionAr: string;
  descriptionEn?: string;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  category: string;
  categoryId: string;
  type: ProductType;
  sku?: string;
  stock: number;
  lowStockThreshold?: number;
  images: string[];
  coverImage: string;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isPublished: boolean;
  isArchived?: boolean;
  isActive?: boolean;
  digitalContent?: DigitalContentConfig;
  bundleItemIds?: string[];
  shippingRequired: boolean;
  salesCount: number;
  viewsCount?: number;
  rating: number; // 0 - 5
  ratingCount: number;
  badge?: string; // e.g. "🔥 عرض خاص", "⭐ الأكثر طلباً"
  createdAt: string;
  updatedAt: string;
}

export interface StoreCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
}

export interface StoreCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate?: string;
  expiryDate?: string;
  usageLimit?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
  applicableProductIds?: string[];
}

export interface CartItem {
  productId: string;
  product: StoreProduct;
  quantity: number;
  selectedPrice: number;
}

export type PaymentMethodId = 
  | 'cod' 
  | 'bop' 
  | 'palpay' 
  | 'jawwal_pay' 
  | 'pib' 
  | 'bank_transfer' 
  | 'cash';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'ready' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'completed';

export interface OrderItemRecord {
  productId: string;
  productName: string;
  productType: ProductType;
  price: number;
  quantity: number;
  coverImage?: string;
  digitalContent?: DigitalContentConfig;
}

export interface StoreOrder {
  id: string;
  orderNumber: string; // e.g. "ARX-74129"
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemRecord[];
  subtotal: number;
  couponCode?: string;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethodId;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentReference?: string;
  paymentProofUrl?: string;
  shippingAddress?: {
    city: string;
    addressLine: string;
    notes?: string;
  };
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  isVerifiedBuyer: boolean;
  isVisible: boolean;
}

export interface WishlistItem {
  productId: string;
  addedAt: string;
  product?: StoreProduct;
}

export interface DigitalLibraryItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productType: ProductType;
  orderId: string;
  orderNumber: string;
  grantedAt: string;
  coverImage?: string;
  digitalContent?: DigitalContentConfig;
  expiresAt?: string;
}

export interface PaymentAccountDetails {
  bopAccount?: string;
  bopIban?: string;
  bopName?: string;
  palpayWallet?: string;
  jawwalPayWallet?: string;
  pibAccount?: string;
  generalInstructionsAr?: string;
}

export interface StoreSettings {
  storeEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessageAr: string;
  currency: string; // e.g. "₪"
  currencyCode: string; // "ILS"
  shippingFee: number;
  freeShippingThreshold?: number;
  enabledPaymentMethods: Record<PaymentMethodId, boolean>;
  paymentInstructions: PaymentAccountDetails;
  couponsEnabled: boolean;
  reviewsEnabled: boolean;
  enableReviews?: boolean;
  wishlistEnabled: boolean;
  storeAnnouncement?: string;
  showSalesCount: boolean;
  whatsappContact?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeEnabled: true,
  maintenanceMode: false,
  maintenanceMessageAr: '',
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
    cash: true,
  },
  paymentInstructions: {},
  couponsEnabled: true,
  reviewsEnabled: true,
  enableReviews: true,
  wishlistEnabled: true,
  showSalesCount: true,
};

export interface StoreBanner {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  imageUrl?: string;
  targetUrl?: string;
  targetCategory?: string;
  targetProduct?: string;
  badgeText?: string;
  buttonTextAr?: string;
  isActive: boolean;
  displayOrder: number;
}
