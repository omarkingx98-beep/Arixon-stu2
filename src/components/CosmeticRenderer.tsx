import React from 'react';
import type { ItemRarity } from '../types/economy';
import { INITIAL_STORE_ITEMS } from '../data/defaultStoreItems';
import { 
  Sparkles, 
  Crown, 
  Flame, 
  Zap, 
  Snowflake, 
  Orbit, 
  Award, 
  Target, 
  Check, 
  Circle,
  Lightbulb,
  Scissors,
  Clock,
  Hourglass,
  Compass,
  Bookmark,
  Shield,
  Atom,
  Palette,
  Moon,
  Rocket
} from 'lucide-react';

// Icon resolver helper for dynamic Lucide icons
export const renderStoreIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'Lightbulb': return <Lightbulb className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Hourglass': return <Hourglass className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Circle': return <Circle className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Orbit': return <Orbit className={className} />;
    case 'Crown': return <Crown className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Award': return <Award className={className} />;
    case 'Target': return <Target className={className} />;
    case 'Bookmark': return <Bookmark className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Atom': return <Atom className={className} />;
    case 'Palette': return <Palette className={className} />;
    case 'Moon': return <Moon className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    default: return <Sparkles className={className} />;
  }
};

/**
 * Visual badge and styling for item rarities
 */
export const RarityBadge: React.FC<{ rarity: ItemRarity; className?: string }> = ({ rarity, className = '' }) => {
  switch (rarity) {
    case 'common':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ${className}`}>
          شائع
        </span>
      );
    case 'rare':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs ${className}`}>
          نادر
        </span>
      );
    case 'epic':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/20 ${className}`}>
          ملحمي
        </span>
      );
    case 'legendary':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-300 dark:border-amber-600 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-950/80 dark:to-yellow-950/80 text-amber-800 dark:text-amber-300 shadow-sm shadow-amber-500/30 ${className}`}>
          <Crown className="w-2.5 h-2.5" />
          <span>أسطوري</span>
        </span>
      );
    case 'mythic':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-fuchsia-400 dark:border-fuchsia-600 bg-gradient-to-r from-fuchsia-100 via-pink-100 to-amber-100 dark:from-fuchsia-950 dark:via-pink-950 dark:to-amber-950 text-fuchsia-800 dark:text-fuchsia-300 shadow-md shadow-fuchsia-500/40 animate-pulse ${className}`}>
          <Sparkles className="w-2.5 h-2.5" />
          <span>خرافي</span>
        </span>
      );
    default:
      return null;
  }
};

/**
 * Avatar with customized equipped frame
 */
export const AvatarWithFrame: React.FC<{
  photoURL?: string | null;
  displayName?: string;
  frameId?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  crownRank?: number; // 1 = Gold Crown, 2 = Silver, 3 = Bronze
}> = ({
  photoURL,
  displayName,
  frameId,
  size = 'md',
  className = '',
  crownRank,
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const roundedClasses = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  };

  const item = frameId ? INITIAL_STORE_ITEMS.find(i => i.id === frameId) : null;
  const frameRing = item?.previewConfig?.avatarRingClass || (frameId ? 'ring-2 ring-blue-500' : 'ring-1 ring-slate-200 dark:ring-slate-800');

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {/* Crown indicator if podium top 3 */}
      {crownRank === 1 && (
        <div className="absolute -top-3.5 -right-1 z-10 p-0.5 rounded-full bg-amber-400 text-amber-950 shadow-md shadow-amber-400/50">
          <Crown className="w-4 h-4" />
        </div>
      )}
      {crownRank === 2 && (
        <div className="absolute -top-3 -right-1 z-10 p-0.5 rounded-full bg-slate-300 text-slate-900 shadow-md">
          <Award className="w-3.5 h-3.5" />
        </div>
      )}
      {crownRank === 3 && (
        <div className="absolute -top-3 -right-1 z-10 p-0.5 rounded-full bg-amber-700 text-white shadow-md">
          <Award className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Frame Badge Emoji (e.g. 👑 or 🌟 or 🚀) on corner */}
      {item?.previewConfig?.badgeIcon && (
        <div className="absolute -bottom-1 -left-1 z-10 text-xs sm:text-sm drop-shadow-md">
          {item.previewConfig.badgeIcon}
        </div>
      )}

      <img
        src={photoURL || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Arixon1'}
        alt={displayName || 'User Avatar'}
        className={`${sizeClasses[size]} ${roundedClasses[size]} object-cover bg-slate-100 dark:bg-slate-800 ${frameRing}`}
      />
    </div>
  );
};

/**
 * Display name with customized Name Effect
 */
export const NameWithEffect: React.FC<{
  name: string;
  effectId?: string | null;
  className?: string;
}> = ({ name, effectId, className = '' }) => {
  if (!effectId) {
    return <span className={className}>{name}</span>;
  }

  const effectItem = INITIAL_STORE_ITEMS.find(i => i.id === effectId);
  const effectClass = effectItem?.previewConfig?.textEffectClass || '';

  return (
    <span className={`${effectClass} ${className}`}>
      {name}
    </span>
  );
};

/**
 * Student Title Pill (e.g. "خبير الفيزياء 2009 ⚛️")
 */
export const TitleBadge: React.FC<{
  titleId?: string | null;
  className?: string;
}> = ({ titleId, className = '' }) => {
  if (!titleId) return null;

  const item = INITIAL_STORE_ITEMS.find(i => i.id === titleId);
  if (!item) return null;

  const borderClass = item.previewConfig?.borderClass || 'border-blue-300 bg-blue-50 text-blue-600';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${borderClass} ${className}`}>
      {item.name}
    </span>
  );
};

/**
 * Featured Badges row (up to 5)
 */
export const FeaturedBadgesRow: React.FC<{
  badgeIds?: string[] | null;
  className?: string;
}> = ({ badgeIds, className = '' }) => {
  if (!badgeIds || badgeIds.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {badgeIds.map((id) => {
        const item = INITIAL_STORE_ITEMS.find(i => i.id === id);
        if (!item) return null;
        return (
          <div
            key={id}
            title={item.name}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${item.previewConfig.borderClass || 'border-slate-200'}`}
          >
            <span>{item.previewConfig.badgeIcon || '🎖️'}</span>
            <span className="text-[10px]">{item.name.replace(/^[^a-zA-Z0-9\u0600-\u06FF]+/, '')}</span>
          </div>
        );
      })}
    </div>
  );
};

// Convenient aliases for component consumers
export const CosmeticAvatarFrame = AvatarWithFrame;
export const CosmeticNameEffect: React.FC<{ 
  effectId?: string | null; 
  children: React.ReactNode; 
  className?: string 
}> = ({ effectId, children, className = '' }) => {
  if (!effectId) return <span className={className}>{children}</span>;
  const effectItem = INITIAL_STORE_ITEMS.find(i => i.id === effectId);
  const effectClass = effectItem?.previewConfig?.textEffectClass || '';
  return <span className={`${effectClass} ${className}`}>{children}</span>;
};
export const CosmeticTitle = TitleBadge;
export const CosmeticBadgeList = FeaturedBadgesRow;

