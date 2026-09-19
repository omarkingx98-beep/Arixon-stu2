import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listenToUserConversations,
  fetchUserProfileById,
} from '../lib/socialService';
import type { ChatConversation, UserProfile } from '../types';
import {
  X,
  MessageCircle,
  Search,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CosmeticAvatarFrame, CosmeticNameEffect } from './CosmeticRenderer';
import { RoleBadge } from './RoleBadge';

interface ConversationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (user: UserProfile) => void;
  onOpenSearch: () => void;
}

export const ConversationsDrawer: React.FC<ConversationsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onOpenSearch,
}) => {
  const { profile: currentUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setIsLoading(true);
    const unsubscribe = listenToUserConversations(currentUser.uid, (list) => {
      setConversations(list);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, currentUser]);

  const handleSelectConversation = async (conv: ChatConversation) => {
    if (!currentUser) return;
    const otherUid = conv.participants.find((id) => id !== currentUser.uid);
    if (!otherUid) return;

    // Try participantData first
    const cached = conv.participantData?.[otherUid];
    if (cached) {
      const fullProfile = (await fetchUserProfileById(otherUid)) || ({
        uid: otherUid,
        displayName: cached.displayName,
        username: cached.username,
        photoURL: cached.photoURL,
        role: cached.role,
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        examsCompleted: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        email: '',
        createdAt: '',
        updatedAt: '',
        lastActiveAt: '',
      } as UserProfile);

      onOpenChat(fullProfile);
    } else {
      const userProfile = await fetchUserProfileById(otherUid);
      if (userProfile) {
        onOpenChat(userProfile);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="conversations-drawer-overlay"
      className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="conversations-drawer-content"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-md h-full bg-white dark:bg-[#0e1320] border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in slide-in-from-left sm:slide-in-from-left duration-200"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                المحادثات المباشرة
              </h2>
              <p className="text-[11px] text-slate-400">
                دردشاتك الخاصة مع طلبة ومشرفي توجيهي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="new-chat-btn"
              onClick={onOpenSearch}
              className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
              title="بحث عن طالب لمراسلته"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              id="close-drawer-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#fcfdfe] dark:bg-[#0a0e17]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">جارٍ تحميل المحادثات...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                لا توجد رسائل بعد
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ابدأ محادثتك الأولى الآن بالبحث عن أي زميل أو طالب عبر اليوزر!
              </p>
              <button
                onClick={onOpenSearch}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>ابحث عن طالب باليوزر</span>
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUid = conv.participants.find((id) => id !== currentUser?.uid);
              const otherInfo = otherUid ? conv.participantData?.[otherUid] : undefined;
              const unread = currentUser ? conv.unreadCount?.[currentUser.uid] || 0 : 0;
              const formattedTime = conv.lastMessageTimestamp
                ? new Date(conv.lastMessageTimestamp).toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div
                  key={conv.id}
                  id={`conv-item-${conv.id}`}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    unread > 0
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 shadow-xs'
                      : 'bg-white dark:bg-[#111726] border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CosmeticAvatarFrame
                      photoURL={otherInfo?.photoURL}
                      displayName={otherInfo?.displayName || otherInfo?.username || 'مستخدم'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {otherInfo?.displayName || otherInfo?.username || 'مستخدم'}
                        </span>
                        <RoleBadge role={otherInfo?.role} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[200px]">
                        {conv.lastMessageText || 'محادثة جديدة'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">{formattedTime}</span>
                    {unread > 0 && (
                      <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
