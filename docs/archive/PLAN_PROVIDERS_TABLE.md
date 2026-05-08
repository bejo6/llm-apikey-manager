# Plan: Phase 0 - Providers Table (Opsi C)

## Overview
Add `providers` table as central reference for all provider metadata. This table serves as the single source of truth for provider information across `api_keys` and `models` tables.

---

## Architecture

```
┌─────────────┐
│  providers  │  ← Master table (NEW)
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
- `providers.name` = canonical identifier (lowercase, no spaces)
- `api_keys.provider` → `providers.name` (string match, no FK)
- `models.provider` → `providers.name` (string match, no FK)

---

## Database Schema

### Table: `providers`

```sql
CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,      -- Canonical: 'openai', 'anthropic', 'google'
    display_name TEXT NOT NULL,     -- Display: 'OpenAI', 'Anthropic', 'Google AI'
    website_url TEXT,               -- https://openai.com
    docs_url TEXT,                  -- https://platform.openai.com/docs
    api_base_url TEXT,              -- https://api.openai.com/v1
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
);
```

**Fields:**
- `id`: UUID primary key
- `name`: Canonical name (lowercase, used for matching)
- `display_name`: Human-readable name for UI
- `website_url`: Provider's main website
- `docs_url`: API documentation URL
- `api_base_url`: Base API endpoint (for future use)
- `notes`: Additional notes
- `createdAt`, `updatedAt`: Timestamps

---

## Implementation Steps

### 1. Update `db.py`

#### Add table creation in `init_db()`:
```python
# Providers table
cur.execute("""
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    website_url TEXT,
    docs_url TEXT,
    api_base_url TEXT,
    notes TEXT,
    createdAt TEXT,
    updatedAt TEXT
)
""")
```

#### Add CRUD functions:
```python
def get_all_providers():
    """Get all providers"""
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("SELECT * FROM providers ORDER BY display_name").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_provider_by_name(name):
    """Get provider by canonical name"""
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM providers WHERE name = ?", (name,)).fetchone()
    conn.close()
    return dict(row) if row else None

def add_provider(name, display_name, **kwargs):
    """Add new provider"""
    conn = get_conn()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    id = str(uuid.uuid4())
    
    columns = ['id', 'name', 'display_name', 'createdAt', 'updatedAt']
    values = [id, name, display_name, now, now]
    
    allowed_fields = ['website_url', 'docs_url', 'api_base_url', 'notes']
    for field in allowed_fields:
        if field in kwargs:
            columns.append(field)
            values.append(kwargs[field])
    
    placeholders = ', '.join(['?'] * len(columns))
    column_names = ', '.join(columns)
    
    try:
        cur.execute(f"INSERT INTO providers ({column_names}) VALUES ({placeholders})", values)
        conn.commit()
        conn.close()
        return {"id": id, "status": "added"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"status": "duplicate", "message": "Provider already exists"}

def update_provider(id, **kwargs):
    """Update provider fields"""
    allowed_fields = ['name', 'display_name', 'website_url', 'docs_url', 'api_base_url', 'notes']
    
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in allowed_fields}
    if not filtered_kwargs:
        return False
    
    conn = get_conn()
    cur = conn.cursor()
    filtered_kwargs["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    set_clause = ", ".join([f"{k} = ?" for k in filtered_kwargs])
    values = list(filtered_kwargs.values()) + [id]
    
    cur.execute(f"UPDATE providers SET {set_clause} WHERE id = ?", values)
    updated = cur.rowcount
    conn.commit()
    conn.close()
    return updated > 0

def delete_provider(id):
    """Delete provider by ID"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM providers WHERE id = ?", (id,))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted > 0

def get_providers_with_counts():
    """Get all providers with key and model counts"""
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT 
            p.id,
            p.name,
            p.display_name,
            p.website_url,
            p.docs_url,
            COUNT(DISTINCT k.id) as key_count,
            COUNT(DISTINCT m.id) as model_count
        FROM providers p
        LEFT JOIN api_keys k ON p.name = k.provider
        LEFT JOIN models m ON p.name = m.provider
        GROUP BY p.id
        ORDER BY p.display_name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]
```

---

### 2. Create Seed Script: `seed_providers.py`

```python
"""
Seed script for providers table
Populate with known AI providers
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import db

def seed_providers():
    """Seed providers table with initial providers"""
    
    providers_data = [
        {
            "name": "openai",
            "display_name": "OpenAI",
            "website_url": "https://openai.com",
            "docs_url": "https://platform.openai.com/docs",
            "api_base_url": "https://api.openai.com/v1",
            "notes": "GPT models, DALL-E, Whisper"
        },
        {
            "name": "anthropic",
            "display_name": "Anthropic",
            "website_url": "https://www.anxthxropic.com",
            "docs_url": "https://docs.anxthxropic.com",
            "api_base_url": "https://api.anxthxropic.com",
            "notes": "Claude models"
        },
        {
            "name": "google",
            "display_name": "Google AI",
            "website_url": "https://ai.google.dev",
            "docs_url": "https://ai.google.dev/docs",
            "api_base_url": "https://generativelanguage.googleapis.com",
            "notes": "Gemini models"
        },
        {
            "name": "groq",
            "display_name": "Groq",
            "website_url": "https://groq.com",
            "docs_url": "https://console.groq.com/docs",
            "api_base_url": "https://api.groq.com/openai/v1",
            "notes": "Ultra-fast inference, Llama models"
        },
        {
            "name": "deepseek",
            "display_name": "DeepSeek",
            "website_url": "https://www.deepseek.com",
            "docs_url": "https://platform.deepseek.com/api-docs",
            "api_base_url": "https://api.deepseek.com",
            "notes": "DeepSeek models, very cheap pricing"
        },
        {
            "name": "mistral",
            "display_name": "Mistral AI",
            "website_url": "https://mistral.ai",
            "docs_url": "https://docs.mistral.ai",
            "api_base_url": "https://api.mistral.ai",
            "notes": "Mistral models"
        },
        {
            "name": "cohere",
            "display_name": "Cohere",
            "website_url": "https://cohere.com",
            "docs_url": "https://docs.cohere.com",
            "api_base_url": "https://api.cohere.ai",
            "notes": "Command models, embeddings"
        },
        {
            "name": "together",
            "display_name": "Together AI",
            "website_url": "https://www.together.ai",
            "docs_url": "https://docs.together.ai",
            "api_base_url": "https://api.together.xyz",
            "notes": "Open-source models hosting"
        }
    ]
    
    added = 0
    skipped = 0
    
    for provider in providers_data:
        result = db.add_provider(**provider)
        if result.get("status") == "added":
            added += 1
            print(f"✓ Added: {provider['display_name']} ({provider['name']})")
        else:
            skipped += 1
            print(f"⊘ Skipped: {provider['display_name']} (already exists)")
    
    print(f"\n{'='*50}")
    print(f"Seed completed: {added} added, {skipped} skipped")
    print(f"{'='*50}")

if __name__ == "__main__":
    print("Seeding providers table...")
    print(f"{'='*50}\n")
    seed_providers()
```

---

### 3. Update `app.py`

#### Update `/api/providers` endpoint:
```python
@app.route("/api/providers", methods=["GET"])
def get_providers():
    """Get all providers with counts"""
    providers = db.get_providers_with_counts()
    return jsonify(providers)
```

#### Add new endpoints:
```python
@app.route("/api/providers/<id>", methods=["GET"])
def get_provider(id):
    """Get single provider by ID"""
    # Implementation
    pass

@app.route("/api/providers", methods=["POST"])
def add_provider_route():
    """Add new provider"""
    # Implementation
    pass

@app.route("/api/providers/<id>", methods=["PUT"])
def update_provider_route(id):
    """Update provider"""
    # Implementation
    pass

@app.route("/api/providers/<id>", methods=["DELETE"])
def delete_provider_route(id):
    """Delete provider"""
    # Implementation
    pass
```

---

### 4. Update Frontend

#### Update all provider dropdowns to use `display_name`:
```javascript
// Before (showing canonical name)
<option value="openai">openai</option>

// After (showing display name)
<option value="openai">OpenAI</option>
```

#### Update `populateProviders()` function:
```javascript
async function populateProviders() {
    const res = await fetch('/api/providers');
    const providers = await res.json();
    
    // Use display_name in UI, name as value
    document.getElementById('providerFilter').innerHTML = 
        '<option value="">All Providers</option>' + 
        providers.map(p => `<option value="${p.name}">${p.display_name} (${p.key_count} keys, ${p.model_count} models)</option>`).join('');
}
```

---

## Testing

### 1. Database
```bash
# Run seed
python seed_providers.py

# Verify
sqlite3 data/apikey.db "SELECT name, display_name FROM providers;"
```

### 2. API
```bash
# Get all providers
curl http://localhost:5000/api/providers

# Should return providers with key_count and model_count
```

### 3. UI
- Check all dropdowns show display names (e.g., "OpenAI" not "openai")
- Verify provider counts are correct
- Test add/edit forms with provider datalist

---

## Migration Notes

### Existing Data
- `api_keys` table already has `provider` column (string)
- `models` table already has `provider` column (string)
- No schema changes needed for existing tables
- Seed `providers` from unique values in `api_keys` and `models`

### Data Consistency
After seeding providers, verify all existing providers are in the master table:
```sql
-- Check for providers in api_keys not in providers table
SELECT DISTINCT k.provider 
FROM api_keys k
LEFT JOIN providers p ON k.provider = p.name
WHERE p.name IS NULL;

-- Check for providers in models not in providers table
SELECT DISTINCT m.provider 
FROM models m
LEFT JOIN providers p ON m.provider = p.name
WHERE p.name IS NULL;
```

If any orphaned providers found, add them to `providers` table.

---

## Benefits

✅ **Single source of truth** for provider metadata
✅ **Consistent naming** across all tables and UI
✅ **Easy dropdown population** with display names
✅ **Provider metadata** available (website, docs, API base URL)
✅ **No breaking changes** to existing `api_keys` and `models` tables
✅ **Flexible** - no hard FK constraints
✅ **Scalable** - easy to add new providers

---

## Next Steps After Phase 0

1. Update all UI dropdowns to use `providers` table
2. Add provider management page (optional)
3. Show provider metadata in UI (website link, docs link)
4. Use `api_base_url` for future API testing features
