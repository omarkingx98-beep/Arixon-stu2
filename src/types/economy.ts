/**
 * Types for Arixon Phase 5: Points Economy, Store Items, Cosmetics, Inventory, and Transactions
 */

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type StoreCategoryType = 
  | 'exam_tools'      // أدوات الاختبار
  | 'themes'          // المظاهر
  | 'frames'          // إطارات الصور
  | 'name_effects'    // تأثيرات الاسم
  | 'titles'          // الألقاب
  | 'badges'          // الشارات
  | 'backgrounds'     // خلفيات الملف الشخصي
  | 'rare'            // العناصر النادرة
  | 'limited';        // العناصر المحدودة

export type StoreItemType = 
  | 'cosmetic_frame'
  | 'cosmetic_name_effect'
  | 'cosmetic_title'
  | 'cosmetic_badge'
  | 'cosmetic_theme'
  | 'consumable_exam_tool';

export type StoreItemCurrency = 
  | 'spendable_points'
  | 'achievement_unlock'
  | 'special_reward';

export type ExamToolType = 
  | 'hint'               // تلميح تعليمي
  | 'remove_one'          // حذف خيار خاطئ واحد
  | 'remove_two'          // حذف خيارين خاطئين
  | 'add_time_30'         // +30 ثانية
  | 'add_time_60'         // +1 دقيقة
  | 'question_insight';   // إضاءة ومفتاح الحل

export interface StoreItemPreviewConfig {
  borderClass?: string;
  glowClass?: string;
  particleColor?: string;
  animationClass?: string;
  textEffectClass?: string;
  textGradient?: string;
  avatarRingClass?: string;
  themeAccent?: string;
  badgeIcon?: string;
  sampleAvatarUrl?: string;
  customStyle?: Record<string, string>;
}

export interface StoreItemEffectConfig {
  toolType?: ExamToolType;
  value?: number;
  descriptionAr?: string;
}

export interface StoreItem {
  id: string;
  name: string; // Arabic name
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  category: StoreCategoryType;
  type: StoreItemType;
  price: number; // In spendable points
  currency: StoreItemCurrency;
  rarity: ItemRarity;
  icon: string; // Lucide icon name or emoji
  previewConfig: StoreItemPreviewConfig;
  active: boolean;
  limited: boolean;
  startAt?: string; // ISO String
  endAt?: string;   // ISO String
  maxPurchase?: number; // 1 for cosmetics, undefined or >1 for consumables
  consumable: boolean;
  quantity?: number; // Quantity given per purchase (e.g. 1, 3)
  effectConfig?: StoreItemEffectConfig;
  salesCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface UserInventoryItem {
  id: string; // `${userId}_${itemId}`
  userId: string;
  itemId: string;
  item: StoreItem;
  quantity: number; // >0 for consumables, 1 for owned cosmetics
  isEquipped?: boolean;
  acquiredAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'purchase'
  | 'reward'
  | 'usage'
  | 'refund'
  | 'point_adjustment'
  | 'admin_grant';

export interface StoreTransaction {
  id: string;
  userId: string;
  userDisplayName?: string;
  type: TransactionType;
  itemId?: string;
  itemName?: string;
  itemRarity?: ItemRarity;
  amount: number; // Points change (negative for purchases, positive for rewards/refunds)
  currency: 'spendable_points' | 'competition_points';
  previousBalance: number;
  newBalance: number;
  timestamp: string;
  source: string; // e.g. 'store_purchase', 'exam_completion', 'daily_streak', 'admin_adjustment'
  metadata?: Record<string, any>;
}

export interface EconomySettings {
  id?: string;
  examCompletionReward: {
    competition: number;
    spendable: number;
  };
  correctAnswerReward: {
    competition: number;
    spendable: number;
  };
  challengeReward: {
    competition: number;
    spendable: number;
  };
  streakReward: {
    competition: number;
    spendable: number;
  };
  dailyReward: {
    competition: number;
    spendable: number;
  };
  specialEventReward?: {
    competition: number;
    spendable: number;
    active: boolean;
    name?: string;
  };
  allowedExamItems: string[]; // List of tool item IDs allowed by default
  maxFeaturedBadges: number; // Default 5
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserEquippedLoadout {
  equippedFrameId?: string | null;
  equippedNameEffectId?: string | null;
  equippedTitleId?: string | null;
  equippedThemeId?: string | null;
  featuredBadgeIds?: string[];
}
