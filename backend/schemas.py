from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class OnboardingRequest(BaseModel):
    full_name: Optional[str] = None
    learning_goals: List[str]
    selected_subjects: List[str]
    experience_level: str  # beginner, intermediate, advanced
    preferred_daily_hours: float = 1.5

class AssessmentSubmission(BaseModel):
    assessment_type: str  # initial_diagnostic, topic_quiz, adaptive_practice
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    duration_seconds: int
    answers: List[Dict[str, Any]]  # [{ question_id: str, selected_option_index: int, time_spent_seconds: int }]

class TutorChatRequest(BaseModel):
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None
    user_query: str
    mode: Optional[str] = "standard"  # standard, eli5, step_by_step, real_world, quiz_prep
    chat_history: Optional[List[Dict[str, str]]] = []

class PracticeQuestionRequest(BaseModel):
    topic_id: str
    difficulty: Optional[str] = "medium"
    count: Optional[int] = 5

class TimetableToggleRequest(BaseModel):
    slot_id: str
    is_completed: bool

class AISettingsUpdate(BaseModel):
    engine_provider: str  # gemini, ollama, offline
    ollama_model: Optional[str] = "llama3"
    ollama_endpoint: Optional[str] = "http://localhost:11434"
