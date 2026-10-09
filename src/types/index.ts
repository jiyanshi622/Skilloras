export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type KnowledgeLevel = 'Novice' | 'Developing' | 'Competent' | 'Proficient' | 'Master';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PerformanceStatus = 'mastered' | 'proficient' | 'developing' | 'needs_revision';
export type ActivityType = 'concept_study' | 'practice_drill' | 'revision' | 'quiz_evaluation';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'educator' | 'admin';
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  learningGoals: string[];
  selectedSubjects: string[];
  experienceLevel: ExperienceLevel;
  preferredDailyHours: number;
  onboardingCompleted: boolean;
  initialAssessmentCompleted: boolean;
  estimatedKnowledgeLevel: KnowledgeLevel;
  overallMasteryPercentage: number;
  currentStreakDays: number;
  totalStudyMinutes: number;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  orderIndex: number;
  topicsCount?: number;
  masteryPercentage?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  difficultyLevel: Difficulty;
  orderIndex: number;
  estimatedMinutes: number;
  prerequisites?: string[];
  materialsCount?: number;
  accuracyPercentage?: number;
  status?: PerformanceStatus;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  difficulty: Difficulty;
  questionType: 'multiple_choice' | 'code_output' | 'true_false';
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  hint: string;
  isInitialAssessment?: boolean;
}

export interface AssessmentSubmissionAnswer {
  questionId: string;
  selectedOptionIndex: number;
  timeSpentSeconds: number;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentType: 'initial_diagnostic' | 'topic_quiz' | 'adaptive_practice';
  subjectId?: string;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  durationSeconds: number;
  calculatedLevel: KnowledgeLevel;
  createdAt: string;
}

export interface StudentPerformance {
  id: string;
  userId: string;
  topicId: string;
  subjectId: string;
  topicTitle?: string;
  subjectTitle?: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracyPercentage: number;
  masteryScore: number;
  status: PerformanceStatus;
  lastPracticedAt: string;
}

export interface LearningMaterial {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  contentMarkdown: string;
  summary: string;
  keyTakeaways: string[];
  interactiveExample?: {
    type: 'code' | 'algorithm' | 'quiz_check';
    title: string;
    input: string;
    expectedOutput: string;
    explanation: string;
  };
  readingTimeMinutes: number;
}

export interface TimetableSlot {
  id: string;
  userId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string;
  subjectId: string;
  subjectTitle?: string;
  topicId: string;
  topicTitle?: string;
  durationMinutes: number;
  activityType: ActivityType;
  isCompleted: boolean;
}

export interface Recommendation {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  recommendationType: 'urgent_revision' | 'next_progression' | 'reinforcement_drill' | 'advanced_challenge';
  reason: string;
  priority: number;
}

export interface LearningHistoryItem {
  id: string;
  userId: string;
  activityTitle: string;
  activityType: 'assessment' | 'practice' | 'reading' | 'ai_tutor_session' | 'timetable_completed';
  details?: Record<string, any>;
  pointsEarned: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  engineUsed?: string;
  quickPrompts?: string[];
  suggestedAction?: {
    type: 'practice' | 'read' | 'quiz';
    topicId: string;
    title: string;
  };
}

export interface AISettings {
  engineProvider: 'gemini' | 'ollama' | 'offline';
  ollamaEndpoint: string;
  ollamaModel: string;
  geminiModel: string;
  speechEnabled: boolean;
}

export interface DashboardData {
  profile: StudentProfile;
  subjects: (Subject & { masteryPercentage: number; topicsCount: number })[];
  strengths: StudentPerformance[];
  weaknesses: StudentPerformance[];
  todayTimetable: TimetableSlot[];
  recommendations: Recommendation[];
  recentAttempts: AssessmentAttempt[];
  materials: LearningMaterial[];
}
