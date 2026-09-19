import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showTagline = false,
  size = 'md' 
}) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Stylized energetic Arixon geometric emblem */}
      <div 
        id="arixon-brand-icon"
        className={`${iconSize} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 shadow-md shadow-blue-500/20 text-white flex-shrink-0 transition-transform hover:scale-105`}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white stroke-[2.2]"
        >
          {/* Futuristic modern A shape with energy chevron */}
          <path 
            d="M12 3L4 19H8.5L12 11L15.5 19H20L12 3Z" 
            fill="currentColor" 
            fillOpacity="0.9"
          />
          <path 
            d="M10 14.5L12 10.5L14 14.5H10Z" 
            fill="#60A5FA" 
          />
          <circle cx="12" cy="7.5" r="1.5" fill="#93C5FD" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span 
            className={`font-black tracking-tight ${textSize} font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 dark:text-white leading-none`}
          >
            ARIXON
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            2009
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight tracking-wide mt-0.5">
            Learn. Compete. Improve.
          </span>
        )}
      </div>
    </div>
  );
};
