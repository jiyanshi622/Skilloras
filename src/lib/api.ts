import {
  User, StudentProfile, Subject, Topic, Question,
  AssessmentAttempt, StudentPerformance, LearningMaterial,
  TimetableSlot, Recommendation, LearningHistoryItem, AISettings,
  DashboardData, StudyNote, LanguageCode, NoteDifficulty, ChatAttachment
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
  // Curriculum & Questions
  async getSubjects(): Promise<(Subject & { isSelected?: boolean; topicsCount?: number; masteryPercentage?: number })[]> {
    return this.request('/api/subjects');
  }

  async selectSubjects(selectedSubjects: string[]): Promise<{ success: boolean; selectedSubjects: string[] }> {
    return this.request('/api/subjects/select', {
      method: 'POST',
      body: JSON.stringify({ selectedSubjects }),
    });
  }

  async createSubject(data: { title: string; category?: string; description?: string }): Promise<{ success: boolean; subject: Subject }> {
    return this.request('/api/subjects/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  // Timetable & Personalization
  async getTimetable(): Promise<TimetableSlot[]> {
    return this.request('/api/timetable');
  }

  async toggleTimetableSlot(slotId: string, isCompleted: boolean): Promise<any> {
    return this.request('/api/timetable/toggle', {
      method: 'POST',
      body: JSON.stringify({ slotId, isCompleted }),
    });
  }

  async addTimetableSlot(data: {
    topicTitle: string;
    dayOfWeek: string;
    date?: string;
    durationMinutes: number;
    timeSlot?: string;
    activityType?: string;
    subjectId?: string;
    topicId?: string;
    notes?: string;
  }): Promise<TimetableSlot> {
    return this.request('/api/timetable/slot', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTimetableSlot(slotId: string): Promise<{ success: boolean }> {
    return this.request(`/api/timetable/slot/${encodeURIComponent(slotId)}`, {
      method: 'DELETE',
    });
  }

  async updateTimetableSlot(slotId: string, updates: Partial<TimetableSlot>): Promise<TimetableSlot> {
    return this.request(`/api/timetable/slot/${encodeURIComponent(slotId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async regenerateTimetable(): Promise<TimetableSlot[]> {
    return this.request('/api/timetable/regenerate', {
      method: 'POST',
    });
  }

  // AI Tutor (Multimodal Search & Files)
  async askAITutor(data: {
    topicId?: string;
    userQuery: string;
    mode?: 'standard' | 'eli5' | 'step_by_step' | 'real_world' | 'quiz_prep';
    chatHistory?: { role: string; content: string }[];
    attachments?: ChatAttachment[];
    removeExtraSymbols?: boolean;
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

  // AI-Powered Study Notes & Offline Cache
  async generateNotes(data: {
    topic: string;
    language?: LanguageCode;
    difficulty?: NoteDifficulty;
    uploadedMaterial?: string;
  }): Promise<StudyNote> {
    if (this.isOfflineMode) {
      // If offline, check local saved notes first
      const local = this.getLocalSavedNotes();
      const existing = local.find(n => n.topic.toLowerCase() === data.topic.toLowerCase() && n.language === (data.language || 'en'));
      if (existing) {
        return existing;
      }
    }

    try {
      const res = await this.request<StudyNote>('/api/notes/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res;
    } catch (err) {
      // Offline fallback: check local storage
      const local = this.getLocalSavedNotes();
      const match = local.find(n => n.topic.toLowerCase().includes(data.topic.toLowerCase()));
      if (match) return match;
      throw err;
    }
  }

  async getSavedNotes(): Promise<StudyNote[]> {
    try {
      if (!this.isOfflineMode) {
        const remoteNotes = await this.request<StudyNote[]>('/api/notes/saved');
        // Synchronize to localStorage for offline readiness
        this.setLocalSavedNotes(remoteNotes);
        return remoteNotes;
      }
    } catch (e) {
      console.warn('Failed to load remote saved notes, using local storage cache');
    }
    return this.getLocalSavedNotes();
  }

  async saveNote(note: StudyNote): Promise<StudyNote> {
    // 1. Update local storage immediately for offline reliability
    const local = this.getLocalSavedNotes();
    const idx = local.findIndex(n => n.id === note.id);
    const updatedNote = { ...note, isSavedOffline: true };
    if (idx >= 0) {
      local[idx] = updatedNote;
    } else {
      local.unshift(updatedNote);
    }
    this.setLocalSavedNotes(local);

    // 2. Sync to server if online
    if (!this.isOfflineMode) {
      try {
        return await this.request<StudyNote>('/api/notes/save', {
          method: 'POST',
          body: JSON.stringify({ note: updatedNote }),
        });
      } catch (e) {
        console.warn('Note saved locally (offline), will sync later');
      }
    }
    return updatedNote;
  }

  async deleteSavedNote(noteId: string): Promise<boolean> {
    const local = this.getLocalSavedNotes().filter(n => n.id !== noteId);
    this.setLocalSavedNotes(local);

    if (!this.isOfflineMode) {
      try {
        await this.request<{ success: boolean }>(`/api/notes/${noteId}`, {
          method: 'DELETE',
        });
      } catch (e) {}
    }
    return true;
  }

  public getLocalSavedNotes(): StudyNote[] {
    try {
      const raw = localStorage.getItem('skillora_saved_notes');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  public setLocalSavedNotes(notes: StudyNote[]) {
    try {
      localStorage.setItem('skillora_saved_notes', JSON.stringify(notes));
    } catch (e) {}
  }

  // GitHub Version Control & Sync
  async getGitStatus(): Promise<{
    initialized: boolean;
    branch: string;
    commit: { hash: string; author: string; time: string; message: string };
    remotes: string;
    clean: boolean;
    pendingChanges: number;
    totalFiles: number;
  }> {
    return this.request('/api/github/status');
  }

  async pushToGitHub(data: {
    repoUrl: string;
    token?: string;
    username?: string;
    force?: boolean;
  }): Promise<{ success: boolean; message?: string; log?: string; error?: string }> {
    return this.request('/api/github/push', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();
