import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, JSON, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), default="student")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    performances = relationship("StudentPerformance", back_populates="user", cascade="all, delete-orphan")
    timetables = relationship("StudyTimetable", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    learning_goals = Column(JSON, nullable=False, default=list)
    experience_level = Column(String(20), nullable=False, default="beginner")
    preferred_daily_hours = Column(Float, nullable=False, default=1.5)
    onboarding_completed = Column(Boolean, default=False)
    initial_assessment_completed = Column(Boolean, default=False)
    estimated_knowledge_level = Column(String(50), default="Novice")
    overall_mastery_percentage = Column(Float, default=0.0)
    current_streak_days = Column(Integer, default=0)
    total_study_minutes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(50), default="BookOpen")
    order_index = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    slug = Column(String(150), nullable=False)
    difficulty_level = Column(String(20), default="medium")
    order_index = Column(Integer, default=0)
    estimated_minutes = Column(Integer, default=45)
    prerequisites = Column(JSON, nullable=True)

    subject = relationship("Subject", back_populates="topics")
    questions = relationship("AssessmentQuestion", back_populates="topic", cascade="all, delete-orphan")
    materials = relationship("LearningMaterial", back_populates="topic", cascade="all, delete-orphan")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    difficulty = Column(String(20), nullable=False)  # easy, medium, hard
    question_type = Column(String(30), default="multiple_choice")
    question_text = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    options = Column(JSON, nullable=False)
    correct_option_index = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    hint = Column(Text, nullable=False)
    is_initial_assessment = Column(Boolean, default=False)

    topic = relationship("Topic", back_populates="questions")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_type = Column(String(40), nullable=False)
    subject_id = Column(String(36), nullable=True)
    total_questions = Column(Integer, nullable=False)
    correct_count = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    calculated_level = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StudentPerformance(Base):
    __tablename__ = "student_performance"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=0.0)
    mastery_score = Column(Float, default=0.0)
    status = Column(String(30), default="developing")  # mastered, proficient, developing, needs_revision
    last_practiced_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="performances")
    topic = relationship("Topic")
    subject = relationship("Subject")

class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content_markdown = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    key_takeaways = Column(JSON, nullable=False)
    interactive_example = Column(JSON, nullable=True)
    reading_time_minutes = Column(Integer, default=10)

    topic = relationship("Topic", back_populates="materials")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    score_percentage = Column(Float, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    ai_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_index = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer, default=0)

    attempt = relationship("QuizAttempt", back_populates="answers")

class StudyTimetable(Base):
    __tablename__ = "study_timetables"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(20), nullable=False)
    time_slot = Column(String(50), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, default=45)
    activity_type = Column(String(40), nullable=False)  # concept_study, practice_drill, revision, quiz_evaluation
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="timetables")
    subject = relationship("Subject")
    topic = relationship("Topic")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # urgent_revision, next_progression, reinforcement_drill
    reason = Column(Text, nullable=False)
    priority = Column(Integer, default=1)
    is_dismissed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")
    topic = relationship("Topic")

class LearningHistory(Base):
    __tablename__ = "learning_history"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_title = Column(String(200), nullable=False)
    activity_type = Column(String(50), nullable=False)
    details = Column(JSON, nullable=True)
    points_earned = Column(Integer, default=10)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
