# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ThesisFlow is a dual-cycle learning system for master's thesis literature reviews based on the SALSA framework (Search, Appraisal, Synthesis, Analysis). It provides separate interfaces for teachers (flow design) and students (collaborative writing with AI assistance).

**Language Note**: Documentation and code comments are primarily in Traditional Chinese (繁體中文).

## Development Commands

### Frontend

```bash
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

| File                                      | Purpose                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| `store.ts`                                | Zustand global state - central hub for all frontend state |
| `authStore.ts`                            | Authentication state (user, role, tokens)                 |
| `types.ts`                                | TypeScript type definitions for entire app                |
| `components/StudentInterface.tsx` (107KB) | Main student workspace - multi-panel layout               |
| `components/TeacherInterface.tsx` (31KB)  | React Flow-based workflow designer                        |
| `components/ChatMainPanel.tsx`            | AI assistant interface                                    |
| `backend/models.py`                       | SQLAlchemy database models                                |
| `backend/routes/`                         | FastAPI route handlers                                    |

### State Management Pattern

All state flows through Zustand stores. API calls go through service layer → store → component re-renders.

```
services/*.ts → store.ts → components
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

Students progress through 4 task widget types in `components/widgets/`:

- **InstructionCard** (Task A): Reading guidance
- **SectionWriter** (Task B): Single paper summary with multiple sections
- **MatrixCompare** (Task C): Matrix comparison of two papers
- **SynthesisWriter** (Task D): Cross-paper synthesis and gap analysis

### Multi-Panel Interface

`StudentInterface.tsx` uses a 5-panel layout:

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
