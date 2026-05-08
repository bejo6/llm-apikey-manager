"""
Migration: Change api_keys.provider to api_keys.provider_id (FK to providers.id)
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "apikey.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    print("Starting migration: api_keys.provider -> api_keys.provider_id")
    print("=" * 60)
    
    # Step 1: Check if migration already done
    columns = cur.execute("PRAGMA table_info(api_keys)").fetchall()
    column_names = [col['name'] for col in columns]
    
    if 'provider_id' in column_names:
        print("✓ Migration already applied (provider_id exists)")
        conn.close()
        return
    
    # Step 2: Get existing api_keys data
    keys = cur.execute("SELECT * FROM api_keys").fetchall()
    print(f"Found {len(keys)} API keys to migrate")
    
    # Step 3: Create mapping: provider name -> provider id
    providers = cur.execute("SELECT id, name FROM providers").fetchall()
    provider_map = {p['name']: p['id'] for p in providers}
    print(f"Found {len(provider_map)} providers")
    
    # Step 4: Create new table with provider_id
    cur.execute("""
    CREATE TABLE api_keys_new (
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
    print("✓ Created api_keys_new table")
    
    # Step 5: Migrate data
    migrated = 0
    skipped = 0
    
    for key in keys:
        provider_name = key['provider']
        provider_id = provider_map.get(provider_name)
        
        if not provider_id:
            print(f"⚠ Skipping key {key['name']} - provider '{provider_name}' not found")
            skipped += 1
            continue
        
        cur.execute("""
        INSERT INTO api_keys_new (
            id, provider_id, name, apiKey, authType, isActive, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            key['id'], provider_id, key['name'], key['apiKey'],
            key['authType'], key['isActive'], key['notes'],
            key['createdAt'], key['updatedAt']
        ))
        migrated += 1
    
    print(f"✓ Migrated {migrated} API keys")
    if skipped > 0:
        print(f"⚠ Skipped {skipped} keys (provider not found)")
    
    # Step 6: Drop old table and rename new
    cur.execute("DROP TABLE api_keys")
    cur.execute("ALTER TABLE api_keys_new RENAME TO api_keys")
    print("✓ Replaced old table")
    
    conn.commit()
    conn.close()
    
    print("=" * 60)
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
