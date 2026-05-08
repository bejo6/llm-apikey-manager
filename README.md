# API Key Manager

Flask-based API key management system with modern dark UI and free model catalog.

> **⚠️ SECURITY WARNING**  
> This application is designed for **LOCAL USE ONLY**. It has **NO AUTHENTICATION** or authorization system.  
> **DO NOT** deploy this to a public server or expose it to the internet without implementing proper security measures (authentication, HTTPS, CSRF protection, etc.).

---

## Features

### API Keys Management
- **Dashboard** - Overview with stats (total keys, providers, models, active keys) and recent keys
- **List Keys** - View all API keys with pagination (5/10/25/50/100 per page)
- **Search & Filter** - Search by provider/name/key, filter by provider or status
- **Add/Edit/Delete** - Full CRUD operations with modal-based UI
- **Copy** - Click on name or API key column to copy to clipboard
- **Import** - Bulk import from JSON or CSV files
- **Export** - Export to JSON, CSV, or .env format

### Providers Management
- **List Providers** - View all providers with key count and model count
- **Add/Edit/Delete** - Manage provider information (name, display name, URLs, notes)
- **Search & Pagination** - Find providers quickly

### Models Catalog
- **Free Models** - Catalog of free AI models for OmniRoute round-robin
- **Filter by Tier** - Filter by free tier type (trial, limited, unlimited)
- **Provider Integration** - Models linked to providers via foreign key

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Flask 3.0 + Blueprints, Python 3.9+ |
| Database | SQLite (3 tables: providers, api_keys, models) |
| Frontend | Vanilla JS (modular per-page), Native CSS |
| Styling | Custom dark theme (GitHub-style) |

---

## Project Structure

```
apikey-manager-flask/
├── app.py                  # Flask app + page routes
├── db.py                   # SQLite operations (3 tables)
├── requirements.txt        # Dependencies
├── routes/
│   ├── __init__.py
│   ├── keys.py             # API keys routes (Blueprint)
│   ├── providers.py        # Providers routes (Blueprint)
│   └── models.py           # Models routes (Blueprint)
├── static/
│   ├── style.css           # Modern dark CSS
│   └── js/
│       ├── main.js         # Shared functions (toast, escapeHtml, etc.)
│       ├── dashboard.js    # Dashboard page logic
│       ├── keys.js         # Keys page logic
│       ├── providers.js    # Providers page logic
│       ├── models.js       # Models page logic
│       ├── import.js       # Import page logic
│       └── export.js       # Export page logic
├── templates/
│   ├── base.html           # Base layout with sidebar
│   ├── components/
│   │   ├── sidebar.html            # Navigation menu
│   │   ├── modals_keys.html        # Add/Edit key modals
│   │   ├── modals_providers.html   # Add/Edit provider modals
│   │   ├── modals_models.html      # Add model modal
│   │   └── modal_delete_confirm.html # Shared delete confirmation
│   └── pages/
│       ├── dashboard.html  # Dashboard (home page)
│       ├── keys.html       # Keys list page
│       ├── providers.html  # Providers list page
│       ├── models.html     # Models catalog page
│       ├── import.html     # Import page
│       └── export.html     # Export page
├── scripts/
│   ├── migrations/
│   │   ├── migrate_api_keys_provider_id.py
│   │   └── migrate_models_provider_id.py
│   └── seeders/
│       ├── seed_providers.py   # Seed 26 providers
│       ├── seed_models.py      # Seed 10 free models
│       └── seed_test_keys.py
├── data/
│   └── apikey.db           # SQLite database
└── docs/
    ├── PHASE_REPORT.md         # Development report
    ├── MODEL_CATALOG_DESIGN.md # Model catalog design doc
    └── PLAN_PROVIDERS_TABLE.md # Providers table plan
```

---

## Setup & Run

### 1. Create virtual environment (if not exists)
```bash
cd apikey-manager-flask
uv venv
uv sync
```

### 2. Run the app
```bash
source .venv/bin/activate
python app.py
```

### 3. Access
Open http://localhost:5000

---

## Database Schema

### 1. `providers` (Master Table)
```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    website_url TEXT,
    docs_url TEXT,
    api_base_url TEXT,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
);
```

### 2. `api_keys` (Foreign Key: provider_id)
```sql
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    name TEXT,
    apiKey TEXT NOT NULL,
    authType TEXT DEFAULT 'apikey',
    isActive INTEGER DEFAULT 1,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    UNIQUE(provider_id, name, apiKey),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

### 3. `models` (Foreign Key: provider_id)
```sql
CREATE TABLE models (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    model_name TEXT,
    model_id TEXT NOT NULL,
    context_length INTEGER,
    max_input_tokens INTEGER,
    max_output_tokens INTEGER,
    supports_streaming INTEGER DEFAULT 1,
    supports_function_calling INTEGER DEFAULT 0,
    supports_vision INTEGER DEFAULT 0,
    pricing_type TEXT DEFAULT 'free',
    input_price_per_1k REAL DEFAULT 0,
    output_price_per_1k REAL DEFAULT 0,
    total_price_per_1k REAL DEFAULT 0,
    is_free INTEGER DEFAULT 1,
    free_tier_type TEXT,
    free_credit_amount TEXT,
    rate_limit_rpm INTEGER,
    rate_limit_rph INTEGER,
    rate_limit_rpd INTEGER,
    rate_limit_tpm INTEGER,
    rate_limit_tph INTEGER,
    rate_limit_tpd INTEGER,
    notes TEXT,
    source_url TEXT,
    last_verified TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    UNIQUE(provider_id, model_id),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);
```

**Relationships:**
```
providers (1) ──→ (many) api_keys
providers (1) ──→ (many) models
```

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

### Query Parameters

**`/api/keys`:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)
- `search` - Search query
- `provider` - Filter by provider ID
- `status` - Filter by status (1=active, 0=inactive)

**`/api/providers`:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)
- `search` - Search query

**`/api/models`:**
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 10)
- `search` - Search query
- `provider` - Filter by provider ID
- `tier` - Filter by free tier type (trial/limited/unlimited)

---

## Import Formats

### JSON
```json
[
  {
    "provider": "openai",
    "name": "user@example.com",
    "apiKey": "sk-xxx",
    "authType": "apikey",
    "isActive": 1,
    "notes": "Optional notes"
  }
]
```

**Required fields:** `provider`, `apiKey`  
**Optional fields:** `name`, `authType` (default: `"apikey"`), `isActive` (default: `1`), `notes`

**Note:** `provider` is matched against `providers.name` (not `provider_id`). If provider not found, key is skipped.

### CSV
```csv
provider,name,apiKey,authType,isActive,notes
openai,user@example.com,sk-xxx,apikey,1,Optional notes
anthropic,my-key,sk-ant-xxx,apikey,1,Production key
```

**Required columns:** `provider`, `apiKey`  
**Optional columns:** `name`, `authType`, `isActive`, `notes`

**Duplicate Handling:** Existing keys (same provider_id + name + apiKey) are skipped, not overwritten.

---

## Export Formats

### JSON
```json
[
  {
    "provider": "openai",
    "name": "user@example.com",
    "apiKey": "sk-xxx",
    "authType": "apikey",
    "isActive": 1,
    "notes": ""
  }
]
```

### CSV
```csv
provider,name,apiKey,authType,isActive,notes
openai,user@example.com,sk-xxx,apikey,1,
```

### .env
```bash
# openai
OPENAI_KEY="sk-xxx"
```

---

## Seeding Data

### Seed Providers (26 providers)
```bash
python scripts/seeders/seed_providers.py
```

### Seed Free Models (10 models)
```bash
python scripts/seeders/seed_models.py
```

### Seed Test Keys (optional)
```bash
python scripts/seeders/seed_test_keys.py
```

---

## Architecture Notes

- **Multi-Page Application** - Server-side routing (not SPA)
- **Blueprint Pattern** - Routes split into 3 blueprints (keys, providers, models)
- **Modular Frontend** - Page-specific JS files, shared functions in main.js
- **Provider-Centric** - Providers as master table, keys and models reference via FK
- **No Alembic** - Manual migrations (for now)

---

## Notes

- Database is auto-created on first run
- Database file location: `data/apikey.db`
- Provider list is static (seeded from snapshot, not dynamic from api_keys)
- Models catalog is for **free models only** (OmniRoute use case)

---

## TODO / Future Improvements

### High Priority
- [ ] **Authentication System** - Add user authentication and authorization (Flask-Login or JWT)
- [ ] **HTTPS Support** - SSL/TLS configuration for secure deployment
- [ ] **CSRF Protection** - Add CSRF tokens to all forms
- [ ] **Input Validation** - Server-side validation for all user inputs
- [ ] **Rate Limiting** - Prevent abuse of API endpoints

### Medium Priority
- [ ] **Alembic Integration** - Replace manual migrations with Alembic for database schema versioning
- [ ] **Mobile Responsive UI** - Improve mobile/tablet experience (collapsible sidebar, touch-friendly buttons, responsive tables)
- [ ] **Edit Model Feature** - Add edit functionality for models (currently only add/delete)
- [ ] **Bulk Operations** - Bulk delete/activate/deactivate keys
- [ ] **API Key Encryption** - Encrypt API keys at rest in database
- [ ] **Audit Log** - Track all CRUD operations with timestamps and user info

### Low Priority
- [ ] **Export Filters** - Export only filtered/searched results
- [ ] **Dark/Light Theme Toggle** - User preference for theme
- [ ] **Keyboard Shortcuts** - Add more keyboard shortcuts for power users
- [ ] **API Documentation** - OpenAPI/Swagger documentation for API endpoints
- [x] **Docker Support** - Dockerfile and docker-compose for easy deployment (see DOCKER.md)

---

## Security Considerations

**⚠️ Before deploying to production:**

1. **Add Authentication** - Implement user login system (Flask-Login, Flask-Security, or OAuth)
2. **Enable HTTPS** - Use SSL/TLS certificates (Let's Encrypt, Cloudflare)
3. **Add CSRF Protection** - Use Flask-WTF or Flask-SeaSurf
4. **Validate All Inputs** - Server-side validation with proper error handling
5. **Encrypt Sensitive Data** - Encrypt API keys in database (Fernet, AES)
6. **Add Rate Limiting** - Use Flask-Limiter to prevent abuse
7. **Set Secure Headers** - Use Flask-Talisman for security headers
8. **Environment Variables** - Move secrets to `.env` file (never commit)
9. **Database Backups** - Implement automated backup strategy
10. **Logging & Monitoring** - Add proper logging and error tracking
