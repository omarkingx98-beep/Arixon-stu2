import React from 'react';
import { Home, BookOpen, ShoppingBag, Trophy, User } from 'lucide-react';
import type { NavigationTab } from '../types';

interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNavigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as const, label: 'الرئيسية', icon: Home },
    { id: 'exams' as const, label: 'الامتحانات', icon: BookOpen },
    { id: 'store' as const, label: 'المتجر', icon: ShoppingBag },
    { id: 'leaderboard' as const, label: 'الترتيب', icon: Trophy },
    { id: 'profile' as const, label: 'ملفي', icon: User },
  ];

  return (
    <nav 
      id="bottom-mobile-nav"
      aria-label="التنقل الرئيسي"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
    >
      <div className="grid grid-cols-5 max-w-md mx-auto h-16 px-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative select-none cursor-pointer ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] leading-none truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
