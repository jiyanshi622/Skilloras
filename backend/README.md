# Skillora Backend Setup & Deployment Guide

This folder contains the complete **Python with FastAPI** backend, relational ORM models, and personalization engine for **Skillora**.

## Requirements & Architecture

- **Python**: 3.10+
- **FastAPI**: Modern asynchronous REST API with Pydantic validation
- **Database**: MySQL 8.0+ (with automatic SQLite fallback for rapid testing)
- **Local AI Engine**: Ollama (`llama3`, `mistral`, `phi3`, `deepseek-r1`) or Google Gemini API
- **Personalization**: Deterministic scoring and Bayesian Knowledge Tracing (BKT) algorithm in `algorithms.py`

---

## 1. Local Python Setup

1. **Create and activate a virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables** (create `.env`):
   ```env
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=skillora_db
   
   # AI Engine Configuration:
   AI_PROVIDER=gemini        # 'gemini', 'ollama', or 'offline'
   OLLAMA_ENDPOINT=http://localhost:11434
   OLLAMA_MODEL=llama3
   GEMINI_API_KEY=your_key_here
   ```

4. **Initialize MySQL Database**:
   ```bash
   mysql -u root -p < ../schema.sql
   ```

5. **Start FastAPI Development Server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Interactive Swagger API Documentation will be available at:
   `http://localhost:8000/docs`

---

## 2. Local AI Inference with Ollama (Offline Mode)

To run completely offline without external API dependencies:

1. Download and install Ollama from [https://ollama.ai](https://ollama.ai).
2. Pull a lightweight model:
   ```bash
   ollama pull llama3:8b
   # or for lower RAM:
   ollama pull phi3:mini
   ```
3. Start the Ollama server:
   ```bash
   ollama serve
   ```
4. Set `AI_PROVIDER=ollama` in your `.env` or toggle it in Skillora's in-app Settings panel.
