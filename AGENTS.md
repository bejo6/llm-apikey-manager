# AGENTS.md — API Key Manager (Flask)

Behavioral guidelines for AI coding agents working on this project.

---

## Language Protocol

**Chat & Communication:** Bahasa Indonesia
**Code, Comments, Docs:** 100% English

All Python code, docstrings, commit messages, technical documentation, and inline comments must be written in English. Only use Indonesian for conversational responses to the user.

---

## Git Protocol (STRICT)

**Never execute `git commit`, `git add`, or `git push` unless explicitly instructed by the user.**

- Completing a task or plan does NOT imply permission to commit
- Always wait for user review first
- Every new task starts with a "No Commit" baseline
- Context resets between sessions — never assume prior commit permission carries over

---

## 1. Think Before Coding

**Don't assume. Surface tradeoffs. Ask when uncertain.**

Before implementing:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so.
- If something is unclear, stop. Name what's confusing. Ask.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" that wasn't requested
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments, or formatting unless asked
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- Remove imports/variables YOUR changes made unused — don't remove pre-existing dead code

**The test:** Every changed line should trace directly to the user's request.

---

## 4. Plan Before Implement

**Always create a plan document before any implementation.**

- Create plan in `docs/` before writing any code
- Break plan into phases
- Report blockers or ambiguities before starting
- After completion: update docs/PHASE_REPORT.md

---

## 5. Verification

**Always verify after changes.**

- Backend: run `python -m py_compile` to check syntax
- Run the app: `python app.py` and test manually

---

## Environment (MANDATORY)

**ALWAYS use the project's Python environment.**

1. Check if `.venv` exists in project root
2. If exists, always activate it before running any Python command:
   ```bash
   source .venv/bin/activate
   ```
3. If `.venv` does NOT exist, create it using `uv`:
   ```bash
   uv venv
   uv sync
   ```
4. NEVER use system Python (`/usr/bin/python3`) unless explicitly instructed

---

## Project Overview

API Key Manager — Flask web interface + SQLite database.
Maintained by Rocky, built with AI agent assistance.

### Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Flask 3.0 + Blueprints, Python 3.9+ |
| Frontend | Vanilla JS (modular per-page), Native CSS |
| Database | SQLite (3 tables: providers, api_keys, models) |
| Storage | Local file (`data/apikey.db`) |

### Current Status

- **Architecture**: Multi-page application (server-side routing)
- **Features**: Dashboard, Keys CRUD, Providers CRUD, Models Catalog, Import/Export
- **Database**: 3 tables with foreign key relationships
- **UI**: Dark theme with sidebar navigation

---

## Docs Structure

```
docs/
├── PHASE_REPORT.md             # Development phase report (all phases)
├── MODEL_CATALOG_DESIGN.md     # Model catalog design document
├── PLAN_DASHBOARD.md           # Dashboard implementation plan
├── providers_from_api_keys.txt # Provider snapshot (26 providers)
└── archive/                    # Completed plans
    ├── PLAN_IMPORT.md
    ├── PLAN_MODELS_UI.md
    ├── PLAN_PROVIDERS_TABLE.md
    ├── PLAN_TEMPLATE_REFACTOR.md
    └── db_refactor_plan.md
```

---

## Running the App

```bash
cd apikey-manager-flask
source .venv/bin/activate
python app.py
# Access: http://localhost:5000
```

### Database
- Location: `data/apikey.db`
- Auto-created on first run

---

## Key Files

| File | Description |
|------|-------------|
| `app.py` | Flask app + page routes |
| `db.py` | SQLite database operations (3 tables) |
| `routes/keys.py` | API keys routes (Blueprint) |
| `routes/providers.py` | Providers routes (Blueprint) |
| `routes/models.py` | Models routes (Blueprint) |
| `static/style.css` | Modern dark CSS |
| `static/js/main.js` | Shared functions (toast, escapeHtml, etc.) |
| `static/js/dashboard.js` | Dashboard page logic |
| `static/js/keys.js` | Keys page logic |
| `static/js/providers.js` | Providers page logic |
| `static/js/models.js` | Models page logic |
| `templates/base.html` | Base layout with sidebar |
| `templates/pages/*.html` | Page templates (dashboard, keys, providers, models, import, export) |
| `requirements.txt` | Python dependencies |

---

## API Endpoints

### Page Routes (Server-side)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard (home page) |
| GET | `/keys` | Keys list page |
| GET | `/providers` | Providers list page |
| GET | `/models` | Models catalog page |
| GET | `/import` | Import page |
| GET | `/export` | Export page |

### API Routes (JSON)

#### Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/keys` | Get keys (pagination, search, filter) |
| POST | `/api/keys` | Add new key (body: `provider_id`) |
| PUT | `/api/keys/<id>` | Update key (body: `provider_id`) |
| DELETE | `/api/keys/<id>` | Delete key |
| POST | `/api/keys/import` | Bulk import from JSON/CSV |

#### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/providers` | Get providers (pagination, search) |
| POST | `/api/providers` | Add provider |
| PUT | `/api/providers/<id>` | Update provider |
| DELETE | `/api/providers/<id>` | Delete provider |

#### Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | Get models (pagination, search, filter) |
| POST | `/api/models` | Add model (body: `provider_id`) |
| PUT | `/api/models/<id>` | Update model |
| DELETE | `/api/models/<id>` | Delete model |
| GET | `/api/models/free` | Get free models only |

### Query Params for `/api/keys`
- `page` - Page number
- `per_page` - Items per page (5/10/25/50/100)
- `search` - Search query
- `provider` - Filter by provider ID
- `status` - Filter by status (1=active, 0=inactive)