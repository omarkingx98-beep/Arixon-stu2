import React from 'react';
import { Star, ShieldCheck, GraduationCap, Award, Sparkles } from 'lucide-react';

interface RoleBadgeProps {
  role?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showLabel = true,
}) => {
  if (!role || role === 'student') return null;

  const normalized = role.toLowerCase().trim();

  // 1. Admin & Super Admin -> The Green Star requested by user:
  // "وإيش لما أحط أدمن يظهر له إشارة هيك النجمة لونها أخضر إنه صار أدمن، كذلك حسب الوظيفة اللي حاطط له إياها."
  if (normalized === 'admin' || normalized === 'super_admin' || normalized === 'owner') {
    const isOwner = normalized === 'owner';
    const isSuper = normalized === 'super_admin';
    const label = isOwner ? 'مالك المنصة' : isSuper ? 'مشرف عام' : 'مدير';

    const starSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5';
    const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : size === 'lg' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-xs';

    return (
      <span
        title={`${label} - رتبة إدارية معتمدة`}
        className={`inline-flex items-center gap-1 font-black rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs ${padding} animate-in fade-in duration-200 select-none`}
      >
        <Star className={`${starSize} fill-emerald-500 text-emerald-500 drop-shadow-xs`} />
        {showLabel && <span>{label}</span>}
      </span>
    );
  }

  // 2. Teacher (معلم) -> Blue
  if (normalized === 'teacher') {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

    return (
      <span
        title="معلم معتمد في منصة أريكسون"
        className={`inline-flex items-center gap-1 font-bold rounded-full bg-sky-500/15 border border-sky-500/35 text-sky-600 dark:text-sky-400 ${padding} select-none`}
      >
        <GraduationCap className={iconSize} />
        {showLabel && <span>معلم</span>}
      </span>
    );
  }

  // 3. Moderator (مشرف) -> Purple
  if (normalized === 'moderator') {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

    return (
      <span
        title="مشرف ساحات ومحتوى"
        className={`inline-flex items-center gap-1 font-bold rounded-full bg-purple-500/15 border border-purple-500/35 text-purple-600 dark:text-purple-400 ${padding} select-none`}
      >
        <ShieldCheck className={iconSize} />
        {showLabel && <span>مشرف</span>}
      </span>
    );
  }

  // 4. Assistant (مساعد) -> Amber
  if (normalized === 'assistant') {
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

    return (
      <span
        title="مساعد تعليمي"
        className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-600 dark:text-amber-400 ${padding} select-none`}
      >
        <Sparkles className={iconSize} />
        {showLabel && <span>مساعد</span>}
      </span>
    );
  }

  // Fallback for custom role ID
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 text-xs select-none`}
    >
      <Award className="w-3 h-3 text-slate-500" />
      {showLabel && <span>{role}</span>}
    </span>
  );
};
