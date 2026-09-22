# AI-Powered College Programming Lab Management System

A college platform where teachers manage programming labs and assignments while AI automatically analyzes student coding, quiz, assignment, and learning activity.

## Project Overview

This is a full-stack monorepo containing:

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: Redis + BullMQ
- **AI Service**: Python + FastAPI
- **Code Executor**: Node.js + Docker Sandbox

## Architecture

```
ai-programming-lab/
│
├── frontend/          # React + Vite + TypeScript
├── backend/           # Node.js + Express + TypeScript
├── ai-service/        # Python + FastAPI
├── code-executor/     # Node.js Docker Sandbox
│
├── docker/            # Docker sandbox images
│   ├── cpp/
│   ├── java/
│   ├── python/
│   └── javascript/
│
├── docs/              # Documentation
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Vanilla CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Queue | Redis, BullMQ |
| AI | Python, FastAPI |
| Code Execution | Node.js, Docker Sandbox |
| Languages | C++, Java, Python, JavaScript |

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-programming-lab
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Code Executor
cd ../code-executor
npm install

# AI Service
cd ../ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values.

### 4. Start infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d postgres redis
```

### 5. Set up the database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start the services

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev

# AI Service (from ai-service/)
uvicorn app.main:app --reload --port 8000

# Code Executor (from code-executor/)
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `JWT_EXPIRES_IN` | Access token expiry (e.g., `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., `7d`) |
| `REDIS_URL` | Redis connection string |
| `AI_PROVIDER` | AI provider (e.g., `openai`) |
| `AI_API_KEY` | AI provider API key |
| `AI_MODEL` | AI model name |
| `AI_SERVICE_URL` | AI service URL |
| `CODE_EXECUTOR_URL` | Code executor URL |

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

## Docker Setup

Start all services:

```bash
docker-compose up --build
```

Start specific services:

```bash
docker-compose up -d postgres redis
docker-compose up backend
```

Stop all services:

```bash
docker-compose down
```

## Development Commands

### Backend

```bash
cd backend
npm run dev        # Start dev server
npm run build      # Build TypeScript
npm start          # Start production server
npm test           # Run tests
```

### Frontend

```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

### AI Service

```bash
cd ai-service
uvicorn app.main:app --reload --port 8000
```

### Code Executor

```bash
cd code-executor
npm run dev
```

## Testing

```bash
# Backend tests
cd backend
npm test
```

Tests cover:
- Health endpoint
- Database connection
- Redis connection
- Authentication (register, login, logout, refresh, current user)
- Role-Based Access Control (RBAC)

## API Endpoints

### Health

```
GET /api/v1/health
```

### Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

## Roles

- **STUDENT**: Access to student dashboard
- **TEACHER**: Access to teacher dashboard
- **ADMIN**: Access to admin dashboard

## License

MIT