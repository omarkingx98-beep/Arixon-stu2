import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { 
  Exam, 
  Question, 
  ExamAttempt, 
  QuestionReview, 
  SubjectId, 
  UserProfile 
} from '../types';
import { 
  FIRST_EXAM, 
  FIRST_EXAM_ID, 
  FIRST_EXAM_QUESTIONS,
  type QuestionWithKey
} from '../data/firstExamData';
import {
  ARABIC_EXAM,
  ARABIC_EXAM_ID,
  ARABIC_EXAM_QUESTIONS
} from '../data/arabicGrammarExamData';

export { ARABIC_EXAM, ARABIC_EXAM_ID, ARABIC_EXAM_QUESTIONS };

let hasCheckedExamSeeding = false;

/**
 * Ensures the first physics exam and its public questions exist in Firestore.
 * Bundled exam is always available offline and online; synchronizes to Firestore if an admin is present.
 */
export async function seedFirstExamIfMissing(): Promise<void> {
  if (hasCheckedExamSeeding) return;

  try {
    const currentEmail = auth.currentUser?.email?.toLowerCase().trim();
    const isAdmin = currentEmail === 'omarkingx98@gmail.com' || currentEmail === 'omarkingx99@gmail.com' || currentEmail === 'omarking98@gmail.com' || currentEmail === 'omarking99@gmail.com';

    // Seed Physics Exam if missing
    const examDocRef = doc(db, 'exams', FIRST_EXAM_ID);
    const examSnap = await getDoc(examDocRef);

    const needsPhysicsSeeding = !examSnap.exists() || 
      examSnap.data()?.durationMinutes !== 35 || 
      examSnap.data()?.questionCount !== 20;

    if (needsPhysicsSeeding && isAdmin) {
      console.log('[Exam Sync] Admin active, synchronizing Tawjihi 2009 Physics Exam to Firestore...');
      await setDoc(examDocRef, FIRST_EXAM, { merge: true });

      for (const q of FIRST_EXAM_QUESTIONS) {
        const qRef = doc(db, 'exams', FIRST_EXAM_ID, 'questions', q.id);
        const publicQuestionData: Question = {
          id: q.id,
          examId: FIRST_EXAM_ID,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
          source: q.source,
          points: q.points,
          questionType: q.questionType,
          hint: q.hint,
        };
        await setDoc(qRef, publicQuestionData, { merge: true });

        const keyRef = doc(db, 'exams', FIRST_EXAM_ID, 'answerKeys', q.id);
        await setDoc(keyRef, {
          id: q.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
          solutionSteps: q.solutionSteps,
          formulaUsed: q.formulaUsed,
          distractorAnalysis: q.distractorAnalysis,
        }, { merge: true });
      }
    }

    // Seed Arabic Grammar Exam if missing
    const arExamDocRef = doc(db, 'exams', ARABIC_EXAM_ID);
    const arExamSnap = await getDoc(arExamDocRef);

    const needsArabicSeeding = !arExamSnap.exists() ||
      arExamSnap.data()?.durationMinutes !== 25 ||
      arExamSnap.data()?.questionCount !== 20;

    if (needsArabicSeeding && isAdmin) {
      console.log('[Exam Sync] Admin active, synchronizing Tawjihi Arabic Grammar Exam to Firestore...');
      await setDoc(arExamDocRef, ARABIC_EXAM, { merge: true });

      for (const q of ARABIC_EXAM_QUESTIONS) {
        const qRef = doc(db, 'exams', ARABIC_EXAM_ID, 'questions', q.id);
        const publicQuestionData: Question = {
          id: q.id,
          examId: ARABIC_EXAM_ID,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
          source: q.source,
          points: q.points,
          questionType: q.questionType,
          hint: q.hint,
        };
        await setDoc(qRef, publicQuestionData, { merge: true });

        const keyRef = doc(db, 'exams', ARABIC_EXAM_ID, 'answerKeys', q.id);
        await setDoc(keyRef, {
          id: q.id,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          hint: q.hint,
        }, { merge: true });
      }
    }

    hasCheckedExamSeeding = true;
  } catch (error) {
    hasCheckedExamSeeding = true;
    console.log('[Exam Sync] Exams active via local bundled curricula.');
  }
}

/**
 * Fetch all published exams from Firestore, dynamically enriched with the user's attempt status
 */
export async function getExamsList(subjectFilter?: SubjectId, currentUserId?: string): Promise<Exam[]> {
  try {
    // Make sure exams are seeded
    await seedFirstExamIfMissing();

    const examsRef = collection(db, 'exams');
    let q = query(examsRef, where('published', '==', true));

    if (subjectFilter && subjectFilter !== 'all') {
      q = query(examsRef, where('published', '==', true), where('subject', '==', subjectFilter));
    }

    const snapshot = await getDocs(q);
    const exams: Exam[] = [];

    // Also get all user attempts if user is signed in to mark completed/in_progress
    const userAttemptsMap: Record<string, ExamAttempt> = {};
    if (currentUserId) {
      const attemptsRef = collection(db, 'attempts');
      const attemptsQuery = query(attemptsRef, where('userId', '==', currentUserId));
      const attemptsSnap = await getDocs(attemptsQuery);
      attemptsSnap.forEach((d) => {
        const att = d.data() as ExamAttempt;
        userAttemptsMap[att.examId] = att;
      });
    }

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as Exam;
      const examObj: Exam = {
        ...data,
        id: docSnapshot.id,
      };

      if (currentUserId && userAttemptsMap[examObj.id]) {
        const att = userAttemptsMap[examObj.id];
        if (att.status === 'submitted') {
          examObj.userAttemptStatus = 'completed';
          examObj.userLastAttemptId = att.id;
          examObj.userScore = att.score ?? 0;
          if (!examObj.allowRetake) {
            examObj.status = 'completed';
          }
        } else if (att.status === 'in_progress') {
          const isExpired = new Date(att.expectedEndAt).getTime() < Date.now();
          if (!isExpired) {
            examObj.userAttemptStatus = 'in_progress';
            examObj.userLastAttemptId = att.id;
          }
        }
      }

      exams.push(examObj);
    });

    // Helper to attach user attempt to a bundled exam
    const enrichBundledExam = (bundled: Exam): Exam => {
      const copy: Exam = { ...bundled };
      if (currentUserId && userAttemptsMap[bundled.id]) {
        const att = userAttemptsMap[bundled.id];
        if (att.status === 'submitted') {
          copy.userAttemptStatus = 'completed';
          copy.userLastAttemptId = att.id;
          copy.userScore = att.score ?? 0;
          if (!copy.allowRetake) {
            copy.status = 'completed';
          }
        } else if (att.status === 'in_progress') {
          const isExpired = new Date(att.expectedEndAt).getTime() < Date.now();
          if (!isExpired) {
            copy.userAttemptStatus = 'in_progress';
            copy.userLastAttemptId = att.id;
          }
        }
      }
      return copy;
    };

    // Ensure ARABIC_EXAM is always available if matching filter
    const hasArabicExam = exams.some((e) => e.id === ARABIC_EXAM_ID);
    if (!hasArabicExam && (!subjectFilter || subjectFilter === 'all' || subjectFilter === 'arabic')) {
      exams.unshift(enrichBundledExam(ARABIC_EXAM));
    }

    // Ensure FIRST_EXAM is always available if matching filter
    const hasFirstExam = exams.some((e) => e.id === FIRST_EXAM_ID);
    if (!hasFirstExam && (!subjectFilter || subjectFilter === 'all' || subjectFilter === 'physics')) {
      exams.push(enrichBundledExam(FIRST_EXAM));
    }

    // Sort by createdAt descending
    exams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return exams;
  } catch (error) {
    console.error('Error in getExamsList:', error);
    const fallbacks: Exam[] = [];
    if (!subjectFilter || subjectFilter === 'all' || subjectFilter === 'arabic') {
      fallbacks.push({ ...ARABIC_EXAM });
    }
    if (!subjectFilter || subjectFilter === 'all' || subjectFilter === 'physics') {
      fallbacks.push({ ...FIRST_EXAM });
    }
    return fallbacks;
  }
}

/**
 * Fetch a single exam details
 */
export async function getExamById(examId: string): Promise<Exam | null> {
  if (examId === ARABIC_EXAM_ID) {
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        return { id: examDoc.id, ...(examDoc.data() as Omit<Exam, 'id'>) };
      }
    } catch {}
    return { ...ARABIC_EXAM };
  }
  if (examId === FIRST_EXAM_ID) {
    try {
      const examDoc = await getDoc(doc(db, 'exams', examId));
      if (examDoc.exists()) {
        return { id: examDoc.id, ...(examDoc.data() as Omit<Exam, 'id'>) };
      }
    } catch {}
    return { ...FIRST_EXAM };
  }
  try {
    const examDoc = await getDoc(doc(db, 'exams', examId));
    if (examDoc.exists()) {
      return { id: examDoc.id, ...(examDoc.data() as Omit<Exam, 'id'>) };
    }
    return null;
  } catch (error) {
    console.error('Error fetching exam by ID:', error);
    return null;
  }
}

/**
 * Fetch questions for an exam without exposing correct answers or explanations
 */
export async function getExamQuestions(examId: string): Promise<Question[]> {
  try {
    const qCol = collection(db, 'exams', examId, 'questions');
    const snap = await getDocs(query(qCol, orderBy('order', 'asc')));
    const questions: Question[] = [];

    snap.forEach((d) => {
      const data = d.data() as Question;
      questions.push({
        id: d.id,
        examId,
        questionText: data.questionText,
        options: data.options,
        difficulty: data.difficulty,
        source: data.source,
        points: data.points,
        order: data.order,
        questionType: data.questionType,
        media: data.media,
        hint: data.hint,
      });
    });

    if (questions.length === 0) {
      if (examId === ARABIC_EXAM_ID) {
        return ARABIC_EXAM_QUESTIONS.map(q => ({
          id: q.id,
          examId: ARABIC_EXAM_ID,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
          source: q.source,
          points: q.points,
          order: q.order,
          questionType: q.questionType,
          hint: q.hint,
        }));
      }
      if (examId === FIRST_EXAM_ID) {
        return FIRST_EXAM_QUESTIONS.map(q => ({
          id: q.id,
          examId: FIRST_EXAM_ID,
          questionText: q.questionText,
          options: q.options,
          difficulty: q.difficulty,
          source: q.source,
          points: q.points,
          order: q.order,
          questionType: q.questionType,
          hint: q.hint,
        }));
      }
    }

    return questions;
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    if (examId === ARABIC_EXAM_ID) {
      return ARABIC_EXAM_QUESTIONS.map(q => ({
        id: q.id,
        examId: ARABIC_EXAM_ID,
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
        source: q.source,
        points: q.points,
        order: q.order,
        questionType: q.questionType,
        hint: q.hint,
      }));
    }
    if (examId === FIRST_EXAM_ID) {
      return FIRST_EXAM_QUESTIONS.map(q => ({
        id: q.id,
        examId: FIRST_EXAM_ID,
        questionText: q.questionText,
        options: q.options,
        difficulty: q.difficulty,
        source: q.source,
        points: q.points,
        order: q.order,
        questionType: q.questionType,
        hint: q.hint,
      }));
    }
    return [];
  }
}

/**
 * Start or resume an exam attempt for a user
 */
export async function startOrResumeAttempt(
  examId: string, 
  userId: string, 
  userDisplayName?: string
): Promise<{ attempt: ExamAttempt; questions: Question[]; isResumed: boolean }> {
  const exam = await getExamById(examId);
  if (!exam) {
    throw new Error('الامتحان غير موجود.');
  }

  // 1. Check for existing attempts for this user and exam
  const attemptsRef = collection(db, 'attempts');
  const q = query(
    attemptsRef, 
    where('userId', '==', userId), 
    where('examId', '==', examId)
  );
  const snap = await getDocs(q);

  let inProgressAttempt: ExamAttempt | null = null;
  let completedAttempt: ExamAttempt | null = null;

  snap.forEach((d) => {
    const data = d.data() as ExamAttempt;
    if (data.status === 'in_progress') {
      inProgressAttempt = { ...data, id: d.id };
    } else if (data.status === 'submitted') {
      completedAttempt = { ...data, id: d.id };
    }
  });

  // If retake is not allowed and exam is completed
  if (completedAttempt && !exam.allowRetake) {
    const questions = await getExamQuestions(examId);
    return { attempt: completedAttempt, questions, isResumed: true };
  }

  // If there is an active in_progress attempt, check whether time has expired
  if (inProgressAttempt) {
    const inProg = inProgressAttempt as ExamAttempt;
    const now = Date.now();
    const end = new Date(inProg.expectedEndAt).getTime();
    if (now < end) {
      const questions = await getExamQuestions(examId);
      return { attempt: inProg, questions, isResumed: true };
    }
  }

  // Otherwise, create a new attempt
  const startedAt = new Date();
  const durationMs = (exam.durationMinutes || 20) * 60 * 1000;
  const expectedEndAt = new Date(startedAt.getTime() + durationMs);

  const attemptId = `att_${userId.slice(0, 8)}_${examId}_${Date.now()}`;
  const newAttempt: ExamAttempt = {
    id: attemptId,
    userId,
    examId,
    examTitle: exam.title,
    examSubject: exam.subjectNameAr || exam.subject,
    lesson: exam.lesson,
    totalPoints: exam.totalPoints,
    startedAt: startedAt.toISOString(),
    expectedEndAt: expectedEndAt.toISOString(),
    submittedAt: null,
    status: 'in_progress',
    score: null,
    pointsEarned: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    unanswered: 0,
    durationSeconds: 0,
    lastSavedAt: startedAt.toISOString(),
  };

  const attemptDocRef = doc(db, 'attempts', attemptId);
  try {
    await setDoc(attemptDocRef, newAttempt);
  } catch (err) {
    console.warn('Could not save attempt to Firestore, saving to local cache:', err);
  }
  try {
    localStorage.setItem(`arixon_attempt_${attemptId}`, JSON.stringify(newAttempt));
  } catch {}

  const questions = await getExamQuestions(examId);
  return { attempt: newAttempt, questions, isResumed: false };
}

/**
 * Save user's selected answer for a question
 */
export async function saveQuestionAnswer(
  attemptId: string, 
  questionId: string, 
  selectedAnswer: number | null
): Promise<void> {
  // Always save in localStorage as instant reliable backup
  try {
    const localAnswersKey = `arixon_attempt_answers_${attemptId}`;
    const existing = JSON.parse(localStorage.getItem(localAnswersKey) || '{}');
    existing[questionId] = selectedAnswer;
    localStorage.setItem(localAnswersKey, JSON.stringify(existing));
  } catch {}

  try {
    const answerRef = doc(db, 'attempts', attemptId, 'answers', questionId);
    const now = new Date().toISOString();
    await setDoc(answerRef, {
      questionId,
      selectedAnswer,
      answeredAt: now,
      updatedAt: now,
    });

    // Touch attempt lastSavedAt
    const attemptRef = doc(db, 'attempts', attemptId);
    await updateDoc(attemptRef, {
      lastSavedAt: now,
    });
  } catch (error) {
    console.warn('Firestore answer save failed (saved locally):', error);
  }
}

/**
 * Fetch all saved answers for an active attempt
 */
export async function getSavedAnswersForAttempt(attemptId: string): Promise<Record<string, number | null>> {
  try {
    const answersCol = collection(db, 'attempts', attemptId, 'answers');
    const snap = await getDocs(answersCol);
    const answers: Record<string, number | null> = {};
    snap.forEach((d) => {
      const data = d.data();
      answers[data.questionId] = data.selectedAnswer;
    });
    if (Object.keys(answers).length > 0) {
      return answers;
    }
  } catch (error) {
    console.warn('Could not fetch saved answers from Firestore, falling back to local storage:', error);
  }

  try {
    const localAnswersKey = `arixon_attempt_answers_${attemptId}`;
    const raw = localStorage.getItem(localAnswersKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

/**
 * Get an attempt by ID
 */
export async function getAttemptById(attemptId: string, userId: string): Promise<ExamAttempt | null> {
  try {
    const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
    if (attemptDoc.exists()) {
      const data = attemptDoc.data() as ExamAttempt;
      if (data.userId === userId) {
        return { ...data, id: attemptDoc.id };
      }
    }
  } catch {}

  try {
    const raw = localStorage.getItem(`arixon_attempt_${attemptId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ExamAttempt;
      if (parsed.userId === userId) return parsed;
    }
  } catch {}
  return null;
}

/**
 * Fetch student's completed exam attempts history
 */
export async function getUserExamHistory(userId: string): Promise<ExamAttempt[]> {
  try {
    const attemptsRef = collection(db, 'attempts');
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      where('status', '==', 'submitted')
    );
    const snap = await getDocs(q);
    const history: ExamAttempt[] = [];
    snap.forEach((d) => {
      history.push({ ...(d.data() as ExamAttempt), id: d.id });
    });
    history.sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime());
    return history;
  } catch (error) {
    console.error('Error fetching exam history:', error);
    return [];
  }
}

/**
 * Submit and Grade Exam with server-time validation, scoring, and atomic profile points update
 */
export async function submitExamAttempt(
  attemptId: string, 
  userId: string,
  answersOverride?: Record<string, number | null>
): Promise<ExamAttempt> {
  // 1. Fetch attempt
  let attempt: ExamAttempt | null = null;
  const attemptDocRef = doc(db, 'attempts', attemptId);
  try {
    const attemptSnap = await getDoc(attemptDocRef);
    if (attemptSnap.exists()) {
      attempt = { ...(attemptSnap.data() as ExamAttempt), id: attemptSnap.id };
    }
  } catch {}

  if (!attempt) {
    try {
      const raw = localStorage.getItem(`arixon_attempt_${attemptId}`);
      if (raw) {
        attempt = JSON.parse(raw) as ExamAttempt;
      }
    } catch {}
  }

  if (!attempt) {
    throw new Error('محاولة الامتحان غير موجودة.');
  }

  if (attempt.userId !== userId) {
    throw new Error('لا تملك صلاحية تسليم هذا الامتحان.');
  }

  // Idempotency: if already submitted, return it
  if (attempt.status === 'submitted') {
    return { ...attempt, id: attemptId };
  }

  // 2. Fetch questions with answer keys
  let questionsWithKeys: QuestionWithKey[] = [];
  if (attempt.examId === ARABIC_EXAM_ID) {
    questionsWithKeys = ARABIC_EXAM_QUESTIONS;
  } else if (attempt.examId === FIRST_EXAM_ID) {
    questionsWithKeys = FIRST_EXAM_QUESTIONS;
  } else {
    // For other exams, fetch questions and their keys
    try {
      const qCol = collection(db, 'exams', attempt.examId, 'questions');
      const qSnap = await getDocs(query(qCol, orderBy('order', 'asc')));
      for (const d of qSnap.docs) {
        const qData = d.data() as Question;
        const keyDoc = await getDoc(doc(db, 'exams', attempt.examId, 'answerKeys', d.id));
        const keyData = keyDoc.exists() ? keyDoc.data() : { correctAnswer: 0, explanation: '' };
        questionsWithKeys.push({
          ...qData,
          id: d.id,
          correctAnswer: keyData.correctAnswer ?? 0,
          explanation: keyData.explanation ?? '',
          distractorAnalysis: (keyData as any).distractorAnalysis || qData.distractorAnalysis || undefined,
        });
      }
    } catch {
      questionsWithKeys = attempt.examId === ARABIC_EXAM_ID ? ARABIC_EXAM_QUESTIONS : FIRST_EXAM_QUESTIONS;
    }
  }

  // 3. Load student answers
  const savedAnswers = answersOverride || await getSavedAnswersForAttempt(attemptId);

  // 4. Calculate score & breakdown
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let pointsEarned = 0;
  const reviews: QuestionReview[] = [];

  for (const q of questionsWithKeys) {
    const studentAns = savedAnswers[q.id] !== undefined ? savedAnswers[q.id] : null;
    const isUnanswered = studentAns === null;
    const isCorrect = !isUnanswered && studentAns === q.correctAnswer;

    if (isCorrect) {
      correctCount++;
      pointsEarned += q.points;
    } else if (isUnanswered) {
      unansweredCount++;
    } else {
      wrongCount++;
    }

    reviews.push({
      questionId: q.id,
      questionNumber: q.order,
      questionText: q.questionText,
      options: q.options,
      studentAnswer: studentAns,
      correctAnswer: q.correctAnswer,
      isCorrect,
      isUnanswered,
      explanation: q.explanation,
      hint: q.hint,
      solutionSteps: q.solutionSteps,
      formulaUsed: q.formulaUsed,
      distractorAnalysis: q.distractorAnalysis || undefined,
      points: q.points,
      pointsEarned: isCorrect ? q.points : 0,
      source: q.source,
    });
  }

  const now = new Date();
  const startTime = new Date(attempt.startedAt).getTime();
  const durationSeconds = Math.max(0, Math.floor((now.getTime() - startTime) / 1000));
  const totalExamPoints = attempt.totalPoints || 100;
  const finalScore = Math.round((pointsEarned / totalExamPoints) * 100);

  const submittedAttempt: ExamAttempt = {
    ...attempt,
    id: attemptId,
    status: 'submitted',
    submittedAt: now.toISOString(),
    score: finalScore,
    pointsEarned,
    correctAnswers: correctCount,
    wrongAnswers: wrongCount,
    unanswered: unansweredCount,
    durationSeconds,
    lastSavedAt: now.toISOString(),
  };

  // 5. Save submitted attempt with reviews to Firestore and local cache
  try {
    await updateDoc(attemptDocRef, {
      status: 'submitted',
      submittedAt: now.toISOString(),
      score: finalScore,
      pointsEarned,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      unanswered: unansweredCount,
      durationSeconds,
      lastSavedAt: now.toISOString(),
      reviews,
    });
  } catch (err) {
    console.warn('Could not update Firestore attempt status (saved locally):', err);
  }

  try {
    localStorage.setItem(`arixon_attempt_${attemptId}`, JSON.stringify({ ...submittedAttempt, reviews }));
  } catch {}

  // 6. Update user's profile statistics in Firestore & local cache
  try {
    const userDocRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
      const uSnap = await transaction.get(userDocRef);
      if (uSnap.exists()) {
        const uData = uSnap.data() as UserProfile;
        transaction.update(userDocRef, {
          totalPoints: (uData.totalPoints || 0) + pointsEarned,
          weeklyPoints: (uData.weeklyPoints || 0) + pointsEarned,
          monthlyPoints: (uData.monthlyPoints || 0) + pointsEarned,
          examsCompleted: (uData.examsCompleted || 0) + 1,
          correctAnswers: (uData.correctAnswers || 0) + correctCount,
          wrongAnswers: (uData.wrongAnswers || 0) + wrongCount,
          lastActiveAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    });
  } catch (transErr) {
    console.warn('Error updating user stats in Firestore:', transErr);
  }

  // Also update locally cached profile
  try {
    const cacheKey = `arixon_cached_profile_${userId}`;
    const rawProfile = localStorage.getItem(cacheKey);
    if (rawProfile) {
      const uData = JSON.parse(rawProfile);
      uData.totalPoints = (uData.totalPoints || 0) + pointsEarned;
      uData.weeklyPoints = (uData.weeklyPoints || 0) + pointsEarned;
      uData.monthlyPoints = (uData.monthlyPoints || 0) + pointsEarned;
      uData.examsCompleted = (uData.examsCompleted || 0) + 1;
      uData.correctAnswers = (uData.correctAnswers || 0) + correctCount;
      uData.wrongAnswers = (uData.wrongAnswers || 0) + wrongCount;
      uData.lastActiveAt = now.toISOString();
      uData.updatedAt = now.toISOString();
      localStorage.setItem(cacheKey, JSON.stringify(uData));
    }
  } catch {}

  return { ...submittedAttempt, reviews } as ExamAttempt & { reviews: QuestionReview[] };
}

/**
 * Fetch reviews for an attempt
 */
export async function getAttemptReviews(attemptId: string, userId: string): Promise<QuestionReview[]> {
  try {
    const attemptDoc = await getDoc(doc(db, 'attempts', attemptId));
    if (!attemptDoc.exists()) return [];
    const data = attemptDoc.data();
    if (data.userId !== userId) {
      throw new Error('غير مصرح بالوصول لمراجعة هذا الامتحان.');
    }
    return (data.reviews as QuestionReview[]) || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}
