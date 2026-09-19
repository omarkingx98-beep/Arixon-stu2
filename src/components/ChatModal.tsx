import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateConversation,
  sendChatMessage,
  listenToConversationMessages,
  markConversationAsRead,
  checkBlockStatus,
  unblockUser,
} from '../lib/socialService';
import type { UserProfile, ChatMessage, ChatConversation } from '../types';
import {
  X,
  Send,
  Loader2,
  ShieldAlert,
  UserCheck,
  Sparkles,
  MessageCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';
import { CosmeticAvatarFrame, CosmeticNameEffect } from './CosmeticRenderer';
import { RoleBadge } from './RoleBadge';

interface ChatModalProps {
  targetUser?: UserProfile | null;
  recipient?: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: (user: UserProfile) => void;
  onViewProfile?: (user: UserProfile) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  targetUser,
  recipient,
  isOpen,
  onClose,
  onOpenProfile,
  onViewProfile,
}) => {
  const target = targetUser || recipient;
  const { profile: currentUser } = useAuth();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blockStatus, setBlockStatus] = useState<{
    isBlocked: boolean;
    blockedByMe: boolean;
    blockedByOther: boolean;
  }>({ isBlocked: false, blockedByMe: false, blockedByOther: false });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initialize or load conversation & check block status
  useEffect(() => {
    if (!isOpen || !currentUser || !target) return;

    let isMounted = true;
    setIsLoadingConv(true);
    setErrorMsg(null);

    async function initChat() {
      if (!target || !currentUser) return;
      try {
        // Check blocks
        const blocks = await checkBlockStatus(currentUser.uid, target.uid);
        if (isMounted) setBlockStatus(blocks);

        // Fetch / create conversation
        const conv = await getOrCreateConversation(currentUser, target);
        if (isMounted) {
          setConversation(conv);
          // Mark read
          await markConversationAsRead(conv.id, currentUser.uid);
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        if (isMounted) setErrorMsg(err.message || 'حدث خطأ في فتح المحادثة');
      } finally {
        if (isMounted) setIsLoadingConv(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser, target]);

  // 2. Real-time message listener
  useEffect(() => {
    if (!conversation || !isOpen) return;

    const unsubscribe = listenToConversationMessages(
      conversation.id,
      (newMessages) => {
        setMessages(newMessages);
        setTimeout(scrollToBottom, 100);
        if (currentUser) {
          markConversationAsRead(conversation.id, currentUser.uid);
        }
      },
      (err) => {
        console.warn('Real-time listener warning:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversation, isOpen, currentUser]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser || !conversation || !target || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);
    setErrorMsg(null);

    try {
      await sendChatMessage({
        conversationId: conversation.id,
        sender: currentUser,
        recipientId: target.uid,
        text: textToSend,
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setErrorMsg(err.message || 'تعذر إرسال الرسالة');
      setInputText(textToSend); // Restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  const handleUnblock = async () => {
    if (!currentUser || !target) return;
    try {
      await unblockUser(currentUser.uid, target.uid);
      setBlockStatus({ isBlocked: false, blockedByMe: false, blockedByOther: false });
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إلغاء الحظر');
    }
  };

  if (!isOpen || !target) return null;

  return (
    <div
      id="chat-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="chat-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-lg h-[85vh] max-h-[640px] rounded-3xl bg-white dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50">
          <div
            onClick={() => (onOpenProfile || onViewProfile)?.(target)}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
            title="عرض الملف الشخصي"
          >
            <CosmeticAvatarFrame
              photoURL={target.photoURL}
              displayName={target.displayName || target.username}
              frameId={target.equippedFrameId}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  <CosmeticNameEffect effectId={target.equippedNameEffectId}>
                    {target.displayName || target.username}
                  </CosmeticNameEffect>
                </span>
                <RoleBadge role={target.role} size="sm" />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono" dir="ltr">
                @{target.username}
              </p>
            </div>
          </div>

          <button
            id="close-chat-btn"
            onClick={onClose}
            aria-label="إغلاق المحادثة"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] dark:bg-[#0a0e17]">
          {isLoadingConv ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <span className="text-xs">جارٍ فتح المحادثة المشفرة والآمنة...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-500">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  بداية المحادثة مع {targetUser.displayName || targetUser.username}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  أرسل رسالة للتعارف، مشاركة الأسئلة التنافسية، أو التعاون الدراسي لجيل 2009.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.uid;
              const formattedTime = new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] sm:max-w-[70%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-xs ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isMe ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      <span>{formattedTime}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-blue-200 inline" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar or Block Banner */}
        {blockStatus.isBlocked ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>
                {blockStatus.blockedByMe
                  ? 'قمت بحظر هذا الطالب سابقاً. لا يمكن إرسال الرسائل أثناء الحظر.'
                  : 'لا يمكنك مراسلة هذا المستخدم.'}
              </span>
            </div>
            {blockStatus.blockedByMe && (
              <button
                onClick={handleUnblock}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء الحظر والتمكين من المراسلة
              </button>
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0e1320] flex items-center gap-2"
          >
            <input
              type="text"
              id="chat-message-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              disabled={isSending || isLoadingConv}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              id="chat-send-message-btn"
              disabled={!inputText.trim() || isSending || isLoadingConv}
              aria-label="إرسال"
              className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 rotate-180" />
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
