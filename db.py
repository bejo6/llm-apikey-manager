import sqlite3
import uuid
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "apikey.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_conn()
    cur = conn.cursor()
    
    # API Keys table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS api_keys (
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
    )
    """)
    
    # Models table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        provider_id TEXT NOT NULL,
        model_name TEXT NOT NULL,
        model_id TEXT NOT NULL,
        
        context_length INTEGER,
        max_input_tokens INTEGER,
        max_output_tokens INTEGER,
        supports_streaming INTEGER DEFAULT 1,
        supports_function_calling INTEGER DEFAULT 0,
        supports_vision INTEGER DEFAULT 0,
        
        pricing_type TEXT DEFAULT 'token',
        input_price_per_1k REAL DEFAULT 0,
        output_price_per_1k REAL DEFAULT 0,
        total_price_per_1k REAL DEFAULT 0,
        
        is_free INTEGER DEFAULT 1,
        free_tier_type TEXT,
        free_credit_amount REAL,
        
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
    )
    """)
    
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
    
    conn.commit()
    conn.close()

def get_all(page=1, per_page=50, name=None, provider=None, status=None, search=None):
    conn = get_conn()
    cur = conn.cursor()

    query = """
    SELECT 
        k.*,
        p.name as provider,
        p.display_name as provider_display_name
    FROM api_keys k
    LEFT JOIN providers p ON k.provider_id = p.id
    WHERE 1=1
    """
    params = []

    if name:
        query += " AND k.name = ?"
        params.append(name)

    if provider:
        query += " AND p.name = ?"
        params.append(provider)

    if status is not None and status != '':
        query += " AND k.isActive = ?"
        params.append(int(status))

    if search:
        query += " AND (LOWER(p.name) LIKE ? OR LOWER(k.name) LIKE ? OR LOWER(k.apiKey) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])

    # Get total count for this filter
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = cur.execute(count_query, params).fetchone()[0]

    # Apply ordering and pagination
    query += " ORDER BY p.name, k.name LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])

    rows = cur.execute(query, params).fetchall()
    conn.close()

    return [dict(r) for r in rows], total

def get_by_id(id):
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("""
        SELECT 
            k.*,
            p.name as provider,
            p.display_name as provider_display_name
        FROM api_keys k
        LEFT JOIN providers p ON k.provider_id = p.id
        WHERE k.id = ?
    """, (id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def add(provider_id, name, apiKey, authType="apikey", isActive=1, notes=None):
    conn = get_conn()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    id = str(uuid.uuid4())
    try:
        cur.execute("""
        INSERT INTO api_keys (id, provider_id, name, apiKey, authType, isActive, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (id, provider_id, name, apiKey, authType, isActive, notes, now, now))
        conn.commit()
        conn.close()
        return {"id": id, "status": "added"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"status": "duplicate", "message": "API key already exists"}

def delete(id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM api_keys WHERE id = ?", (id,))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted > 0

def update(id, **kwargs):
    # Allowed columns to prevent SQL injection
    ALLOWED_COLUMNS = {"provider_id", "name", "apiKey", "authType", "isActive", "notes"}

    filtered_kwargs = {k: v for k, v in kwargs.items() if k in ALLOWED_COLUMNS}
    if not filtered_kwargs:
        return False

    conn = get_conn()
    cur = conn.cursor()
    filtered_kwargs["updatedAt"] = datetime.utcnow().isoformat() + "Z"

    set_clause = ", ".join([f"{k} = ?" for k in filtered_kwargs])
    values = list(filtered_kwargs.values()) + [id]

    cur.execute(f"UPDATE api_keys SET {set_clause} WHERE id = ?", values)
    updated = cur.rowcount
    conn.commit()
    conn.close()
    return updated > 0

def get_providers():
    """Get all unique providers and their counts"""
    conn = get_conn()
    cur = conn.cursor()
    rows = cur.execute("""
        SELECT p.name as provider, p.display_name, COUNT(k.id) as count 
        FROM providers p
        LEFT JOIN api_keys k ON p.id = k.provider_id
        GROUP BY p.id, p.name, p.display_name
        ORDER BY p.name
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ============================================
# Models CRUD Operations
# ============================================

def get_all_models(page=1, per_page=50, provider=None, is_free=None, search=None, tier=None):
    """Get all models with pagination, filters, and provider name via JOIN"""
    conn = get_conn()
    cur = conn.cursor()
    
    query = """
    SELECT 
        m.*,
        p.name as provider,
        p.display_name as provider_display_name
    FROM models m
    LEFT JOIN providers p ON m.provider_id = p.id
    WHERE 1=1
    """
    params = []
    
    if provider:
        query += " AND p.name = ?"
        params.append(provider)
    
    if is_free is not None and is_free != '':
        query += " AND m.is_free = ?"
        params.append(int(is_free))
    
    if tier:
        query += " AND m.free_tier_type = ?"
        params.append(tier)
    
    if search:
        query += " AND (LOWER(p.name) LIKE ? OR LOWER(m.model_name) LIKE ? OR LOWER(m.model_id) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s, s])
    
    # Get total count
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = cur.execute(count_query, params).fetchone()[0]
    
    # Apply ordering and pagination
    query += " ORDER BY p.name, m.model_name LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])
    
    rows = cur.execute(query, params).fetchall()
    conn.close()
    
    return [dict(r) for r in rows], total

def get_model_by_id(id):
    """Get model by ID with provider name via JOIN"""
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("""
        SELECT 
            m.*,
            p.name as provider,
            p.display_name as provider_display_name
        FROM models m
        LEFT JOIN providers p ON m.provider_id = p.id
        WHERE m.id = ?
    """, (id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def add_model(provider_id, model_name, model_id, **kwargs):
    """Add new model to catalog"""
    conn = get_conn()
    cur = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"
    id = str(uuid.uuid4())
    
    # Build column list and values
    columns = ['id', 'provider_id', 'model_name', 'model_id', 'createdAt', 'updatedAt']
    values = [id, provider_id, model_name, model_id, now, now]
    
    # Add optional fields
    allowed_fields = [
        'context_length', 'max_input_tokens', 'max_output_tokens',
        'supports_streaming', 'supports_function_calling', 'supports_vision',
        'pricing_type', 'input_price_per_1k', 'output_price_per_1k', 'total_price_per_1k',
        'is_free', 'free_tier_type', 'free_credit_amount',
        'rate_limit_rpm', 'rate_limit_rph', 'rate_limit_rpd',
        'rate_limit_tpm', 'rate_limit_tph', 'rate_limit_tpd',
        'notes', 'source_url', 'last_verified'
    ]
    
    for field in allowed_fields:
        if field in kwargs:
            columns.append(field)
            values.append(kwargs[field])
    
    placeholders = ', '.join(['?'] * len(columns))
    column_names = ', '.join(columns)
    
    try:
        cur.execute(f"INSERT INTO models ({column_names}) VALUES ({placeholders})", values)
        conn.commit()
        conn.close()
        return {"id": id, "status": "added"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"status": "duplicate", "message": "Model already exists"}

def update_model(id, **kwargs):
    """Update model fields"""
    allowed_fields = [
        'provider_id', 'model_name', 'model_id',
        'context_length', 'max_input_tokens', 'max_output_tokens',
        'supports_streaming', 'supports_function_calling', 'supports_vision',
        'pricing_type', 'input_price_per_1k', 'output_price_per_1k', 'total_price_per_1k',
        'is_free', 'free_tier_type', 'free_credit_amount',
        'rate_limit_rpm', 'rate_limit_rph', 'rate_limit_rpd',
        'rate_limit_tpm', 'rate_limit_tph', 'rate_limit_tpd',
        'notes', 'source_url', 'last_verified'
    ]
    
    filtered_kwargs = {k: v for k, v in kwargs.items() if k in allowed_fields}
    if not filtered_kwargs:
        return False
    
    conn = get_conn()
    cur = conn.cursor()
    filtered_kwargs["updatedAt"] = datetime.utcnow().isoformat() + "Z"
    
    set_clause = ", ".join([f"{k} = ?" for k in filtered_kwargs])
    values = list(filtered_kwargs.values()) + [id]
    
    cur.execute(f"UPDATE models SET {set_clause} WHERE id = ?", values)
    updated = cur.rowcount
    conn.commit()
    conn.close()
    return updated > 0

def delete_model(id):
    """Delete model by ID"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM models WHERE id = ?", (id,))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted > 0

def get_free_models(provider=None):
    """Get all free models, optionally filtered by provider"""
    conn = get_conn()
    cur = conn.cursor()
    
    query = """
    SELECT 
        m.*,
        p.name as provider,
        p.display_name as provider_display_name
    FROM models m
    LEFT JOIN providers p ON m.provider_id = p.id
    WHERE m.is_free = 1
    """
    params = []
    
    if provider:
        query += " AND p.name = ?"
        params.append(provider)
    
    query += " ORDER BY p.name, m.model_name"
    
    rows = cur.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ============================================
# Providers CRUD Operations
# ============================================

def get_all_providers(page=1, per_page=50, search=None):
    """Get all providers with pagination and search"""
    conn = get_conn()
    cur = conn.cursor()
    
    query = "SELECT * FROM providers WHERE 1=1"
    params = []
    
    if search:
        query += " AND (LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?)"
        s = f"%{search.lower()}%"
        params.extend([s, s])
    
    # Get total count
    count_query = f"SELECT COUNT(*) FROM ({query})"
    total = cur.execute(count_query, params).fetchone()[0]
    
    # Apply ordering and pagination
    query += " ORDER BY display_name LIMIT ? OFFSET ?"
    params.extend([per_page, (page - 1) * per_page])
    
    rows = cur.execute(query, params).fetchall()
    conn.close()
    
    return [dict(r) for r in rows], total

def get_provider_by_id(id):
    """Get provider by ID"""
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM providers WHERE id = ?", (id,)).fetchone()
    conn.close()
    return dict(row) if row else None

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
        if field in kwargs and kwargs[field]:
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

def get_distinct_names():
    """Get distinct non-empty names from api_keys table."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT name 
        FROM api_keys 
        WHERE name IS NOT NULL AND name != '' 
        ORDER BY name
    """)
    rows = cur.fetchall()
    conn.close()
    return [row[0] for row in rows]

