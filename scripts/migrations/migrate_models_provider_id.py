"""
Migration: Change models.provider to models.provider_id (FK to providers.id)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "apikey.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    print("Starting migration: models.provider -> models.provider_id")
    print("=" * 60)
    
    # Step 1: Check if migration already done
    columns = cur.execute("PRAGMA table_info(models)").fetchall()
    column_names = [col['name'] for col in columns]
    
    if 'provider_id' in column_names:
        print("✓ Migration already applied (provider_id exists)")
        conn.close()
        return
    
    # Step 2: Get existing models data
    models = cur.execute("SELECT * FROM models").fetchall()
    print(f"Found {len(models)} models to migrate")
    
    # Step 3: Create mapping: provider name -> provider id
    providers = cur.execute("SELECT id, name FROM providers").fetchall()
    provider_map = {p['name']: p['id'] for p in providers}
    print(f"Found {len(provider_map)} providers")
    
    # Step 4: Create new table with provider_id
    cur.execute("""
    CREATE TABLE models_new (
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
    print("✓ Created models_new table")
    
    # Step 5: Migrate data
    migrated = 0
    skipped = 0
    
    for model in models:
        provider_name = model['provider']
        provider_id = provider_map.get(provider_name)
        
        if not provider_id:
            print(f"⚠ Skipping model {model['model_name']} - provider '{provider_name}' not found")
            skipped += 1
            continue
        
        cur.execute("""
        INSERT INTO models_new (
            id, provider_id, model_name, model_id,
            context_length, max_input_tokens, max_output_tokens,
            supports_streaming, supports_function_calling, supports_vision,
            pricing_type, input_price_per_1k, output_price_per_1k, total_price_per_1k,
            is_free, free_tier_type, free_credit_amount,
            rate_limit_rpm, rate_limit_rph, rate_limit_rpd,
            rate_limit_tpm, rate_limit_tph, rate_limit_tpd,
            notes, source_url, last_verified, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            model['id'], provider_id, model['model_name'], model['model_id'],
            model['context_length'], model['max_input_tokens'], model['max_output_tokens'],
            model['supports_streaming'], model['supports_function_calling'], model['supports_vision'],
            model['pricing_type'], model['input_price_per_1k'], model['output_price_per_1k'], model['total_price_per_1k'],
            model['is_free'], model['free_tier_type'], model['free_credit_amount'],
            model['rate_limit_rpm'], model['rate_limit_rph'], model['rate_limit_rpd'],
            model['rate_limit_tpm'], model['rate_limit_tph'], model['rate_limit_tpd'],
            model['notes'], model['source_url'], model['last_verified'], model['createdAt'], model['updatedAt']
        ))
        migrated += 1
    
    print(f"✓ Migrated {migrated} models")
    if skipped > 0:
        print(f"⚠ Skipped {skipped} models (provider not found)")
    
    # Step 6: Drop old table and rename new
    cur.execute("DROP TABLE models")
    cur.execute("ALTER TABLE models_new RENAME TO models")
    print("✓ Replaced old table")
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
