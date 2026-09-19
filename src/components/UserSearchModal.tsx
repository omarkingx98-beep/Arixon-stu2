import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchUsersByQuery } from '../lib/socialService';
import type { UserProfile } from '../types';
import {
  Search,
  X,
  Loader2,
  User,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  CosmeticAvatarFrame,
  CosmeticNameEffect,
  CosmeticTitle,
} from './CosmeticRenderer';
import { RoleBadge } from './RoleBadge';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserProfile) => void;
  onStartChat: (user: UserProfile) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectUser,
  onStartChat,
}) => {
  const { profile: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search effect with debounce
  useEffect(() => {
    if (!isOpen) return;

    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const found = await searchUsersByQuery(term, currentUser?.uid);
        setResults(found);
        setHasSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchTerm, isOpen, currentUser?.uid]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="user-search-modal-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="user-search-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-lg max-h-[85vh] rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header & Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              <span>البحث عن طلاب ومستخدمين باليوزر</span>
            </h2>
            <button
              id="close-search-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="search-user-input"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اكتب اسم المستخدم @username أو الاسم..."
              className="w-full pr-10 pl-10 py-3 text-xs sm:text-sm rounded-2xl bg-white dark:bg-[#141a29] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#fcfdfe] dark:bg-[#0a0e17]">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">جارٍ البحث في قاعدة بيانات الطلاب...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((targetUser) => (
                <div
                  key={targetUser.uid}
                  id={`user-search-result-${targetUser.uid}`}
                  onClick={() => onSelectUser(targetUser)}
                  className="p-3 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CosmeticAvatarFrame
                      photoURL={targetUser.photoURL}
                      displayName={targetUser.displayName || targetUser.username}
                      frameId={targetUser.equippedFrameId}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <CosmeticNameEffect effectId={targetUser.equippedNameEffectId}>
                            {targetUser.displayName || targetUser.username}
                          </CosmeticNameEffect>
                        </span>
                        {/* Green star for admin or specific role */}
                        <RoleBadge role={targetUser.role} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-semibold" dir="ltr">
                          @{targetUser.username}
                        </span>
                        {targetUser.equippedTitleId && (
                          <CosmeticTitle titleId={targetUser.equippedTitleId} />
                        )}
                        <span className="text-[10px] text-slate-400">
                          • {targetUser.totalPoints || 0} نقطة
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      id={`chat-user-search-${targetUser.uid}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChat(targetUser);
                      }}
                      title="محادثة مباشرة"
                      className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      id={`view-user-search-${targetUser.uid}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(targetUser);
                      }}
                      title="عرض الملف"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched && searchTerm ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                لم يتم العثور على أي مستخدم بهذا الاسم
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                تأكد من كتابة اليوزر بدقة (مثال: omar أو @student).
              </p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ابحث وتواصل مع زملائك في توجيهي 2009
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                يمكنك البحث باليوزر، عرض الملف الشخصي، المراسلة الفورية، إضافة أصدقاء، وتعيين الرتب للمدراء.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
