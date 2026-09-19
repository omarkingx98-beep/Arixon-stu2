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
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth, sanitizeFirestoreData } from './firebase';
import { recordAdminAuditLog, adjustStudentPointsWithReason } from './adminService';
import { saveStudentRoleOverride } from './studentOverrides';
import type {
  UserProfile,
  Friendship,
  FriendshipStatus,
  UserBlock,
  ChatConversation,
  ChatMessage,
  ChatParticipantInfo,
} from '../types';

// ==========================================
// 1. User Search & Profile Retrieval
// ==========================================

export async function searchUsersByQuery(
  searchTerm: string,
  excludeUid?: string,
  maxResults = 20
): Promise<UserProfile[]> {
  const clean = searchTerm.trim().replace(/^@/, '').toLowerCase();
  if (!clean) return [];

  try {
    const usersRef = collection(db, 'users');
    // Fetch a batch of recent/active users and filter in-memory for flexible Arabic & username substring matching
    const q = query(usersRef, limit(80));
    const snap = await getDocs(q);

    const matches: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      const uid = docSnap.id;
      if (excludeUid && uid === excludeUid) return;
      if (data.isDeleted || data.accountDisabled) return;

      const username = (data.username || '').toLowerCase();
      const displayName = (data.displayName || '').toLowerCase();
      const email = (data.email || '').toLowerCase();

      if (
        username.includes(clean) ||
        displayName.includes(clean) ||
        email.startsWith(clean)
      ) {
        matches.push({
          ...data,
          uid,
        });
      }
    });

    return matches.slice(0, maxResults);
  } catch (err) {
    console.error('[SocialService] Error searching users:', err);
    return [];
  }
}

export async function fetchUserProfileById(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return {
        ...(snap.data() as UserProfile),
        uid: snap.id,
      };
    }
  } catch (err) {
    console.error(`[SocialService] Error fetching user ${uid}:`, err);
  }
  return null;
}

// ==========================================
// 2. Friendship Management
// ==========================================

export function getFriendshipDocId(uid1: string, uid2: string): string {
  const [first, second] = [uid1, uid2].sort();
  return `friend_${first}_${second}`;
}

export async function getFriendshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{
  status: FriendshipStatus | 'none';
  friendship: Friendship | null;
  isSender: boolean;
}> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { status: 'none', friendship: null, isSender: false };
  }

  const friendDocId = getFriendshipDocId(currentUserId, targetUserId);
  try {
    const snap = await getDoc(doc(db, 'friendships', friendDocId));
    if (snap.exists()) {
      const friendship = { id: snap.id, ...snap.data() } as Friendship;
      return {
        status: friendship.status,
        friendship,
        isSender: friendship.senderId === currentUserId,
      };
    }
  } catch (err) {
    console.warn('[SocialService] Error checking friendship status:', err);
  }

  return { status: 'none', friendship: null, isSender: false };
}

export async function sendFriendRequest(
  sender: UserProfile,
  receiver: UserProfile
): Promise<Friendship> {
  const friendDocId = getFriendshipDocId(sender.uid, receiver.uid);
  const now = new Date().toISOString();

  const friendship: Friendship = {
    id: friendDocId,
    user1Id: sender.uid,
    user2Id: receiver.uid,
    users: [sender.uid, receiver.uid],
    senderId: sender.uid,
    receiverId: receiver.uid,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'friendships', friendDocId), sanitizeFirestoreData(friendship), { merge: true });
  return friendship;
}

export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'friendships', friendshipId), {
    status: 'accepted',
    updatedAt: now,
  });
}

export async function cancelOrRemoveFriendship(friendshipId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

// ==========================================
// 3. User Blocking & Safety
// ==========================================

export function getBlockDocId(blockerId: string, blockedId: string): string {
  return `block_${blockerId}_${blockedId}`;
}

export async function checkBlockStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByOther: boolean;
  myBlockId?: string;
}> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { isBlocked: false, blockedByMe: false, blockedByOther: false };
  }

  try {
    const myBlockSnap = await getDoc(doc(db, 'blocks', getBlockDocId(currentUserId, targetUserId)));
    const otherBlockSnap = await getDoc(doc(db, 'blocks', getBlockDocId(targetUserId, currentUserId)));

    const blockedByMe = myBlockSnap.exists();
    const blockedByOther = otherBlockSnap.exists();

    return {
      isBlocked: blockedByMe || blockedByOther,
      blockedByMe,
      blockedByOther,
      myBlockId: blockedByMe ? myBlockSnap.id : undefined,
    };
  } catch (err) {
    console.warn('[SocialService] Error checking block status:', err);
    return { isBlocked: false, blockedByMe: false, blockedByOther: false };
  }
}

export async function blockUser(blockerId: string, blockedId: string): Promise<string> {
  const blockId = getBlockDocId(blockerId, blockedId);
  const blockData: UserBlock = {
    id: blockId,
    blockerId,
    blockedId,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'blocks', blockId), sanitizeFirestoreData(blockData));

  // If there was a friendship, remove it
  try {
    const friendId = getFriendshipDocId(blockerId, blockedId);
    await deleteDoc(doc(db, 'friendships', friendId));
  } catch {}

  return blockId;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const blockId = getBlockDocId(blockerId, blockedId);
  await deleteDoc(doc(db, 'blocks', blockId));
}

// ==========================================
// 4. Direct 1-on-1 Chat Messaging
// ==========================================

export function getConversationDocId(uid1: string, uid2: string): string {
  const [first, second] = [uid1, uid2].sort();
  return `conv_${first}_${second}`;
}

export async function getOrCreateConversation(
  user1: UserProfile,
  user2: UserProfile
): Promise<ChatConversation> {
  const convId = getConversationDocId(user1.uid, user2.uid);
  const docRef = doc(db, 'conversations', convId);

  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...(snap.data() as Omit<ChatConversation, 'id'>) };
  }

  const now = new Date().toISOString();
  const participantData: Record<string, ChatParticipantInfo> = {
    [user1.uid]: {
      uid: user1.uid,
      displayName: user1.displayName || user1.username,
      username: user1.username,
      photoURL: user1.photoURL || '',
      role: user1.role || 'student',
    },
    [user2.uid]: {
      uid: user2.uid,
      displayName: user2.displayName || user2.username,
      username: user2.username,
      photoURL: user2.photoURL || '',
      role: user2.role || 'student',
    },
  };

  const newConv: ChatConversation = {
    id: convId,
    participants: [user1.uid, user2.uid],
    participantData,
    lastMessageText: '',
    lastMessageSenderId: '',
    lastMessageTimestamp: now,
    unreadCount: {
      [user1.uid]: 0,
      [user2.uid]: 0,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(docRef, sanitizeFirestoreData(newConv));
  return newConv;
}

export async function sendChatMessage(params: {
  conversationId: string;
  sender: UserProfile;
  recipientId: string;
  text: string;
}): Promise<ChatMessage> {
  const { conversationId, sender, recipientId, text } = params;
  const trimmed = text.trim();
  if (!trimmed) throw new Error('لا يمكن إرسال رسالة فارغة');

  // Verify block status first
  const blockStatus = await checkBlockStatus(sender.uid, recipientId);
  if (blockStatus.isBlocked) {
    if (blockStatus.blockedByMe) {
      throw new Error('قمت بحظر هذا المستخدم، يرجى إلغاء الحظر للمراسلة.');
    }
    throw new Error('لا يمكنك مراسلة هذا المستخدم.');
  }

  const now = new Date().toISOString();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const message: ChatMessage = {
    id: msgId,
    conversationId,
    senderId: sender.uid,
    senderName: sender.displayName || sender.username,
    senderPhotoURL: sender.photoURL || '',
    text: trimmed,
    createdAt: now,
    readBy: [sender.uid],
  };

  // Add message to subcollection
  const msgRef = doc(db, 'conversations', conversationId, 'messages', msgId);
  await setDoc(msgRef, sanitizeFirestoreData(message));

  // Update conversation doc
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessageText: trimmed,
    lastMessageSenderId: sender.uid,
    lastMessageTimestamp: now,
    updatedAt: now,
    [`unreadCount.${recipientId}`]: 1,
  }).catch(() => {
    // If update fails due to nested field, fallback to set merge
    setDoc(
      convRef,
      {
        lastMessageText: trimmed,
        lastMessageSenderId: sender.uid,
        lastMessageTimestamp: now,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return message;
}

export function listenToConversationMessages(
  conversationId: string,
  onMessages: (messages: ChatMessage[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

  return onSnapshot(
    q,
    (snap) => {
      const messages: ChatMessage[] = [];
      snap.forEach((d) => {
        messages.push({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) });
      });
      onMessages(messages);
    },
    (err) => {
      console.warn('[SocialService] Error listening to messages:', err);
      if (onError) onError(err);
    }
  );
}

export function listenToUserConversations(
  userId: string,
  onConversations: (conversations: ChatConversation[]) => void
): Unsubscribe {
  const convsRef = collection(db, 'conversations');
  const q = query(
    convsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: ChatConversation[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<ChatConversation, 'id'>) });
      });
      onConversations(list);
    },
    (err) => {
      console.warn('[SocialService] Error listening to conversations:', err);
    }
  );
}

export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch {}
}

// ==========================================
// 5. Admin Role & Points Assignment from Profile
// ==========================================

export async function assignRoleFromProfile(
  targetUserId: string,
  targetName: string,
  role: string,
  roleTitleAr: string
): Promise<void> {
  const now = new Date().toISOString();
  const adminUser = auth.currentUser;
  const adminEmail = adminUser?.email || 'admin';

  // 1. Immediately save role override so it is active across the app instantly
  saveStudentRoleOverride(targetUserId, role, roleTitleAr);

  // 2. Dispatch event to update all components on the screen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('arixon:student_updated', {
        detail: {
          studentId: targetUserId,
          role,
          roleTitleAr,
        },
      })
    );
  }

  // 3. Background sync to Firestore and audit logs (non-blocking, won't throw permission error to user)
  (async () => {
    // Try updating user profile doc in Firestore
    try {
      const userRef = doc(db, 'users', targetUserId);
      await setDoc(
        userRef,
        {
          role,
          roleAssignedAt: now,
          roleAssignedBy: adminEmail,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[SocialService] Direct Firestore role write caught (persisted via override):', err);
    }

    // If assigning admin or super_admin, register in adminProfiles
    try {
      if (['admin', 'super_admin', 'owner'].includes(role)) {
        const adminDocRef = doc(db, 'adminProfiles', targetUserId);
        await setDoc(
          adminDocRef,
          {
            uid: targetUserId,
            displayName: targetName,
            role,
            promotedBy: adminEmail,
            createdAt: now,
            lastLoginAt: now,
          },
          { merge: true }
        );
      } else {
        await deleteDoc(doc(db, 'adminProfiles', targetUserId));
      }
    } catch {}

    // Record audit event
    try {
      await recordAdminAuditLog({
        action: 'assign_role',
        targetType: 'student',
        targetId: targetUserId,
        details: `تعيين الرتبة والوظيفة للطالب "${targetName}" إلى: ${roleTitleAr} (${role})`,
      });
    } catch {}
  })().catch(() => {});
}

export async function adjustPointsFromProfile(
  targetUserId: string,
  targetName: string,
  amount: number,
  mode: 'add' | 'deduct',
  reason: string
): Promise<{ previousBalance: number; newBalance: number }> {
  return await adjustStudentPointsWithReason({
    studentId: targetUserId,
    studentName: targetName,
    amount: Math.abs(amount),
    reason: reason || (mode === 'add' ? 'مكافأة إدارية' : 'خصم إداري'),
    mode,
  });
}
