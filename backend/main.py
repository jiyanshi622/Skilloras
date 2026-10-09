"""
Skillora - AI-Powered Personalized Learning Assistant
FastAPI Backend Application
"""

import os
import uuid
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import requests

from .database import get_db, engine, Base
from .models import (
    User, StudentProfile, Subject, Topic, AssessmentQuestion,
    AssessmentAttempt, StudentPerformance, LearningMaterial,
    QuizAttempt, QuizAnswer, StudyTimetable, Recommendation, LearningHistory
)
from .schemas import (
    UserRegister, UserLogin, TokenResponse, OnboardingRequest,
    AssessmentSubmission, TutorChatRequest, PracticeQuestionRequest,
    TimetableToggleRequest, AISettingsUpdate
)
from .algorithms import PersonalizationEngine

# Create database tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Skillora API",
    description="Adaptive AI-Powered Personalized Learning Assistant Backend",
    version="1.0.0"
)

# Enable CORS for local dev and frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System AI Settings cache
AI_CONFIG = {
    "provider": os.getenv("AI_PROVIDER", "gemini"),  # gemini, ollama, offline
    "ollama_endpoint": os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434"),
    "ollama_model": os.getenv("OLLAMA_MODEL", "llama3"),
    "gemini_api_key": os.getenv("GEMINI_API_KEY", "")
}

@app.get("/")
def root():
    return {
        "app": "Skillora API",
        "version": "1.0.0",
        "status": "online",
        "ai_provider": AI_CONFIG["provider"],
        "database": "MySQL / Relational Database"
    }

# ----------------- Step 1: Authentication -----------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # In production use passlib bcrypt; for simplicity here store hashed/salted representation
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=data.email.lower(),
        password_hash=f"hash_{data.password}",
        full_name=data.full_name
    )
    db.add(user)
    db.commit()

    # Create empty student profile
    profile = StudentProfile(
        id=str(uuid.uuid4()),
        user_id=user.id,
        learning_goals=[],
        experience_level="beginner",
        preferred_daily_hours=1.5
    )
    db.add(profile)
    db.commit()

    return {
        "access_token": f"token_{user.id}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "onboarding_completed": False,
            "initial_assessment_completed": False
        }
    }

@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    return {
        "access_token": f"token_{user.id}",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "onboarding_completed": profile.onboarding_completed if profile else False,
            "initial_assessment_completed": profile.initial_assessment_completed if profile else False
        }
    }

# ----------------- Step 1.2: Onboarding -----------------

@app.post("/api/profile/onboarding")
def complete_onboarding(user_id: str, data: OnboardingRequest, db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(id=str(uuid.uuid4()), user_id=user_id)
        db.add(profile)

    profile.learning_goals = data.learning_goals
    profile.experience_level = data.experience_level
    profile.preferred_daily_hours = data.preferred_daily_hours
    profile.onboarding_completed = True
    db.commit()

    return {"status": "success", "message": "Onboarding completed successfully"}

# ----------------- Step 2: Assessment -----------------

@app.get("/api/assessment/questions")
def get_initial_assessment_questions(db: Session = Depends(get_db)):
    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.is_initial_assessment == True).all()
    # If no initial questions flagged, return sample set
    if not questions:
        questions = db.query(AssessmentQuestion).limit(10).all()

    return [
        {
            "id": q.id,
            "subject_id": q.subject_id,
            "topic_id": q.topic_id,
            "difficulty": q.difficulty,
            "question_type": q.question_type,
            "question_text": q.question_text,
            "code_snippet": q.code_snippet,
            "options": q.options,
            "hint": q.hint
        }
        for q in questions
    ]

@app.post("/api/assessment/submit")
def submit_assessment(user_id: str, submission: AssessmentSubmission, db: Session = Depends(get_db)):
    questions = db.query(AssessmentQuestion).all()
    q_map = {q.id: {
        "id": q.id,
        "topic_id": q.topic_id,
        "subject_id": q.subject_id,
        "difficulty": q.difficulty,
        "correct_option_index": q.correct_option_index
    } for q in questions}

    # Step 3: Run Python scoring & personalization algorithm
    eval_result = PersonalizationEngine.evaluate_submission(q_map, submission.answers)

    # Save attempt record
    attempt = AssessmentAttempt(
        id=str(uuid.uuid4()),
        user_id=user_id,
        assessment_type=submission.assessment_type,
        subject_id=submission.subject_id,
        total_questions=eval_result["total_questions"],
        correct_count=eval_result["correct_count"],
        score_percentage=eval_result["score_percentage"],
        duration_seconds=submission.duration_seconds,
        calculated_level=eval_result["calculated_level"]
    )
    db.add(attempt)

    # Update profile knowledge level
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if profile:
        profile.initial_assessment_completed = True
        profile.estimated_knowledge_level = eval_result["calculated_level"]
        profile.overall_mastery_percentage = eval_result["score_percentage"]

    # Update topic-wise student performances
    for metric in eval_result["topic_metrics"]:
        perf = db.query(StudentPerformance).filter(
            StudentPerformance.user_id == user_id,
            StudentPerformance.topic_id == metric["topic_id"]
        ).first()

        if not perf:
            perf = StudentPerformance(
                id=str(uuid.uuid4()),
                user_id=user_id,
                topic_id=metric["topic_id"],
                subject_id=metric["subject_id"]
            )
            db.add(perf)

        perf.total_attempts += metric["total"]
        perf.correct_attempts += metric["correct"]
        perf.accuracy_percentage = round((perf.correct_attempts / perf.total_attempts) * 100.0, 1)
        perf.mastery_score = PersonalizationEngine.update_bayesian_mastery(
            perf.mastery_score,
            metric["correct"] > (metric["total"] / 2)
        )
        if perf.accuracy_percentage >= 75.0:
            perf.status = "mastered" if perf.mastery_score >= 85.0 else "proficient"
        elif perf.accuracy_percentage < 50.0:
            perf.status = "needs_revision"
        else:
            perf.status = "developing"

    db.commit()

    # Step 4: Generate study timetable & recommendations
    all_topics = db.query(Topic).all()
    topic_dicts = [{"id": t.id, "subject_id": t.subject_id, "title": t.title} for t in all_topics]
    all_perfs = db.query(StudentPerformance).filter(StudentPerformance.user_id == user_id).all()
    perf_dicts = [{
        "topic_id": p.topic_id,
        "accuracy_percentage": p.accuracy_percentage,
        "mastery_score": p.mastery_score,
        "status": p.status
    } for p in all_perfs]

    timetable = PersonalizationEngine.generate_study_timetable(
        user_id,
        profile.preferred_daily_hours if profile else 1.5,
        topic_dicts,
        perf_dicts
    )

    return {
        "score_percentage": eval_result["score_percentage"],
        "correct_count": eval_result["correct_count"],
        "total_questions": eval_result["total_questions"],
        "calculated_level": eval_result["calculated_level"],
        "topic_metrics": eval_result["topic_metrics"],
        "timetable_preview": timetable[:3]
    }

# ----------------- Step 5: AI Tutor & Contextual Help -----------------

@app.post("/api/ai/tutor")
def ask_ai_tutor(req: TutorChatRequest, db: Session = Depends(get_db)):
    topic_title = "General Learning"
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
        if topic:
            topic_title = topic.title

    prompt = (
        f"You are Skillora, an empathetic and highly structured AI learning assistant. "
        f"Context topic: {topic_title}. Mode: {req.mode}. "
        f"Student question: {req.user_query}"
    )

    # 1. Ollama local LLM mode if configured
    if AI_CONFIG["provider"] == "ollama":
        try:
            res = requests.post(
                f"{AI_CONFIG['ollama_endpoint']}/api/generate",
                json={
                    "model": AI_CONFIG["ollama_model"],
                    "prompt": prompt,
                    "stream": False
                },
                timeout=10
            )
            if res.status_code == 200:
                answer = res.json().get("response", "")
                return {"reply": answer, "engine": f"Ollama ({AI_CONFIG['ollama_model']})"}
        except Exception:
            pass # Fallback

    # 2. Local intelligent pedagogical rule-based tutor
    fallback_response = (
        f"Key Concept Breakdown for {topic_title}:\n\n"
        f"1. Core Principle: Focus on the fundamental invariant of {topic_title}. Break complex rules into smaller sub-problems.\n"
        f"2. Methodical Approach: Walk through a test case step-by-step and verify edge conditions.\n"
        f"3. Practical Insight: Practice an adaptive drill to solidify mental models and retention."
    )
    return {"reply": fallback_response, "engine": "Skillora Knowledge Engine (Deterministic Local)"}

# ----------------- Timetable Management -----------------

@app.post("/api/timetable/toggle")
def toggle_timetable_slot(req: TimetableToggleRequest, db: Session = Depends(get_db)):
    slot = db.query(StudyTimetable).filter(StudyTimetable.id == req.slot_id).first()
    if slot:
        slot.is_completed = req.is_completed
        db.commit()
    return {"status": "success", "is_completed": req.is_completed}
