# Skillora — AI-Powered Personalized Learning Assistant

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-Python_FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Ollama](https://img.shields.io/badge/Local_AI-Ollama-000000)](https://ollama.ai/)
[![Gemini](https://img.shields.io/badge/Cloud_AI-Gemini_3.8_Flash-4285F4?logo=google)](https://ai.google.dev/)

**Skillora** is an intelligent, full-stack personalized educational assistant that adapts dynamically to each student's knowledge level, strengths, weaknesses, and learning pace. Powered by a deterministic **Bayesian Knowledge Tracing (BKT)** algorithmic engine, Skillora evaluates student diagnostic assessments, prioritizes retention vulnerabilities, generates 7-day personalized study timetables, and provides contextual AI tutoring via on-device Ollama local models or cloud-hosted Gemini.

---

## 🌟 Core Features & Learning Workflow

```
[ Authentication & Onboarding ]
             │
             ▼
[ Initial Diagnostic Assessment ] ──► [ Deterministic Scoring & Level Calibrator ]
                                                     │
                                                     ▼
                                      [ Bayesian Knowledge Tracing (BKT) ]
                                      • Strengths (≥75% Mastery)
                                      • Weaknesses (<55% Retention)
                                                     │
                                                     ▼
                                      [ Personalized Timetable & Drills ]
                                      • 45-min Focus Intervals
                                      • Urgent Revision Sessions
                                                     │
                                                     ▼
                                      [ Daily Study & AI Contextual Tutor ]
                                      • Rigorous Standard / ELI5 / Step-by-Step
                                      • Active Recall Practice & Quizzes
                                                     │
                                                     ▼
                                      [ Continuous Recalibration Loop ]
```

1. **Authentication & Profile Onboarding**: Student goal selection, subject preferences (*Computer Science DSA, Machine Learning, Calculus, Web Systems, Physics*), experience levels (*Beginner, Intermediate, Advanced*), and daily study commitment (1–3 hours).
2. **Diagnostic Calibration**: Automated evaluation across difficulty tiers (easy, medium, hard) mapping students to calibrated knowledge levels (*Novice*, *Developing*, *Competent*, *Proficient*, *Master*).
3. **Bayesian Knowledge Tracing (BKT)**: Probabilistic skill modeling updating $P(\text{Learned}_t)$ given guess, slip, and transit parameters after every practice drill.
4. **Adaptive Study Timetable**: Automatically generates daily 45-minute focus blocks matching user time commitments, reserving priority slots for weak topics.
5. **Contextual AI Tutor (Dual-Engine + Offline)**: Interactive conversational mentor supporting multiple pedagogical modes:
   - **Rigorous Standard**: Clear, direct, conceptual proofs.
   - **ELI5**: Simple physical analogies for intuitive comprehension.
   - **Step-by-Step**: Numbered derivations and code traces.
   - **Real-World Systems**: Production software and system architecture context.
   - **Exam Prep**: Common pitfalls and trick questions.
   - **Text-to-Speech**: In-browser speech synthesis for auditory learners.
6. **Active Recall Drills**: Instant answer feedback, hints, and step-by-step solutions that continuously update mastery metrics.
7. **Longitudinal Progress Analytics**: Deep-dive mastery matrices, historical attempt timelines, and streak tracking.

---

## 🏗️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons | Responsive SPA built with strict Universal Design Constitution, 3-zone Top Bar contract, and accessible typography. |
| **Python Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic | Asynchronous REST API, connection pooling, deterministic scoring algorithms. |
| **Full-Stack Runtime** | Node.js Express, Vite, `@google/genai` | Embedded development runtime for live dev testing and server-side Gemini API proxy. |
| **Database** | MySQL 8.0+ / MariaDB 10.5+ | 11 relational normalized tables with foreign keys, indexes, and cascading constraints (`schema.sql`). |
| **Local Inference** | Ollama (`llama3`, `mistral`, `phi3`) | Privacy-first on-device LLM inference without sending learning data to external servers. |
| **Cloud AI** | Google Gemini 3.8 Flash | High-speed cloud reasoning via the modern `@google/genai` SDK. |
| **Offline Engine** | Deterministic Pedagogical Knowledge Engine | 100% offline rule-based knowledge engine for air-gapped study environments. |

---

## 📁 Repository Structure

```
skillora/
├── backend/                       # Python FastAPI Backend
│   ├── main.py                    # FastAPI application & route endpoints
│   ├── database.py                # SQLAlchemy engine & session manager
│   ├── models.py                  # SQLAlchemy ORM models (11 relational tables)
│   ├── schemas.py                 # Pydantic request/response validation schemas
│   ├── algorithms.py              # Bayesian Knowledge Tracing & Timetable algorithms
│   ├── requirements.txt           # Python dependencies
│   └── README.md                  # Backend local deployment instructions
├── src/                           # React Frontend Source
│   ├── assets/images/             # Generated visual assets
│   ├── components/                # Modular UI views
│   │   ├── Navbar.tsx             # 3-Zone top navigation bar
│   │   ├── LandingPage.tsx        # Hero, workflow steps, and curriculum preview
│   │   ├── AuthModal.tsx          # Login, registration & 1-click student demo
│   │   ├── OnboardingView.tsx     # Student goal & study preference stepper
│   │   ├── AssessmentView.tsx     # Diagnostic testing & evaluation report
│   │   ├── DashboardView.tsx      # Central hub with mastery KPIs & timetable
│   │   ├── AITutorView.tsx        # Multi-mode conversational learning assistant
│   │   ├── LearningMaterialsView.tsx # Curriculum reader with formulas & code
│   │   ├── PracticeQuizView.tsx   # Adaptive question arena with instant feedback
│   │   ├── AnalyticsView.tsx      # Topic matrix, mastery curve & activity history
│   │   ├── TimetableView.tsx      # 7-day schedule & Pomodoro focus timer
│   │   └── SettingsView.tsx       # AI engine switcher & MySQL export tools
│   ├── lib/                       # API client & helpers
│   │   └── api.ts                 # Typed fetch client with offline resilience
│   ├── types/                     # TypeScript shared domain models
│   │   └── index.ts
│   ├── App.tsx                    # Root application component & routing
│   ├── main.tsx                   # React DOM entry point
│   └── index.css                  # Tailwind CSS & Plus Jakarta Sans typography
├── server/                        # Embedded Server Utilities
│   ├── algorithms.ts              # TypeScript implementation of BKT algorithms
│   └── db.ts                      # Persistent JSON/relational storage & seed data
├── server.ts                      # Full-stack Express server with Vite middleware
├── schema.sql                     # Production MySQL 8.0+ relational DDL schema
├── package.json                   # Node.js dependencies and scripts
├── tsconfig.json                  # TypeScript compiler configuration
├── vite.config.ts                 # Vite bundler configuration
└── README.md                      # Project documentation
```

---

## 🗄️ Relational Database Schema (MySQL)

The database schema (`schema.sql`) implements 11 normalized tables:

1. `users`: Credentials, full name, role, timestamps.
2. `student_profiles`: Learning goals, experience level, daily study hours, estimated knowledge level, streak days.
3. `subjects`: Curriculum subjects with codes and categories.
4. `topics`: Subject modules, difficulty levels, prerequisites, estimated durations.
5. `assessment_questions`: Questions with difficulty, code snippets, multiple choices, correct options, hints, explanations.
6. `assessment_attempts`: Formal test attempts, duration, scores, and calculated knowledge levels.
7. `student_performance`: Topic-level accuracy, Bayesian mastery scores (0–100), and status categories.
8. `learning_materials`: Concept notes, markdown content, summaries, key takeaways, and interactive examples.
9. `quiz_attempts` & `quiz_answers`: Per-question attempt telemetry and time spent.
10. `study_timetables`: 7-day scheduled slots, activity types (`concept_study`, `practice_drill`, `revision`), and completion statuses.
11. `recommendations` & `learning_history`: Algorithmic priority recommendations and gamified points history.

---

## 🚀 Quick Start Guide

### Option 1: Run the Full-Stack App (Node.js + Vite)

```bash
# 1. Install dependencies
npm install

# 2. Start the full-stack application (runs on http://localhost:3000)
npm run dev
```

*Note: You can click the **1-Click Launch: Student Demo (Alex Vance)** button on the sign-in modal to immediately test the system with pre-seeded mastery scores and a 7-day study timetable.*

---

### Option 2: Run with Python FastAPI & MySQL

#### 1. Set Up MySQL Database
```bash
mysql -u root -p < schema.sql
```

#### 2. Start FastAPI Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at `http://localhost:8000/docs`.

---

### Option 3: Enable On-Device Offline AI with Ollama

Skillora allows complete offline learning without transmitting data to external servers:

1. Install Ollama from [ollama.ai](https://ollama.ai).
2. Download a model:
   ```bash
   ollama pull llama3:8b
   # or for lower RAM machines:
   ollama pull phi3:mini
   ```
3. Start the Ollama daemon:
   ```bash
   ollama serve
   ```
4. In Skillora, navigate to **Settings > AI Inference Engine**, select **Ollama (Local LLM)**, and save.

---

## 🧪 Testing & Verification

```bash
# Verify TypeScript compilation and linting
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.
