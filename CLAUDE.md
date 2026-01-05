# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThesisFlow is a dual-cycle learning system for master's thesis literature reviews based on the SALSA framework (Search, Appraisal, Synthesis, Analysis). It provides separate interfaces for teachers (flow design) and students (collaborative writing with AI assistance).

**Language Note**: Documentation and code comments are primarily in Traditional Chinese (繁體中文).

## Project Structure

```
thesisflow-ai-flow/
├── frontend/          # React frontend application
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── store.ts       # Zustand global state
│   ├── authStore.ts   # Auth state
│   ├── types.ts       # TypeScript types
│   └── package.json   # Frontend dependencies
├── backend/           # FastAPI backend application
├── docs/              # Documentation
├── docker-compose.yml # Docker orchestration
└── package.json       # Root workspace scripts
```

## Development Commands

### From Root (Recommended)

```bash
npm run dev            # Start frontend dev server
npm run build          # Build frontend for production
npm run lint           # Run ESLint
npm run lint:fix       # Run ESLint with auto-fix
npm run format         # Format code with Prettier
npm run dev:backend    # Start backend server
npm run install:frontend  # Install frontend dependencies
npm run install:backend   # Install backend dependencies
```

### Frontend (from /frontend directory)

```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

### Pre-commit Hooks

Husky + lint-staged runs automatically on `git commit`:

- **TypeScript/JavaScript**: ESLint fix + Prettier
- **JSON/CSS/Markdown**: Prettier only

To bypass hooks (not recommended): `git commit --no-verify`

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python init_db.py                                    # Initialize database
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Docker (Recommended)

```bash
docker compose up -d        # Start all services
docker compose logs -f      # View logs
docker compose down         # Stop services
docker compose down -v      # Stop and reset database
```

## Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite, React Flow (workflow visualization), React PDF, Zustand (state management), Tailwind CSS
- **Backend**: FastAPI + Python 3.11, SQLAlchemy 2.0, PostgreSQL 16, JWT auth
- **Storage**: MinIO/S3 for documents, Azure OpenAI for AI integration

### Key Files

| File                                               | Purpose                                                   |
| -------------------------------------------------- | --------------------------------------------------------- |
| `frontend/store.ts`                                | Zustand global state - central hub for all frontend state |
| `frontend/authStore.ts`                            | Authentication state (user, role, tokens)                 |
| `frontend/types.ts`                                | TypeScript type definitions for entire app                |
| `frontend/components/StudentInterface.tsx` (107KB) | Main student workspace - multi-panel layout               |
| `frontend/components/TeacherInterface.tsx` (31KB)  | React Flow-based workflow designer                        |
| `frontend/components/ChatMainPanel.tsx`            | AI assistant interface                                    |
| `backend/models.py`                                | SQLAlchemy database models                                |
| `backend/routes/`                                  | FastAPI route handlers                                    |

### Frontend Routes (Student)

| Route                    | Page Component                    | Description                    |
| ------------------------ | --------------------------------- | ------------------------------ |
| `/dashboard`             | `pages/Dashboard.tsx`             | 學生儀表板（專案列表、最近文獻） |
| `/projects`              | `pages/ProjectsPage.tsx`          | 專案列表頁面                    |
| `/literature`            | `pages/LiteraturePage.tsx`        | 文獻庫管理（上傳、列表、預覽）   |
| `/groups`                | `pages/GroupsPage.tsx`            | 群組管理                        |
| `/profile`               | `pages/ProfilePage.tsx`           | 個人資料                        |
| `/student/project`       | `components/StudentInterface.tsx` | 專案工作區（多面板介面）         |

**注意**: `pages/StudentHome.tsx` 目前未被路由使用，`/student` 會重導向至 `/dashboard`。

### Frontend Routes (Teacher)

| Route                    | Page Component                    | Description                    |
| ------------------------ | --------------------------------- | ------------------------------ |
| `/teacher`               | `pages/TeacherHome.tsx`           | 教師首頁                        |
| `/teacher/cohort/:id`    | `pages/TeacherCohort.tsx`         | 班級管理                        |
| `/teacher/project/:id`   | `components/TeacherInterface.tsx` | 流程設計器（React Flow）        |

### State Management Pattern

All state flows through Zustand stores. API calls go through service layer → store → component re-renders.

```
frontend/services/*.ts → frontend/store.ts → frontend/components
```

### Evidence System (Core Concept)

The evidence system connects reading → writing → submission:

1. Students highlight text in PDFs → creates Highlight
2. Highlight becomes Evidence (with name/type/position)
3. Evidence used in task writing via `EvidenceSelector`
4. Task submission validates minimum evidence requirements
5. Progress unlocks next workflow node

Evidence linked via `snippetIds` array in `FieldWithEvidence` objects.

### SALSA Task Types

Students progress through 4 task widget types in `frontend/components/widgets/`:

- **InstructionCard** (Task A): Reading guidance
- **SectionWriter** (Task B): Single paper summary with multiple sections
- **MatrixCompare** (Task C): Matrix comparison of two papers
- **SynthesisWriter** (Task D): Cross-paper synthesis and gap analysis

### Multi-Panel Interface

`frontend/components/StudentInterface.tsx` uses a 5-panel layout:

1. LibraryPanel - Project document binding
2. ReaderPanel - PDF viewing + annotation
3. ChatMainPanel - AI assistant
4. TasksPanel - Active task widgets
5. EvidenceListPanel - Evidence management

### Authentication & Authorization

- JWT-based auth (see `backend/auth.py`)
- Role-based route protection via `ProtectedRoute` component
- Two roles: "teacher" and "student"

### Auto-Save Pattern

Writing widgets and chat use debounced auto-save (1 second delay). See `useAutoSave` hook usage.

## Database Models

Key tables in `backend/models.py`:

- **User**: Teachers and students (email, name, role, password_hash)
- **Project**: Workflows (title, semester, flow_nodes, flow_edges as JSON)
- **Document**: Uploaded PDFs (object_key points to MinIO)
- **Highlight**: PDF annotations (snippet, page, coordinates)
- **Cohort**: Student groups with join codes
- **TaskVersion**: Submitted task data with validation status
- **WorkflowState**: Per-user progress tracking

## API Structure

Backend routes in `backend/routes/`:

- `auth.py` - Authentication endpoints
- `projects.py` - Project/workflow CRUD
- `documents.py` - Document handling
- `highlights.py` - Evidence/highlight management
- `cohorts.py` - Group operations
- `chat.py` - AI chat endpoint
- `tasks.py` - Task submission

## Environment Configuration

Key environment variables (see `.env.example`):

- `VITE_API_BASE` - Frontend API endpoint
- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` - AI integration
- `MINIO_*` - File storage configuration
- `JWT_SECRET` - Auth token signing
- `DATABASE_URL` - PostgreSQL connection (auto-configured in Docker)

Development uses localhost defaults; production requires `FRONTEND_DOMAIN` and `BACKEND_DOMAIN` for CORS.

## Documentation Update Guidelines

When updating documentation (from `docs/AI_DOCUMENTATION_GUIDE.md`):

- Update `.env.example` files when adding environment variables
- Keep port numbers consistent (frontend: 3000, backend: 8000, postgres: 5432)
- Files over 300 lines should be considered for refactoring
- Service names are lowercase: `frontend`, `backend`, `postgres`

## Git Operations Guidelines

### 分支合併限制 (Branch Merge Restrictions)

**重要**: 任何與分支合併相關的操作（包括但不限於 `git merge`, `git rebase`, PR 合併等）**必須在獲得用戶明確同意後**才能進行。

- 不可在未經用戶確認的情況下執行任何合併操作
- 執行合併前必須詢問用戶並獲得明確授權

### Force Push 禁止令 (Force Push Prohibition)

**嚴令禁止**: 任何 force push 操作（`git push --force`, `git push -f` 等）在未獲得用戶**明確、書面同意**前是完全禁止的。

- Force push 對 `main` 分支、`master` 分支或任何受保護分支的操作絕對禁止，除非用戶明確要求
- 即使用戶授權也應謹慎進行，並清楚說明可能的後果
- 優先使用常規 push 而非 force push
