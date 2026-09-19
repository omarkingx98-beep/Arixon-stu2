export type ThemeMode = 'light' | 'dark';
export type Language = 'ar' | 'en';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  age?: number;
  city?: string;
  branch?: string;
  school?: string;
  tawjihiYear?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  whatsappGroup?: string;
  accountDisabled?: boolean;
  disabledReason?: string;
  disabledAt?: string;
  disabledBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  role?: string; // 'owner' | 'super_admin' | 'admin' | custom role id | 'student'
  customPermissions?: string[];
  totalPoints: number; // Competition points
  competitionPoints?: number;
  weeklyPoints: number;
  monthlyPoints: number;
  spendablePoints?: number; // Store currency (Phase 5 ready)
  equippedFrameId?: string;
  equippedNameEffectId?: string;
  equippedTitleId?: string;
  equippedThemeId?: string;
  featuredBadgeIds?: string[];
  examsCompleted: number;
  correctAnswers: number;
  wrongAnswers: number;
  hasSeenTutorial?: boolean;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export type SubjectId = 
  | 'all' 
  | 'math' 
  | 'physics' 
  | 'arabic' 
  | 'chemistry' 
  | 'biology' 
  | 'english' 
  | 'islamic' 
  | 'history' 
  | 'geography' 
  | 'computer' 
  | 'financial' 
  | 'social' 
  | 'other';

export type ExamStatus = 'available' | 'coming_soon' | 'closed' | 'completed';

export interface Exam {
  id: string;
  title: string;
  subject: SubjectId;
  subjectNameAr: string;
  lesson: string;
  description: string;
  questionCount: number;
  durationMinutes: number;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: ExamStatus;
  published: boolean;
  allowRetake: boolean;
  allowedStoreItems?: string[]; // Phase 5: Allowed exam assistance item IDs
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  // Optional client enrichment
  userAttemptStatus?: 'not_started' | 'in_progress' | 'completed';
  userLastAttemptId?: string;
  userScore?: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'matching';

export interface Question {
  id: string;
  examId?: string;
  questionText: string;
  options: string[];
  correctAnswer?: number; // Only exposed after submission or on server
  explanation?: string; // Only exposed after submission or on server
  hint?: string; // Educational hint to guide student without revealing answer
  solutionSteps?: string[]; // Step-by-step pedagogical solution
  formulaUsed?: string; // Formula or law applied
  distractorAnalysis?: Record<string, string>; // Analysis of traps/distractors for wrong options
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  points: number;
  order: number;
  questionType: QuestionType;
  media?: string;
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  startedAt: string;
  expectedEndAt: string;
  submittedAt: string | null;
  status: AttemptStatus;
  score: number | null;
  pointsEarned: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  durationSeconds: number;
  lastSavedAt: string;
  // Metadata for easy display in history
  examTitle?: string;
  examSubject?: string;
  lesson?: string;
  totalPoints?: number;
  percentage?: number;
  userDisplayName?: string;
}

export interface QuestionAnswer {
  questionId: string;
  selectedAnswer: number | string | null;
  answeredAt: string;
  updatedAt: string;
}

export interface QuestionReview {
  questionId: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  studentAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  isUnanswered: boolean;
  explanation: string;
  hint?: string;
  solutionSteps?: string[];
  formulaUsed?: string;
  distractorAnalysis?: Record<string, string>;
  points: number;
  pointsEarned: number;
  source: string;
}

export interface LeaderboardEntry {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  points: number;
  rank: number;
  isCurrentUser?: boolean;
  equippedFrameId?: string;
  equippedNameEffectId?: string;
  equippedTitleId?: string;
  equippedThemeId?: string;
  featuredBadgeIds?: string[];
}

export type NavigationTab = 'home' | 'exams' | 'store' | 'leaderboard' | 'profile';

export * from './store';
export * from './economy';

// ==========================================
// Phase 3: Admin & Security Models
// ==========================================

export type AdminRole = 'owner' | 'super_admin' | 'admin' | 'editor' | string;

export interface RoleDefinition {
  id: string;
  nameAr: string;
  nameEn: string;
  description: string;
  isSystem: boolean; // cannot be deleted
  badgeColor: string;
  permissions: string[];
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type PermissionId =
  | 'users.view'
  | 'users.edit'
  | 'users.freeze'
  | 'users.unfreeze'
  | 'users.delete'
  | 'users.restore'
  | 'users.view_private_data'
  | 'roles.view'
  | 'roles.create'
  | 'roles.edit'
  | 'roles.assign'
  | 'roles.delete'
  | 'exams.view'
  | 'exams.create'
  | 'exams.edit'
  | 'exams.delete'
  | 'exams.publish'
  | 'exams.unpublish'
  | 'exams.grade'
  | 'exams.answer_keys'
  | 'ai.exams.generate'
  | 'ai.exams.regenerate'
  | 'points.view'
  | 'points.add'
  | 'points.subtract'
  | 'points.adjust'
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.edit'
  | 'announcements.delete'
  | 'announcements.publish'
  | 'challenges.view'
  | 'challenges.create'
  | 'challenges.edit'
  | 'challenges.delete'
  | 'challenges.publish'
  | 'notifications.view'
  | 'notifications.create'
  | 'notifications.send'
  | 'reports.view'
  | 'reports.manage'
  | 'auditLogs.view';

export const ALL_SYSTEM_PERMISSIONS: { id: PermissionId; categoryAr: string; nameAr: string }[] = [
  { id: 'users.view', categoryAr: 'المستخدمين', nameAr: 'عرض قائمة وسجلات المستخدمين' },
  { id: 'users.edit', categoryAr: 'المستخدمين', nameAr: 'تعديل بيانات المستخدمين' },
  { id: 'users.freeze', categoryAr: 'المستخدمين', nameAr: 'تجميد حسابات الطلاب' },
  { id: 'users.unfreeze', categoryAr: 'المستخدمين', nameAr: 'إلغاء تجميد الحسابات' },
  { id: 'users.delete', categoryAr: 'المستخدمين', nameAr: 'حذف وتعطيل الحسابات' },
  { id: 'users.restore', categoryAr: 'المستخدمين', nameAr: 'استعادة الحسابات المعطلة' },
  { id: 'users.view_private_data', categoryAr: 'المستخدمين', nameAr: 'عرض البيانات الحساسة (الهاتف والملاحظات)' },
  { id: 'roles.view', categoryAr: 'الأدوار والصلاحيات', nameAr: 'عرض مصفوفة الأدوار' },
  { id: 'roles.create', categoryAr: 'الأدوار والصلاحيات', nameAr: 'إنشاء أدوار مخصصة' },
  { id: 'roles.edit', categoryAr: 'الأدوار والصلاحيات', nameAr: 'تعديل الصلاحيات والأدوار' },
  { id: 'roles.assign', categoryAr: 'الأدوار والصلاحيات', nameAr: 'تعيين الأدوار للمستخدمين' },
  { id: 'roles.delete', categoryAr: 'الأدوار والصلاحيات', nameAr: 'حذف الأدوار المخصصة' },
  { id: 'exams.view', categoryAr: 'الامتحانات', nameAr: 'عرض الامتحانات والمسودات' },
  { id: 'exams.create', categoryAr: 'الامتحانات', nameAr: 'إنشاء امتحانات يدوية' },
  { id: 'exams.edit', categoryAr: 'الامتحانات', nameAr: 'تعديل وتحديث الامتحانات' },
  { id: 'exams.delete', categoryAr: 'الامتحانات', nameAr: 'أرشفة وحذف الامتحانات' },
  { id: 'exams.publish', categoryAr: 'الامتحانات', nameAr: 'نشر الامتحانات للطلاب' },
  { id: 'exams.unpublish', categoryAr: 'الامتحانات', nameAr: 'إلغاء نشر الامتحانات وتحويلها لمسودة' },
  { id: 'exams.grade', categoryAr: 'الامتحانات', nameAr: 'مراجعة وتصحيح محاولات الطلاب' },
  { id: 'exams.answer_keys', categoryAr: 'الامتحانات', nameAr: 'الاطلاع على مفاتيح الإجابات والشروحات' },
  { id: 'ai.exams.generate', categoryAr: 'الذكاء الاصطناعي', nameAr: 'توليد أسئلة بالذكاء الاصطناعي' },
  { id: 'ai.exams.regenerate', categoryAr: 'الذكاء الاصطناعي', nameAr: 'إعادة توليد وتعديل أسئلة محددة' },
  { id: 'points.view', categoryAr: 'النقاط والرصيد', nameAr: 'عرض أرصدة ومعاملات النقاط' },
  { id: 'points.add', categoryAr: 'النقاط والرصيد', nameAr: 'إضافة نقاط لحسابات الطلاب' },
  { id: 'points.subtract', categoryAr: 'النقاط والرصيد', nameAr: 'خصم وسحب النقاط' },
  { id: 'points.adjust', categoryAr: 'النقاط والرصيد', nameAr: 'تصفير وتعديل الرصيد التنافسي والمتجر' },
  { id: 'announcements.view', categoryAr: 'الإعلانات', nameAr: 'عرض سجل الإعلانات' },
  { id: 'announcements.create', categoryAr: 'الإعلانات', nameAr: 'إنشاء إعلانات جديدة' },
  { id: 'announcements.edit', categoryAr: 'الإعلانات', nameAr: 'تعديل الإعلانات' },
  { id: 'announcements.delete', categoryAr: 'الإعلانات', nameAr: 'حذف وأرشفة الإعلانات' },
  { id: 'announcements.publish', categoryAr: 'الإعلانات', nameAr: 'نشر وإلغاء نشر الإعلانات' },
  { id: 'challenges.view', categoryAr: 'التحديات', nameAr: 'عرض التحديات والمسابقات' },
  { id: 'challenges.create', categoryAr: 'التحديات', nameAr: 'إنشاء تحديات تنافسية' },
  { id: 'challenges.edit', categoryAr: 'التحديات', nameAr: 'تعديل التحديات' },
  { id: 'challenges.delete', categoryAr: 'التحديات', nameAr: 'حذف وأرشفة التحديات' },
  { id: 'challenges.publish', categoryAr: 'التحديات', nameAr: 'نشر وإطلاق التحديات' },
  { id: 'notifications.view', categoryAr: 'الإشعارات', nameAr: 'عرض سجل الإشعارات' },
  { id: 'notifications.create', categoryAr: 'الإشعارات', nameAr: 'إنشاء إشعارات فورية' },
  { id: 'notifications.send', categoryAr: 'الإشعارات', nameAr: 'إرسال إشعارات لجميع الطلاب أو فئات محددة' },
  { id: 'reports.view', categoryAr: 'البلاغات والرقابة', nameAr: 'عرض بلاغات المستخدمين والرسائل' },
  { id: 'reports.manage', categoryAr: 'البلاغات والرقابة', nameAr: 'معالجة واتخاذ إجراءات البلاغات' },
  { id: 'auditLogs.view', categoryAr: 'سجل العمليات', nameAr: 'الاطلاع على سجل تدقيق عمليات المشرفين' },
];

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
}

export type AdminAuditAction = 
  | 'create_exam'
  | 'edit_exam'
  | 'publish_exam'
  | 'unpublish_exam'
  | 'archive_exam'
  | 'delete_exam'
  | 'add_question'
  | 'edit_question'
  | 'archive_question'
  | 'delete_question'
  | 'import_questions'
  | 'export_data'
  | 'disable_student'
  | 'enable_student'
  | 'delete_student'
  | 'restore_student'
  | 'role_create'
  | 'role_edit'
  | 'role_delete'
  | 'assign_role'
  | 'send_notification'
  | 'resolve_report'
  | 'point_adjustment'
  | 'publish_announcement'
  | 'unpublish_announcement'
  | 'archive_announcement'
  | 'publish_challenge'
  | 'edit_challenge'
  | 'ai_generation'
  | 'ai_approval'
  | 'save_approved_questions'
  | 'create_template'
  | 'settings_change'
  | 'admin_bootstrap'
  | 'permission_failure';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: AdminAuditAction;
  targetType: 'exam' | 'question' | 'student' | 'announcement' | 'challenge' | 'settings' | 'security' | 'template';
  targetId: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface QuestionBankItem {
  id: string;
  questionText: string;
  subject: SubjectId;
  subjectNameAr: string;
  lesson: string;
  topic?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  distractorAnalysis?: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  source: string;
  points: number;
  questionType: QuestionType;
  media?: string;
  status: 'active' | 'draft' | 'archived' | 'approved';
  tags?: string[];
  isAiGenerated?: boolean;
  approved?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  priority: 'low' | 'medium' | 'high';
  published: boolean;
  scheduledAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  createdBy: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  subject: SubjectId;
  startAt: string;
  endAt: string;
  points: number;
  examIds: string[];
  requirements?: string;
  status: 'upcoming' | 'active' | 'ended' | 'archived';
  createdBy: string;
  createdAt: string;
}

export interface PointAdjustmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  reason: string;
  adminId: string;
  adminName: string;
  previousBalance: number;
  newBalance: number;
  createdAt: string;
}

export interface AdminSettings {
  siteName: string;
  logoUrl?: string;
  defaultDurationMinutes: number;
  defaultExamDurationMinutes?: number;
  defaultPointsPerQuestion?: number;
  leaderboardRefreshMinutes?: number;
  allowRetakesDefault?: boolean;
  systemNotice?: string;
  defaultTotalPoints: number;
  leaderboardVisible: boolean;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  announcementsEnabled: boolean;
  challengesEnabled: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  studentName?: string;
  type: 'add' | 'subtract' | 'reset' | 'exam_reward' | 'challenge_reward' | 'manual_correction' | 'system_reward';
  amount: number;
  currency: 'competition' | 'spendable';
  previousBalance: number;
  newBalance: number;
  source: string;
  reason: string;
  createdBy: string;
  adminEmail?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export type NotificationCategory = 'exams' | 'challenges' | 'announcements' | 'friends' | 'system';

export interface AppNotification {
  id: string;
  userId: string; // 'all' or specific student UID
  title: string;
  body: string;
  category: NotificationCategory;
  read: boolean;
  targetUrl?: string;
  relatedId?: string;
  createdAt: string;
  readAt?: string | null;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'rejected';

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  users?: [string, string] | string[];
  senderId: string;
  receiverId?: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt?: string;
  user1Profile?: { displayName: string; username: string; photoURL?: string };
  user2Profile?: { displayName: string; username: string; photoURL?: string };
}

export interface ChatParticipantInfo {
  uid: string;
  displayName: string;
  username: string;
  photoURL?: string;
  role?: string;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  participantData?: Record<string, ChatParticipantInfo>;
  participantProfiles?: Record<string, { displayName: string; username: string; photoURL?: string }>;
  lastMessage?: string;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastSenderId?: string;
  lastMessageTimestamp?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  unreadCounts?: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  createdAt: string;
  readBy?: string[];
}

export interface UserBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: 'user' | 'message';
  targetId: string;
  targetName?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type AdminTab = 
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'exams'
  | 'questions'
  | 'students'
  | 'leaderboard'
  | 'announcements'
  | 'challenges'
  | 'notifications'
  | 'reports'
  | 'analytics'
  | 'ai-builder'
  | 'audit-logs'
  | 'settings'
  | 'profile'
  | 'store';

// ==========================================
// PHASE 4: AI Exam Builder & Validation Types
// ==========================================

export type GenerationMode = 
  | 'from_scratch'
  | 'raw_exam_prompt'
  | 'image_upload'
  | 'source_based' 
  | 'curriculum_based' 
  | 'question_bank_based';

export type AiGenerationStatus = 
  | 'generated' 
  | 'validated' 
  | 'needs_review' 
  | 'approved' 
  | 'rejected' 
  | 'regenerated';

export interface CalculationVerification {
  expression: string;
  variables: Record<string, number | string>;
  expectedResult: number | string;
  unit?: string;
  formula?: string;
  evaluatedResult?: number | string;
  verified: boolean;
  verificationError?: string;
}

export interface SecondPassReview {
  status: 'PASS' | 'FAIL';
  confidence: number;
  reason: string;
  detectedIssues: string[];
  reviewedAt: string;
}

export interface QuestionQualityScores {
  contentAccuracy: number;
  structureScore: number;
  answerConsistency: number;
  calculationScore: number;
  difficultyFit: number;
  sourceGrounding: number;
  duplicateScore: number;
  overallScore: number; // 0 - 100
}

export interface AiGeneratedQuestionDraft {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint?: string;
  solutionSteps?: string[];
  formulaUsed?: string;
  distractorAnalysis?: Record<string, string>;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple_choice' | 'true_false';
  suggestedPoints: number;
  points?: number;
  subject: SubjectId;
  subjectNameAr: string;
  lesson: string;
  topic?: string;
  grade?: string;

  // Source Grounding
  sourceMode: GenerationMode;
  sourceId?: string;
  sourceSection?: string;
  sourceQuoteOrReference?: string;

  // Deterministic Math/Physics Calculation
  calculation?: CalculationVerification;
  calculationStatus?: 'VERIFIED' | 'FAILED_VERIFICATION' | 'NOT_APPLICABLE';

  // Stage 2 Review
  secondPassReview?: SecondPassReview;

  // Quality scoring
  qualityScores: QuestionQualityScores;

  // Status & Validation
  generationStatus: AiGenerationStatus;
  validationErrors: string[];
  validationWarnings: string[];
  isDuplicate: boolean;
  duplicateMatchDetails?: string;

  generatedByAI: true;
  createdAt: string;
  updatedAt: string;
}

export interface SourceSectionChunk {
  index: number;
  title: string;
  content: string;
  charCount: number;
  wordCount: number;
  detectedConcepts: string[];
}

export interface SourceIngestionReport {
  sourceId: string;
  sourceType: 'pasted_text' | 'notes' | 'lesson_content' | 'uploaded_doc' | 'question_bank' | 'structured_json';
  rawLength: number;
  wordCount: number;
  normalizedWordCount?: number;
  detectedSubject?: string;
  detectedLesson?: string;
  detectedConcepts: string[];
  detectedFormulas?: string[];
  chunks: SourceSectionChunk[];
  warnings: string[];
  isUsable: boolean;
  unusableReason?: string;
}

export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AiGenerationJob {
  jobId: string;
  adminId: string;
  sourceId?: string;
  generationMode: GenerationMode;
  mode?: string;
  generatedQuestions?: AiGeneratedQuestionDraft[];
  subject: string;
  lesson: string;
  topic?: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  status: AiJobStatus;
  createdAt: string;
  completedAt?: string;
  approvedCount: number;
  rejectedCount: number;
  failedCount: number;
  modelUsed: string;
  errorMessage?: string;
  generationSummary?: {
    total: number;
    valid: number;
    needsReview: number;
    failed: number;
    duplicates: number;
  };
}

export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  subject: SubjectId;
  questionCount: number;
  durationMinutes: number;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  allowRetake: boolean;
}

export type IngestedSourceMaterial = SourceIngestionReport;
