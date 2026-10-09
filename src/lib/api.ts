import {
  User, StudentProfile, Subject, Topic, Question,
  AssessmentAttempt, StudentPerformance, LearningMaterial,
  TimetableSlot, Recommendation, LearningHistoryItem, AISettings,
  DashboardData
} from '../types/index.ts';

const TOKEN_KEY = 'skillora_auth_token';
const OFFLINE_CACHE_KEY = 'skillora_offline_cache';

export class ApiClient {
  private token: string | null = null;
  private isOfflineMode: boolean = false;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.isOfflineMode = !navigator.onLine;

    window.addEventListener('online', () => {
      this.isOfflineMode = false;
    });
    window.addEventListener('offline', () => {
      this.isOfflineMode = true;
    });
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public isOffline(): boolean {
    return this.isOfflineMode;
  }

  public setOfflineOverride(offline: boolean) {
    this.isOfflineMode = offline;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      if (this.isOfflineMode && endpoint.startsWith('/api/ai/tutor')) {
        // Return offline mock immediately
        return {
          reply: "Offline Tutor Active: We are currently in disconnected mode. You can still practice all offline topics, review curated flashcards, and work through diagnostic quizzes!",
          engine: "Skillora Local Knowledge Engine (Offline Mode)"
        } as unknown as T;
      }

      const res = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network request failed' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn(`Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; profile: StudentProfile }> {
    const res = await this.request<{ token: string; user: User; profile: StudentProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async register(email: string, password: string, fullName: string): Promise<{ token: string; user: User; profile: StudentProfile }> {
    const res = await this.request<{ token: string; user: User; profile: StudentProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    this.setToken(res.token);
    return res;
  }

  async loginDemo(): Promise<{ token: string; user: User; profile: StudentProfile }> {
    const res = await this.request<{ token: string; user: User; profile: StudentProfile }>('/api/auth/demo', {
      method: 'POST',
    });
    this.setToken(res.token);
    return res;
  }

  async getMe(): Promise<{ user: User; profile: StudentProfile }> {
    return this.request<{ user: User; profile: StudentProfile }>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Onboarding
  async submitOnboarding(data: {
    fullName?: string;
    learningGoals: string[];
    selectedSubjects: string[];
    experienceLevel: string;
    preferredDailyHours: number;
  }): Promise<{ profile: StudentProfile; user: User }> {
    return this.request('/api/profile/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Curriculum & Questions
  async getSubjects(): Promise<Subject[]> {
    return this.request('/api/subjects');
  }

  async getTopics(subjectId?: string): Promise<Topic[]> {
    const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return this.request(`/api/topics${query}`);
  }

  async getAssessmentQuestions(subjectId?: string, initialOnly: boolean = false): Promise<Question[]> {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId);
    if (initialOnly) params.append('initialOnly', 'true');
    return this.request(`/api/assessment/questions?${params.toString()}`);
  }

  async submitAssessment(data: {
    assessmentType: string;
    subjectId?: string;
    topicId?: string;
    durationSeconds: number;
    answers: { questionId: string; selectedOptionIndex: number; timeSpentSeconds: number }[];
  }): Promise<any> {
    return this.request('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard & Analytics
  async getDashboard(): Promise<DashboardData> {
    return this.request('/api/dashboard');
  }

  async getAnalytics(): Promise<{ performances: StudentPerformance[]; attempts: AssessmentAttempt[]; history: LearningHistoryItem[] }> {
    return this.request('/api/analytics');
  }

  // Materials & Practice
  async getMaterials(topicId?: string): Promise<LearningMaterial[]> {
    const url = topicId ? `/api/materials/${encodeURIComponent(topicId)}` : '/api/materials';
    const res = await this.request<any>(url);
    return Array.isArray(res) ? res : (res ? [res] : []);
  }

  async getPracticeQuestions(topicId?: string, difficulty?: string): Promise<Question[]> {
    const params = new URLSearchParams();
    if (topicId) params.append('topicId', topicId);
    if (difficulty) params.append('difficulty', difficulty);
    return this.request(`/api/practice/questions?${params.toString()}`);
  }

  // Timetable
  async getTimetable(): Promise<TimetableSlot[]> {
    return this.request('/api/timetable');
  }

  async toggleTimetableSlot(slotId: string, isCompleted: boolean): Promise<any> {
    return this.request('/api/timetable/toggle', {
      method: 'POST',
      body: JSON.stringify({ slotId, isCompleted }),
    });
  }

  async regenerateTimetable(): Promise<TimetableSlot[]> {
    return this.request('/api/timetable/regenerate', {
      method: 'POST',
    });
  }

  // AI Tutor
  async askAITutor(data: {
    topicId?: string;
    userQuery: string;
    mode?: 'standard' | 'eli5' | 'step_by_step' | 'real_world' | 'quiz_prep';
    chatHistory?: { role: string; content: string }[];
  }): Promise<{ reply: string; engine: string }> {
    return this.request('/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Settings
  async getSettings(): Promise<AISettings> {
    return this.request('/api/settings');
  }

  async updateSettings(settings: Partial<AISettings>): Promise<AISettings> {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
