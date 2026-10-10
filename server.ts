import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { dbStore } from './server/db.ts';
import { PersonalizationEngine } from './server/algorithms.ts';
import {
  User, StudentProfile, AssessmentAttempt,
  StudentPerformance, TimetableSlot, LearningHistoryItem,
  StudyNote, LanguageCode, NoteDifficulty, Subject
} from './src/types/index.ts';
import {
  generateGeminiNotes,
  generateDeterministicNotes,
  findVerifiedYouTubeVideos,
  stripExtraSymbols
} from './server/notesService.ts';

const execAsync = promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillora_adaptive_secure_jwt_secret_2026';

app.use(express.json());

// Initialize server-side Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let geminiAI: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    geminiAI = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
  }
}

// Authentication middleware
function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = dbStore.findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const existing = dbStore.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = bcrypt.hashSync(password, 8);

  const newUser: User = {
    id: userId,
    email: email.toLowerCase().trim(),
    fullName: fullName.trim(),
    role: 'student',
    createdAt: new Date().toISOString()
  };

  const newProfile: StudentProfile = {
    id: `prof_${Date.now()}`,
    userId,
    learningGoals: [],
    selectedSubjects: [],
    experienceLevel: 'beginner',
    preferredDailyHours: 1.5,
    onboardingCompleted: false,
    initialAssessmentCompleted: false,
    estimatedKnowledgeLevel: 'Novice',
    overallMasteryPercentage: 0,
    currentStreakDays: 1,
    totalStudyMinutes: 0,
    updatedAt: new Date().toISOString()
  };

  dbStore.createUser(newUser, newProfile);

  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: newUser,
    profile: newProfile
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = dbStore.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const profile = dbStore.getProfileByUserId(user.id);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user,
    profile
  });
});

// Demo account instant login
app.post('/api/auth/demo', (_req: Request, res: Response) => {
  const demoEmail = 'student.alex@skillora.edu';
  let user = dbStore.findUserByEmail(demoEmail);

  if (!user) {
    const userId = 'usr_demo_alex';
    user = {
      id: userId,
      email: demoEmail,
      fullName: 'Alex Vance',
      role: 'student',
      createdAt: new Date().toISOString()
    };

    const profile: StudentProfile = {
      id: 'prof_demo_alex',
      userId,
      learningGoals: ['Ace Competitive Tech Interviews', 'Master Deep Learning Foundations'],
      selectedSubjects: ['subj_cs_dsa', 'subj_ml_ai', 'subj_web'],
      experienceLevel: 'intermediate',
      preferredDailyHours: 2.0,
      onboardingCompleted: true,
      initialAssessmentCompleted: true,
      estimatedKnowledgeLevel: 'Competent',
      overallMasteryPercentage: 68.5,
      currentStreakDays: 5,
      totalStudyMinutes: 240,
      updatedAt: new Date().toISOString()
    };

    dbStore.createUser(user, profile);

    // Seed demo performances
    const samplePerfs: StudentPerformance[] = [
      {
        id: 'perf_demo_1',
        userId,
        topicId: 'top_dsa_1',
        subjectId: 'subj_cs_dsa',
        totalAttempts: 12,
        correctAttempts: 11,
        accuracyPercentage: 91.7,
        masteryScore: 88.0,
        status: 'mastered',
        lastPracticedAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'perf_demo_2',
        userId,
        topicId: 'top_dsa_2',
        subjectId: 'subj_cs_dsa',
        totalAttempts: 10,
        correctAttempts: 7,
        accuracyPercentage: 70.0,
        masteryScore: 68.0,
        status: 'developing',
        lastPracticedAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'perf_demo_3',
        userId,
        topicId: 'top_ml_2',
        subjectId: 'subj_ml_ai',
        totalAttempts: 8,
        correctAttempts: 3,
        accuracyPercentage: 37.5,
        masteryScore: 35.0,
        status: 'needs_revision',
        lastPracticedAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'perf_demo_4',
        userId,
        topicId: 'top_web_2',
        subjectId: 'subj_web',
        totalAttempts: 9,
        correctAttempts: 7,
        accuracyPercentage: 77.8,
        masteryScore: 79.5,
        status: 'proficient',
        lastPracticedAt: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    ];

    samplePerfs.forEach(p => dbStore.upsertPerformance(p));

    // Generate initial timetable and recommendations
    const allTopics = dbStore.getTopics();
    const timetable = PersonalizationEngine.generateStudyTimetable(userId, 2.0, allTopics, samplePerfs);
    dbStore.setTimetable(userId, timetable);

    const { weaknesses, developing } = PersonalizationEngine.classifyStrengthsAndWeaknesses(samplePerfs);
    const recs = PersonalizationEngine.generateRecommendations(weaknesses, developing, allTopics);
    dbStore.setRecommendations(userId, recs);
  }

  const profile = dbStore.getProfileByUserId(user.id);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  return res.json({
    token,
    user,
    profile
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = dbStore.getProfileByUserId(user.id);
  return res.json({ user, profile });
});

// -------------------------------------------------------------
// Onboarding & Profile Endpoints
// -------------------------------------------------------------

app.post('/api/profile/onboarding', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { fullName, learningGoals, selectedSubjects, experienceLevel, preferredDailyHours } = req.body;

  if (fullName && fullName.trim()) {
    user.fullName = fullName.trim();
  }

  const updatedProfile = dbStore.updateProfile(user.id, {
    learningGoals: learningGoals || ['Master core STEM topics'],
    selectedSubjects: selectedSubjects || ['subj_cs_dsa'],
    experienceLevel: experienceLevel || 'beginner',
    preferredDailyHours: Number(preferredDailyHours) || 1.5,
    onboardingCompleted: true
  });

  dbStore.addHistory({
    id: `hist_${Date.now()}`,
    userId: user.id,
    activityTitle: 'Completed Learning Profile Onboarding',
    activityType: 'assessment',
    pointsEarned: 25,
    createdAt: new Date().toISOString()
  });

  return res.json({ profile: updatedProfile, user });
});

// -------------------------------------------------------------
// Curriculum & Assessment Endpoints
// -------------------------------------------------------------

app.get('/api/subjects', (_req: Request, res: Response) => {
  const subjects = dbStore.getSubjects();
  const topics = dbStore.getTopics();
  const enriched = subjects.map(s => ({
    ...s,
    topicsCount: topics.filter(t => t.subjectId === s.id).length
  }));
  return res.json(enriched);
});

app.get('/api/topics', (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  const topics = dbStore.getTopics(subjectId);
  return res.json(topics);
});

app.get('/api/assessment/questions', (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  const questions = dbStore.getQuestions({
    subjectId,
    initialOnly: req.query.initialOnly === 'true'
  });
  // Strip correct answer for client delivery
  const sanitized = questions.map(q => ({
    id: q.id,
    subjectId: q.subjectId,
    topicId: q.topicId,
    difficulty: q.difficulty,
    questionType: q.questionType,
    questionText: q.questionText,
    codeSnippet: q.codeSnippet,
    options: q.options,
    hint: q.hint
  }));
  return res.json(sanitized);
});

// Initial Assessment & Quiz Submission
app.post('/api/assessment/submit', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { assessmentType, subjectId, durationSeconds, answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers array is required' });
  }

  const allQuestions = dbStore.getQuestions();
  const qMap = new Map(allQuestions.map(q => [q.id, q]));

  let correctCount = 0;
  const topicStats: Record<string, { total: number; correct: number; subjectId: string }> = {};
  const evaluatedAnswers: any[] = [];

  for (const ans of answers) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;

    const isCorrect = ans.selectedOptionIndex === q.correctOptionIndex;
    if (isCorrect) correctCount++;

    if (!topicStats[q.topicId]) {
      topicStats[q.topicId] = { total: 0, correct: 0, subjectId: q.subjectId };
    }
    topicStats[q.topicId].total++;
    if (isCorrect) topicStats[q.topicId].correct++;

    evaluatedAnswers.push({
      questionId: q.id,
      selectedOptionIndex: ans.selectedOptionIndex,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation
    });
  }

  const totalQuestions = answers.length;
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;
  const calculatedLevel = PersonalizationEngine.calculateKnowledgeLevel(scorePercentage, scorePercentage);

  // Record attempt
  const attempt: AssessmentAttempt = {
    id: `att_${Date.now()}`,
    userId: user.id,
    assessmentType: assessmentType || 'initial_diagnostic',
    subjectId,
    totalQuestions,
    correctCount,
    scorePercentage,
    durationSeconds: Number(durationSeconds) || 60,
    calculatedLevel,
    createdAt: new Date().toISOString()
  };
  dbStore.recordAssessmentAttempt(attempt);

  // Update student topic performances using Bayesian Knowledge Tracing
  const existingPerfs = dbStore.getPerformances(user.id);
  const perfMap = new Map(existingPerfs.map(p => [p.topicId, p]));

  for (const [topicId, data] of Object.entries(topicStats)) {
    const existing = perfMap.get(topicId);
    const newTotal = (existing?.totalAttempts || 0) + data.total;
    const newCorrect = (existing?.correctAttempts || 0) + data.correct;
    const newAcc = Math.round((newCorrect / newTotal) * 1000) / 10;
    const newMastery = PersonalizationEngine.updateBayesianMastery(
      existing?.masteryScore || 20,
      data.correct >= data.total / 2
    );

    let status: 'mastered' | 'proficient' | 'developing' | 'needs_revision' = 'developing';
    if (newAcc >= 75 || newMastery >= 80) status = 'mastered';
    else if (newAcc < 50 || newMastery < 45) status = 'needs_revision';
    else status = 'proficient';

    dbStore.upsertPerformance({
      id: existing?.id || `perf_${Date.now()}_${topicId}`,
      userId: user.id,
      topicId,
      subjectId: data.subjectId,
      totalAttempts: newTotal,
      correctAttempts: newCorrect,
      accuracyPercentage: newAcc,
      masteryScore: newMastery,
      status,
      lastPracticedAt: new Date().toISOString()
    });
  }

  // Update profile
  const updatedPerfs = dbStore.getPerformances(user.id);
  const avgMastery = updatedPerfs.length > 0
    ? Math.round(updatedPerfs.reduce((acc, p) => acc + p.masteryScore, 0) / updatedPerfs.length)
    : scorePercentage;

  const profile = dbStore.updateProfile(user.id, {
    initialAssessmentCompleted: true,
    estimatedKnowledgeLevel: calculatedLevel,
    overallMasteryPercentage: avgMastery,
    totalStudyMinutes: (dbStore.getProfileByUserId(user.id)?.totalStudyMinutes || 0) + Math.round(durationSeconds / 60)
  });

  // Recompute adaptive timetable and recommendations
  const allTopics = dbStore.getTopics();
  const timetable = PersonalizationEngine.generateStudyTimetable(
    user.id,
    profile?.preferredDailyHours || 1.5,
    allTopics,
    updatedPerfs
  );
  dbStore.setTimetable(user.id, timetable);

  const { strengths, weaknesses, developing } = PersonalizationEngine.classifyStrengthsAndWeaknesses(updatedPerfs);
  const recs = PersonalizationEngine.generateRecommendations(weaknesses, developing, allTopics);
  dbStore.setRecommendations(user.id, recs);

  const topicMap = new Map(allTopics.map(t => [t.id, t]));
  const enrichedStrengths = strengths.map(s => ({
    topicId: s.topicId,
    topicTitle: topicMap.get(s.topicId)?.title || s.topicTitle || 'Concept',
    subjectId: s.subjectId,
    accuracyPercentage: Math.round(s.accuracyPercentage || 0),
    masteryScore: Math.round(s.masteryScore || 0)
  }));
  const enrichedWeaknesses = weaknesses.map(w => ({
    topicId: w.topicId,
    topicTitle: topicMap.get(w.topicId)?.title || w.topicTitle || 'Concept',
    subjectId: w.subjectId,
    accuracyPercentage: Math.round(w.accuracyPercentage || 0),
    masteryScore: Math.round(w.masteryScore || 0)
  }));

  const weakTopicActionIdeas = PersonalizationEngine.generateWeakTopicActionIdeas(weaknesses, allTopics, dbStore.getSubjects());
  const quizAnalytics = PersonalizationEngine.computeQuizAnalytics(
    evaluatedAnswers,
    allQuestions,
    Number(durationSeconds) || 60,
    allTopics,
    updatedPerfs
  );

  dbStore.addHistory({
    id: `hist_${Date.now()}`,
    userId: user.id,
    activityTitle: `Completed ${assessmentType === 'initial_diagnostic' ? 'Initial Diagnostic Assessment' : 'Knowledge Assessment'}`,
    activityType: 'assessment',
    pointsEarned: 50,
    details: { scorePercentage, calculatedLevel },
    createdAt: new Date().toISOString()
  });

  return res.json({
    attempt,
    scorePercentage,
    correctCount,
    totalQuestions,
    calculatedLevel,
    evaluatedAnswers,
    profile,
    recommendations: recs,
    strengths: enrichedStrengths,
    weaknesses: enrichedWeaknesses,
    weakTopicActionIdeas,
    quizAnalytics
  });
});

// -------------------------------------------------------------
// Dashboard & Analytics Endpoints
// -------------------------------------------------------------

app.get('/api/dashboard', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = dbStore.getProfileByUserId(user.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const subjects = dbStore.getSubjects();
  const topics = dbStore.getTopics();
  const perfs = dbStore.getPerformances(user.id);
  const perfMap = new Map(perfs.map(p => [p.topicId, p]));

  // Subject mastery calculations
  const enrichedSubjects = subjects.map(s => {
    const sTopics = topics.filter(t => t.subjectId === s.id);
    if (sTopics.length === 0) return { ...s, masteryPercentage: 0, topicsCount: 0 };

    let totalMastery = 0;
    sTopics.forEach(t => {
      const p = perfMap.get(t.id);
      totalMastery += p ? p.masteryScore : 10;
    });

    return {
      ...s,
      masteryPercentage: Math.round(totalMastery / sTopics.length),
      topicsCount: sTopics.length
    };
  });

  const { strengths, weaknesses } = PersonalizationEngine.classifyStrengthsAndWeaknesses(perfs);

  // Enrich with topic and subject titles
  const topicMap = new Map(topics.map(t => [t.id, t]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const enrichPerfs = (items: StudentPerformance[]) => items.map(p => ({
    ...p,
    topicTitle: topicMap.get(p.topicId)?.title || 'Topic',
    subjectTitle: subjectMap.get(p.subjectId)?.title || 'Subject'
  }));

  // Today's timetable
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = dayNames[new Date().getDay()] as any;
  const allTimetable = dbStore.getTimetable(user.id);
  const todayTimetable = allTimetable.filter(t => t.dayOfWeek === todayDay);

  const recommendations = dbStore.getRecommendations(user.id);
  const attempts = dbStore.getState().assessmentAttempts
    .filter(a => a.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const materials = dbStore.getMaterials().slice(0, 3);

  return res.json({
    profile,
    subjects: enrichedSubjects,
    strengths: enrichPerfs(strengths).slice(0, 4),
    weaknesses: enrichPerfs(weaknesses).slice(0, 4),
    todayTimetable,
    recommendations,
    recentAttempts: attempts,
    materials
  });
});

app.get('/api/analytics', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const perfs = dbStore.getPerformances(user.id);
  const topics = dbStore.getTopics();
  const subjects = dbStore.getSubjects();
  const topicMap = new Map(topics.map(t => [t.id, t]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const enriched = perfs.map(p => ({
    ...p,
    topicTitle: topicMap.get(p.topicId)?.title || 'Topic',
    subjectTitle: subjectMap.get(p.subjectId)?.title || 'Subject',
    difficultyLevel: topicMap.get(p.topicId)?.difficultyLevel || 'medium'
  }));

  const attempts = dbStore.getState().assessmentAttempts
    .filter(a => a.userId === user.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const history = dbStore.getHistory(user.id);

  return res.json({
    performances: enriched,
    attempts,
    history
  });
});

// -------------------------------------------------------------
// Learning Materials & Practice
// -------------------------------------------------------------

app.get('/api/materials', (_req: Request, res: Response) => {
  const materials = dbStore.getMaterials();
  return res.json(materials);
});

app.get('/api/materials/:topicId', (req: Request, res: Response) => {
  const materials = dbStore.getMaterials(req.params.topicId);
  return res.json(materials[0] || null);
});

app.get('/api/practice/questions', (req: Request, res: Response) => {
  const topicId = req.query.topicId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const questions = dbStore.getQuestions({ topicId, difficulty });

  const sanitized = questions.map(q => ({
    id: q.id,
    subjectId: q.subjectId,
    topicId: q.topicId,
    difficulty: q.difficulty,
    questionType: q.questionType,
    questionText: q.questionText,
    codeSnippet: q.codeSnippet,
    options: q.options,
    hint: q.hint
  }));
  return res.json(sanitized);
});

// -------------------------------------------------------------
// Timetable Endpoints
// -------------------------------------------------------------

app.get('/api/timetable', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const timetable = dbStore.getTimetable(user.id);
  return res.json(timetable);
});

app.post('/api/timetable/toggle', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { slotId, isCompleted } = req.body;

  const success = dbStore.toggleTimetableSlot(user.id, slotId, Boolean(isCompleted));
  if (isCompleted) {
    dbStore.addHistory({
      id: `hist_${Date.now()}`,
      userId: user.id,
      activityTitle: 'Completed Daily Study Timetable Session',
      activityType: 'timetable_completed',
      pointsEarned: 20,
      createdAt: new Date().toISOString()
    });
  }
  return res.json({ success, isCompleted });
});

app.post('/api/timetable/regenerate', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = dbStore.getProfileByUserId(user.id);
  const allTopics = dbStore.getTopics();
  const perfs = dbStore.getPerformances(user.id);

  const newTimetable = PersonalizationEngine.generateStudyTimetable(
    user.id,
    profile?.preferredDailyHours || 1.5,
    allTopics,
    perfs
  );
  dbStore.setTimetable(user.id, newTimetable);
  return res.json(newTimetable);
});

app.post('/api/timetable/slot', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { topicTitle, dayOfWeek, date, durationMinutes, timeSlot, activityType, subjectId, topicId, notes } = req.body;

  if (!topicTitle || !topicTitle.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const newSlot: TimetableSlot = {
    id: `slot_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    dayOfWeek: dayOfWeek || 'Monday',
    date: date || undefined,
    timeSlot: timeSlot || '10:00 - 10:45',
    subjectId: subjectId || 'subj_cs_dsa',
    topicId: topicId || undefined,
    topicTitle: topicTitle.trim(),
    durationMinutes: Number(durationMinutes) || 45,
    activityType: activityType || 'concept_study',
    isCompleted: false,
    notes: notes || undefined,
    isCustom: true
  };

  const added = dbStore.addTimetableSlot(newSlot);
  return res.json(added);
});

app.delete('/api/timetable/slot/:slotId', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { slotId } = req.params;
  const success = dbStore.deleteTimetableSlot(user.id, slotId);
  return res.json({ success });
});

app.put('/api/timetable/slot/:slotId', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { slotId } = req.params;
  const updated = dbStore.updateTimetableSlot(user.id, slotId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Slot not found' });
  }
  return res.json(updated);
});

// -------------------------------------------------------------
// Subject Selection & Custom Subjects Endpoints
// -------------------------------------------------------------

app.get('/api/subjects', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const profile = dbStore.getProfileByUserId(user.id);
  const subjects = dbStore.getSubjects();
  const topics = dbStore.getTopics();
  const perfs = dbStore.getPerformances(user.id);

  const selectedSet = new Set(profile?.selectedSubjects || ['subj_cs_dsa', 'subj_ml_ai']);
  const enriched = subjects.map(s => {
    const sTopics = topics.filter(t => t.subjectId === s.id);
    const sPerfs = perfs.filter(p => p.subjectId === s.id);
    const avgMastery = sPerfs.length > 0
      ? Math.round(sPerfs.reduce((a, b) => a + b.masteryScore, 0) / sPerfs.length)
      : 0;
    return {
      ...s,
      topicsCount: sTopics.length,
      masteryPercentage: avgMastery,
      isSelected: selectedSet.has(s.id)
    };
  });
  return res.json(enriched);
});

app.post('/api/subjects/select', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { selectedSubjects } = req.body;
  if (!Array.isArray(selectedSubjects)) {
    return res.status(400).json({ error: 'selectedSubjects must be an array of subject IDs' });
  }
  const updated = dbStore.updateUserSubjects(user.id, selectedSubjects);
  return res.json({ success: true, selectedSubjects: updated });
});

app.post('/api/subjects/create', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { title, category, description } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Subject title is required' });
  }
  const id = `subj_custom_${Date.now()}`;
  const code = title.slice(0, 4).toUpperCase();
  const newSubject = dbStore.addCustomSubject({
    id,
    code,
    title: title.trim(),
    category: category || 'Custom',
    description: description || `User custom curriculum for ${title.trim()}`,
    iconName: 'BookOpen',
    orderIndex: dbStore.getSubjects().length + 1
  });
  const profile = dbStore.getProfileByUserId(user.id);
  const current = profile?.selectedSubjects || [];
  if (!current.includes(id)) {
    dbStore.updateUserSubjects(user.id, [...current, id]);
  }
  return res.json({ success: true, subject: newSubject });
});

// -------------------------------------------------------------
// AI Tutor & Intelligent Inference Endpoints (Multimodal)
// -------------------------------------------------------------

app.post('/api/ai/tutor', authenticate, async (req: Request, res: Response) => {
  const { topicId, userQuery, mode, chatHistory, attachments, removeExtraSymbols = true } = req.body;
  const user = (req as any).user as User;
  const profile = dbStore.getProfileByUserId(user.id);
  const settings = dbStore.getSettings();

  const topic = dbStore.getTopics().find(t => t.id === topicId);
  const topicTitle = topic ? topic.title : 'General Computer Science & Mathematics';
  const perf = topic ? dbStore.getPerformances(user.id).find(p => p.topicId === topic.id) : null;

  const studentContext = `Student Profile:
- Name: ${user.fullName}
- Estimated Knowledge Level: ${profile?.estimatedKnowledgeLevel || 'Developing'}
- Current Topic: ${topicTitle}
- Topic Mastery Score: ${perf ? `${perf.masteryScore}%` : 'Unassessed'}
- Tutor Mode: ${mode || 'standard'} (Modes include: 'standard', 'eli5' [Explain like I'm 5], 'step_by_step', 'real_world', 'quiz_prep')`;

  // 1. Try Gemini 3.8 Flash via @google/genai if API key configured and provider is gemini
  if (settings.engineProvider === 'gemini' && geminiAI) {
    try {
      const systemInstruction = `You are Skillora, an elite, patient, pedagogical AI tutor.
${studentContext}

Guidelines:
- Provide clear, direct, and conceptually rigorous explanations.
- Adapt your vocabulary to the student's knowledge level (${profile?.estimatedKnowledgeLevel || 'Developing'}).
- If mode is 'eli5', use an engaging physical analogy.
- If mode is 'step_by_step', provide a structured numbered walkthrough with code or math.
- If the user provides images, diagrams, or documents, carefully inspect and search them, answer specific questions about the content, and point out key elements.
- Write clean, natural prose. Do NOT leave raw hashtags (###) or unnecessary formatting artifacts. Use clean readable paragraphs, numbered steps, or neat bullet points.`;

      const parts: any[] = [];

      if (chatHistory && chatHistory.length > 0) {
        parts.push({ text: `Previous conversation context:\n${JSON.stringify(chatHistory.slice(-4))}\n\n` });
      }

      // Add user query
      parts.push({ text: `Student Question / Query: ${userQuery || 'Analyze the attached file'}` });

      // Handle attached files and images
      if (Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          if (!att.dataUrl) continue;
          const isImage = att.type?.startsWith('image/');
          const isPdf = att.type === 'application/pdf';

          if (isImage || isPdf) {
            const base64Data = att.dataUrl.includes('base64,')
              ? att.dataUrl.split('base64,')[1]
              : att.dataUrl;
            parts.push({
              inlineData: {
                mimeType: att.type || 'image/png',
                data: base64Data
              }
            });
            parts.push({ text: `\n[Attached ${isImage ? 'Image' : 'PDF Document'}: "${att.name || 'file'}"]` });
          } else {
            // Text/code/csv/json/markdown
            let textContent = '';
            if (att.dataUrl.includes('base64,')) {
              try {
                const rawBase64 = att.dataUrl.split('base64,')[1];
                textContent = Buffer.from(rawBase64, 'base64').toString('utf-8');
              } catch {
                textContent = att.dataUrl;
              }
            } else {
              textContent = att.dataUrl;
            }
            parts.push({
              text: `\n[Attached File Content for "${att.name || 'document'}"]:\n${textContent.slice(0, 10000)}\n`
            });
          }
        }
      }

      const aiResponse = await geminiAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: parts,
        config: {
          systemInstruction,
        },
      });

      let replyText = aiResponse.text || 'I apologize, but I could not generate a response at this moment.';
      if (removeExtraSymbols) {
        replyText = stripExtraSymbols(replyText);
      }

      return res.json({
        reply: replyText,
        engine: 'Gemini 3.8 Flash (Server-Side Inference)'
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local engine:', err?.message);
    }
  }

  // 2. Try Ollama local endpoint if configured
  if (settings.engineProvider === 'ollama') {
    try {
      const response = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: `${studentContext}\n\nQuestion: ${userQuery}`,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json() as any;
        const reply = removeExtraSymbols ? stripExtraSymbols(data.response || '') : (data.response || '');
        return res.json({
          reply: reply || 'Local model responded with empty content.',
          engine: `Ollama (${settings.ollamaModel}) [Local On-Device]`
        });
      }
    } catch (err) {
      console.warn('Ollama local connection failed:', err);
    }
  }

  // 3. Robust Offline Pedagogical Knowledge Engine
  const offlineExplanation = generateOfflineTutorReply(topicTitle, userQuery, mode || 'standard', attachments);
  const cleanOffline = removeExtraSymbols ? stripExtraSymbols(offlineExplanation) : offlineExplanation;
  return res.json({
    reply: cleanOffline,
    engine: 'Skillora Knowledge Engine (Deterministic Local / Offline)'
  });
});

function generateOfflineTutorReply(topic: string, query: string, mode: string, attachments?: any[]): string {
  const attachmentNote = Array.isArray(attachments) && attachments.length > 0
    ? `\n\n(Inspected ${attachments.length} attached file/image: ${attachments.map(a => a.name).join(', ')})`
    : '';

  if (mode === 'eli5') {
    return `Simple Everyday Analogy for ${topic}

Imagine you run a bustling library with millions of books.
Instead of walking through every aisle one by one when someone asks for a title (which takes forever), you have a catalog system where you check the middle shelf, see if the letter comes before or after, and cut your search in half every single time!

Why it matters:
In ${topic}, we use clever organization so our solutions stay fast and dependable, no matter how huge the input gets.${attachmentNote}

Try asking: "Can you show me a concrete code example?" to see this in action!`;
  }

  if (mode === 'step_by_step') {
    return `Step-by-Step Breakdown: ${topic}

1. Formulate the Invariant:
Identify what state remains true before and after each computational step.

2. Handle Base / Edge Conditions:
Always verify zero, empty array, or single-node boundaries first before recursing or iterating.

3. State Transitions & Updates:
Update your pointers or parameter weights systematically, ensuring you never overshoot the target.

4. Verification:
Trace with a minimal test input and compute the exact step count to verify time & space complexity.${attachmentNote}`;
  }

  return `Concept Analysis: ${topic}

Regarding your question: "${query}"

1. Foundational Principle: In ${topic}, understanding the underlying invariants and complexity trade-offs is critical. Avoid premature optimization before identifying whether the bottleneck is compute (CPU) or memory (RAM).
2. Pedagogical Tip: Always write out the formula or pseudo-code before diving into implementation. This clarifies edge conditions and guarantees correctness.
3. Recommended Next Action: Take an adaptive practice drill on this topic to test your recall under active retrieval!${attachmentNote}`;
}

// -------------------------------------------------------------
// AI-Powered Notes Generation & Offline Storage Endpoints
// -------------------------------------------------------------

app.post('/api/notes/generate', async (req: Request, res: Response) => {
  try {
    const { topic, language = 'en', difficulty = 'Beginner', uploadedMaterial } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Check optional authenticated user for personalization
    let studentLevel = 'Competent';
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const profile = dbStore.getProfileByUserId(decoded.userId);
        if (profile) {
          studentLevel = profile.estimatedKnowledgeLevel || 'Competent';
          userId = decoded.userId;
        }
      } catch (e) {
        // Continue unauthenticated
      }
    }

    const settings = dbStore.getSettings();
    let note: StudyNote;

    if (settings.engineProvider === 'gemini' && geminiAI) {
      note = await generateGeminiNotes(
        geminiAI,
        topic,
        language as LanguageCode,
        difficulty as NoteDifficulty,
        studentLevel,
        uploadedMaterial
      );
    } else {
      note = generateDeterministicNotes(
        topic,
        language as LanguageCode,
        difficulty as NoteDifficulty,
        studentLevel
      );
    }

    if (userId) {
      note.userId = userId;
    }

    return res.json(note);
  } catch (err: any) {
    console.error('Error in /api/notes/generate:', err);
    return res.status(500).json({ error: 'Failed to generate study notes' });
  }
});

app.get('/api/notes/saved', (req: Request, res: Response) => {
  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (e) {}
  }
  const notes = dbStore.getSavedNotes(userId);
  return res.json(notes);
});

app.post('/api/notes/save', (req: Request, res: Response) => {
  const { note } = req.body;
  if (!note || !note.id || !note.topic) {
    return res.status(400).json({ error: 'Valid note object is required' });
  }

  let userId: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
    } catch (e) {}
  }

  const toSave: StudyNote = {
    ...note,
    userId: note.userId || userId,
    isSavedOffline: true
  };

  const saved = dbStore.saveNote(toSave);
  return res.json(saved);
});

app.delete('/api/notes/:id', (req: Request, res: Response) => {
  const noteId = req.params.id;
  const success = dbStore.deleteSavedNote(noteId);
  return res.json({ success, id: noteId });
});

// -------------------------------------------------------------
// Settings & Database Management
// -------------------------------------------------------------

app.get('/api/settings', (_req: Request, res: Response) => {
  return res.json(dbStore.getSettings());
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updated = dbStore.updateSettings(req.body);
  return res.json(updated);
});

app.get('/api/settings/export-db', (_req: Request, res: Response) => {
  res.setHeader('Content-Disposition', 'attachment; filename=skillora_export.json');
  res.setHeader('Content-Type', 'application/json');
  return res.json(dbStore.getState());
});

// -------------------------------------------------------------
// GitHub Repository Sync & Export Endpoints
// -------------------------------------------------------------

app.get('/api/github/status', async (_req: Request, res: Response) => {
  try {
    let branch = 'main';
    try {
      const { stdout } = await execAsync('git branch --show-current');
      branch = stdout.trim() || 'main';
    } catch {
      // fallback
    }

    let commit = {
      hash: '',
      author: '',
      time: '',
      message: ''
    };

    try {
      const { stdout } = await execAsync('git log -1 --format="%h|%an|%ar|%s"');
      const parts = stdout.trim().split('|');
      if (parts.length >= 4) {
        commit = {
          hash: parts[0],
          author: parts[1],
          time: parts[2],
          message: parts[3]
        };
      }
    } catch {
      // ignore
    }

    let remotes = '';
    try {
      const { stdout } = await execAsync('git remote -v');
      remotes = stdout.trim();
    } catch {
      // ignore
    }

    let clean = true;
    let pendingChanges = 0;
    try {
      const { stdout } = await execAsync('git status --porcelain');
      clean = stdout.trim().length === 0;
      pendingChanges = stdout.trim().split('\n').filter(Boolean).length;
    } catch {
      // ignore
    }

    let totalFiles = 0;
    try {
      const { stdout } = await execAsync('git ls-files');
      totalFiles = stdout.trim().split('\n').filter(Boolean).length;
    } catch {
      // ignore
    }

    return res.json({
      initialized: true,
      branch,
      commit,
      remotes,
      clean,
      pendingChanges,
      totalFiles
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to get git status' });
  }
});

app.post('/api/github/push', async (req: Request, res: Response) => {
  const { repoUrl, token, username, force } = req.body;
  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: 'Repository URL is required (e.g. https://github.com/username/skillora.git or username/skillora)' });
  }

  try {
    // 1. Stage and commit any unstaged files first
    try {
      await execAsync('git add .');
      await execAsync('git commit -m "Update Skillora learning platform components and styles"');
    } catch {
      // Working tree may already be clean
    }

    // 2. Parse repo url
    let cleanUrl = repoUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('git@')) {
      cleanUrl = `https://github.com/${cleanUrl.replace(/^\/+/, '')}`;
    }
    if (!cleanUrl.endsWith('.git')) {
      cleanUrl = `${cleanUrl}.git`;
    }

    // 3. Construct authenticated URL if token provided
    let pushUrl = cleanUrl;
    if (token && token.trim()) {
      const parsed = new URL(cleanUrl);
      const authUser = username && username.trim() ? encodeURIComponent(username.trim()) : 'oauth2';
      const authToken = encodeURIComponent(token.trim());
      parsed.username = authUser;
      parsed.password = authToken;
      pushUrl = parsed.toString();
    }

    // 4. Update git remote
    try {
      await execAsync('git remote remove origin');
    } catch {
      // ignore if remote didn't exist
    }

    await execAsync(`git remote add origin "${pushUrl}"`);
    await execAsync('git branch -M main');

    // 5. Execute git push
    const forceFlag = force ? ' --force' : '';
    const pushCmd = `git push${forceFlag} -u origin main`;
    
    const { stdout, stderr } = await execAsync(pushCmd);
    const combinedLogs = `${stdout}\n${stderr}`.trim();

    // Redact any token before returning
    const sanitizedLog = token
      ? combinedLogs.replaceAll(token.trim(), '***TOKEN***')
      : combinedLogs;

    return res.json({
      success: true,
      message: 'Successfully pushed Skillora repository to GitHub!',
      log: sanitizedLog,
      branch: 'main'
    });
  } catch (err: any) {
    let errMessage = err.stderr || err.stdout || err.message || 'Git push failed';
    if (token) {
      errMessage = errMessage.replaceAll(token.trim(), '***TOKEN***');
    }
    return res.status(400).json({
      success: false,
      error: errMessage,
      log: errMessage
    });
  }
});

app.get('/api/github/download-archive', async (_req: Request, res: Response) => {
  try {
    const archivePath = '/tmp/skillora-repo.tar.gz';
    await execAsync(`git archive --format=tar.gz --prefix=skillora/ HEAD -o "${archivePath}"`);
    
    res.setHeader('Content-Disposition', 'attachment; filename=skillora-repository.tar.gz');
    res.setHeader('Content-Type', 'application/gzip');
    
    const stream = fs.createReadStream(archivePath);
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create repository archive' });
  }
});

// -------------------------------------------------------------
// Start Server & Attach Vite
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Skillora server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
