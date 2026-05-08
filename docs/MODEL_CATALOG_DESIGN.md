# Model Catalog Design

## Overview
Comprehensive model catalog system for tracking free models across providers, with detailed specifications for OmniRoute round-robin configuration.

**Purpose:**
- Track free models from each provider
- Store complete model specifications (context length, max tokens, parameters)
- Track pricing (input/output/total token pricing) - for when preview models become paid
- Track rate limits (requests/tokens per minute/hour/day)
- Track free credit allocations per signup
- Enable round-robin model selection in OmniRoute

---

## Database Schema

### Table: `providers` (NEW - Central Reference)

```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,      -- Canonical name: 'openai', 'anthropic', 'google'
    display_name TEXT NOT NULL,     -- Display name: 'OpenAI', 'Anthropic', 'Google AI'
    website_url TEXT,               -- Provider website
    docs_url TEXT,                  -- API documentation URL
    api_base_url TEXT,              -- Base API endpoint (optional)
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
);
```

**Purpose:**
- Single source of truth for provider list
- Centralized provider metadata
- Consistent naming across all tables
- Easy dropdown population

**Relationships:**
- `api_keys.provider` → `providers.name` (by convention, not FK)
- `models.provider` → `providers.name` (by convention, not FK)

**Why no FK constraint?**
- Flexibility: Can add keys/models before adding provider to master table
- Loose coupling: Easier migration and data import
- Convention-based: Enforced by application logic, not database

---

### Table: `models`

```sql
CREATE TABLE models (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_id TEXT NOT NULL,  -- API identifier (e.g., "gpt-4o-mini", "claude-3-5-haiku-20241022")
    
    -- Model Specifications
    context_length INTEGER,           -- Max context window (input + output)
    max_input_tokens INTEGER,         -- Max input tokens
    max_output_tokens INTEGER,        -- Max output/completion tokens
    supports_streaming INTEGER DEFAULT 1,
    supports_function_calling INTEGER DEFAULT 0,
    supports_vision INTEGER DEFAULT 0,
    
    -- Pricing (USD per token or per request)
    pricing_type TEXT DEFAULT 'token',  -- 'token', 'request', 'free'
    input_price_per_1k REAL DEFAULT 0,  -- USD per 1K input tokens
    output_price_per_1k REAL DEFAULT 0, -- USD per 1K output tokens
    total_price_per_1k REAL DEFAULT 0,  -- USD per 1K tokens (if not split input/output)
    
    -- Free Tier & Limits
    is_free INTEGER DEFAULT 1,          -- Currently free (0 = paid, 1 = free)
    free_tier_type TEXT,                -- 'always_free', 'preview', 'trial', 'credit_based'
    free_credit_amount REAL,            -- Free credit per signup (USD)
    
    -- Rate Limits
    rate_limit_rpm INTEGER,             -- Requests per minute
    rate_limit_rph INTEGER,             -- Requests per hour
    rate_limit_rpd INTEGER,             -- Requests per day
    rate_limit_tpm INTEGER,             -- Tokens per minute
    rate_limit_tph INTEGER,             -- Tokens per hour
    rate_limit_tpd INTEGER,             -- Tokens per day
    
    -- Metadata
    notes TEXT,
    source_url TEXT,                    -- Link to provider's pricing/docs page
    last_verified TEXT,                 -- ISO timestamp of last verification
    createdAt TEXT,
    updatedAt TEXT,
    
    UNIQUE(provider, model_id)
);
```

---

## Field Descriptions

### Core Identification
- **provider**: Provider name (must match `api_keys.provider`)
- **model_name**: Human-readable name (e.g., "GPT-4o Mini", "Claude 3.5 Haiku")
- **model_id**: API identifier used in requests (e.g., `gpt-4o-mini`)

### Model Specifications
- **context_length**: Total context window (input + output combined)
- **max_input_tokens**: Maximum input tokens allowed
- **max_output_tokens**: Maximum output/completion tokens
- **supports_streaming**: Boolean (1 = yes, 0 = no)
- **supports_function_calling**: Boolean
- **supports_vision**: Boolean (multimodal image input)

### Pricing
- **pricing_type**: 
  - `'token'` = charged per token (input/output may differ)
  - `'request'` = flat rate per request
  - `'free'` = completely free (no pricing)
- **input_price_per_1k**: USD per 1,000 input tokens
- **output_price_per_1k**: USD per 1,000 output tokens
- **total_price_per_1k**: USD per 1,000 tokens (if provider doesn't split input/output)

### Free Tier
- **is_free**: Current status (1 = free, 0 = paid)
- **free_tier_type**:
  - `'always_free'` = Permanently free
  - `'preview'` = Free during preview period (will become paid)
  - `'trial'` = Free trial period
  - `'credit_based'` = Free credits per signup
- **free_credit_amount**: Amount of free credit (USD) given per signup

### Rate Limits
Different providers have different limit types:
- **rate_limit_rpm**: Requests per minute
- **rate_limit_rph**: Requests per hour
- **rate_limit_rpd**: Requests per day
- **rate_limit_tpm**: Tokens per minute (input + output combined)
- **rate_limit_tph**: Tokens per hour
- **rate_limit_tpd**: Tokens per day

**Note:** Not all fields will be populated for every model. Use `NULL` for unknown/not-applicable limits.

---

## Example Data

### OpenAI GPT-4o Mini (Free Preview)
```sql
INSERT INTO models VALUES (
    'uuid-1',
    'openai',
    'GPT-4o Mini',
    'gpt-4o-mini',
    128000,  -- context_length
    128000,  -- max_input_tokens
    16384,   -- max_output_tokens
    1, 1, 1, -- streaming, function_calling, vision
    'token',
    0.00015, -- input_price_per_1k (will be charged after preview)
    0.0006,  -- output_price_per_1k
    NULL,
    1,       -- is_free (currently)
    'preview',
    NULL,    -- no signup credit
    500,     -- rpm
    NULL, NULL,
    200000,  -- tpm
    NULL, NULL,
    'Free during preview period',
    'https://openai.com/api/pricing/',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z'
);
```

### Anthropic Claude 3.5 Haiku (Credit-based)
```sql
INSERT INTO models VALUES (
    'uuid-2',
    'anthropic',
    'Claude 3.5 Haiku',
    'claude-3-5-haiku-20241022',
    200000,
    200000,
    8192,
    1, 1, 1,
    'token',
    0.0008,
    0.004,
    NULL,
    1,
    'credit_based',
    5.00,    -- $5 free credit per signup
    50,      -- rpm
    NULL, NULL,
    40000,   -- tpm
    NULL, NULL,
    '$5 free credit on signup',
    'https://www.anthropic.com/pricing',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z'
);
```

### Google Gemini 1.5 Flash (Always Free Tier)
```sql
INSERT INTO models VALUES (
    'uuid-3',
    'google',
    'Gemini 1.5 Flash',
    'gemini-1.5-flash',
    1000000,
    1000000,
    8192,
    1, 1, 1,
    'token',
    0,       -- Free tier has no cost
    0,
    NULL,
    1,
    'always_free',
    NULL,
    15,      -- rpm (free tier)
    1500,    -- rph
    NULL,
    1000000, -- tpm (1M tokens per minute!)
    NULL, NULL,
    'Always free tier with rate limits',
    'https://ai.google.dev/pricing',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z',
    '2026-05-08T00:00:00Z'
);
```

---

## Relationships

### Provider-centric Architecture (Opsi C + B)

```
┌─────────────┐
│  providers  │  (Master table)
│  (central)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│  api_keys   │  │   models    │
│             │  │             │
└─────────────┘  └─────────────┘
```

**Relational Logic:**
- `providers.name` is the canonical identifier
- `api_keys.provider` references `providers.name` (string match)
- `models.provider` references `providers.name` (string match)
- No hard FK constraints = flexible data entry

---

### Query Patterns

#### Get all providers with counts
```sql
SELECT 
    p.name,
    p.display_name,
    COUNT(DISTINCT k.id) as key_count,
    COUNT(DISTINCT m.id) as model_count
FROM providers p
LEFT JOIN api_keys k ON p.name = k.provider
LEFT JOIN models m ON p.name = m.provider
GROUP BY p.name
ORDER BY p.display_name;
```

#### Get models available for an API key
```sql
SELECT m.*
FROM models m
JOIN api_keys k ON m.provider = k.provider
WHERE k.id = ? AND m.is_free = 1
ORDER BY m.model_name;
```

#### Get API keys with their model counts
```sql
SELECT 
    k.id,
    k.name,
    k.provider,
    p.display_name as provider_display,
    COUNT(m.id) as available_models
FROM api_keys k
JOIN providers p ON k.provider = p.name
LEFT JOIN models m ON k.provider = m.provider AND m.is_free = 1
GROUP BY k.id;
```

---

## Seed Data

### Providers Seed Data
```python
providers_data = [
    {
        "name": "openai",
        "display_name": "OpenAI",
        "website_url": "https://openai.com",
        "docs_url": "https://platform.openai.com/docs",
        "api_base_url": "https://api.openai.com/v1"
    },
    {
        "name": "anthropic",
        "display_name": "Anthropic",
        "website_url": "https://www.anthropic.com",
        "docs_url": "https://docs.anthropic.com",
        "api_base_url": "https://api.anthropic.com"
    },
    {
        "name": "google",
        "display_name": "Google AI",
        "website_url": "https://ai.google.dev",
        "docs_url": "https://ai.google.dev/docs",
        "api_base_url": "https://generativelanguage.googleapis.com"
    },
    {
        "name": "groq",
        "display_name": "Groq",
        "website_url": "https://groq.com",
        "docs_url": "https://console.groq.com/docs",
        "api_base_url": "https://api.groq.com/openai/v1"
    },
    {
        "name": "deepseek",
        "display_name": "DeepSeek",
        "website_url": "https://www.deepseek.com",
        "docs_url": "https://platform.deepseek.com/api-docs",
        "api_base_url": "https://api.deepseek.com"
    },
    {
        "name": "mistral",
        "display_name": "Mistral AI",
        "website_url": "https://mistral.ai",
        "docs_url": "https://docs.mistral.ai",
        "api_base_url": "https://api.mistral.ai"
    },
    {
        "name": "cohere",
        "display_name": "Cohere",
        "website_url": "https://cohere.com",
        "docs_url": "https://docs.cohere.com",
        "api_base_url": "https://api.cohere.ai"
    },
    {
        "name": "together",
        "display_name": "Together AI",
        "website_url": "https://www.together.ai",
        "docs_url": "https://docs.together.ai",
        "api_base_url": "https://api.together.xyz"
    }
]
```

---

## Relationships

### With `api_keys` table
- **One-to-Many**: One provider can have multiple models
- **Query**: Get all free models for a provider:
  ```sql
  SELECT m.* 
  FROM models m
  JOIN api_keys k ON m.provider = k.provider
  WHERE k.id = ? AND m.is_free = 1
  ```

### No direct foreign key
- Keep tables loosely coupled
- `models.provider` references `api_keys.provider` by convention (not FK constraint)
- Allows adding models before adding API keys

---

## Use Cases

### 1. OmniRoute Round-Robin Config
Get all free models with their rate limits:
```sql
SELECT provider, model_id, rate_limit_rpm, rate_limit_tpm
FROM models
WHERE is_free = 1
ORDER BY provider, model_name;
```

### 2. Cost Estimation
Calculate cost for a request (when model becomes paid):
```python
input_cost = (input_tokens / 1000) * input_price_per_1k
output_cost = (output_tokens / 1000) * output_price_per_1k
total_cost = input_cost + output_cost
```

### 3. Rate Limit Tracking
Check if request is within limits:
```sql
SELECT rate_limit_rpm, rate_limit_tpm
FROM models
WHERE provider = ? AND model_id = ?;
```

### 4. Free Credit Tracking
List models with signup credits:
```sql
SELECT provider, model_name, free_credit_amount
FROM models
WHERE free_tier_type = 'credit_based'
ORDER BY free_credit_amount DESC;
```

---

## API Endpoints (Future)

### GET `/api/models`
Query params: `provider`, `is_free`, `supports_vision`, etc.
Returns: List of models with full specs

### POST `/api/models`
Add new model to catalog

### PUT `/api/models/<id>`
Update model specs (e.g., when pricing changes)

### GET `/api/models/free`
Get all currently free models (for OmniRoute config generation)

---

## Data Maintenance

### When to Update
1. **Provider announces pricing changes** → Update `is_free`, `input_price_per_1k`, `output_price_per_1k`
2. **Rate limits change** → Update `rate_limit_*` fields
3. **New model released** → Add new row
4. **Model deprecated** → Keep row but add note in `notes` field

### Verification
- Set `last_verified` timestamp when manually checking provider docs
- Flag models with `last_verified > 30 days` for re-verification

---

## Migration Plan

### Phase 0: Add Providers Table (NEW)
- Create `providers` table in `db.py`
- Add CRUD functions: `get_all_providers()`, `add_provider()`, `update_provider()`, `delete_provider()`
- Create seed script `seed_providers.py` with 8 initial providers
- Run seed to populate providers table

### Phase 1: Create Models Table
- Add `models` table to `db.py`
- Create `init_models_table()` function

### Phase 2: Seed Data
- Create seed script with initial free models
- Populate from known providers (OpenAI, Anthropic, Google, etc.)

### Phase 3: UI
- Add "Models" page to view/edit model catalog
- Add "Free Models" filter
- Show model specs in table

### Phase 4: Integration
- Export free models list for OmniRoute config
- Add model selector when adding API key
- **Update `/api/providers` endpoint** to query from `providers` table (not `api_keys`)
- **Update all provider dropdowns** to use `providers.display_name`
- Show available models count per provider in UI

---

## Benefits of Opsi C + B

### Centralization
- ✅ Single source of truth for provider metadata
- ✅ Consistent naming across all tables
- ✅ Easy to add new provider (one INSERT, available everywhere)

### Flexibility
- ✅ No hard FK constraints = flexible data entry
- ✅ Can add keys/models before adding provider to master
- ✅ Easy migration from existing data

### UI/UX
- ✅ Display names in dropdowns (e.g., "Google AI" not "google")
- ✅ Provider metadata available (website, docs links)
- ✅ Consistent provider list across all pages

### Maintenance
- ✅ Update provider info in one place
- ✅ Easy to add metadata fields (logo URL, status, etc.)
- ✅ Query patterns are simple and performant

---

## Notes

- **NULL vs 0**: Use `NULL` for unknown/not-applicable, `0` for explicitly zero
- **Pricing changes**: Keep historical pricing in `notes` when updating
- **Rate limits**: Some providers have multiple limit types (RPM + TPM) - store all
- **Free tier types**: Distinguish between "always free" vs "preview/trial" for planning
- **Context length**: Some models have different limits for input vs output - store both

---

## Questions for Implementation

1. ✅ Should we track historical pricing? (Answer: Use `notes` for now, separate audit table later if needed)
2. ✅ How to handle model aliases? (e.g., `gpt-4o-mini` vs `gpt-4o-mini-2024-07-18`) (Answer: Store canonical `model_id`, add aliases in `notes`)
3. ✅ Should rate limits be per-key or per-model? (Answer: Per-model as baseline, per-key overrides can be added later)
4. ✅ Import/export format for model catalog? (Answer: JSON/CSV like api_keys)
