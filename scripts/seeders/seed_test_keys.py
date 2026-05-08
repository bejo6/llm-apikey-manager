"""
Seeder test: Add 2-3 API keys with provider_id
"""
import sqlite3
import os
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "apikey.db")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get provider IDs
openai = cur.execute("SELECT id FROM providers WHERE name = 'openai'").fetchone()
anthropic = cur.execute("SELECT id FROM providers WHERE name = 'anthropic'").fetchone()
google = cur.execute("SELECT id FROM providers WHERE name = 'google'").fetchone()

if not openai or not anthropic or not google:
    print("❌ Required providers not found (openai, anthropic, google)")
    conn.close()
    exit(1)

openai_id = openai['id']
anthropic_id = anthropic['id']
google_id = google['id']

now = datetime.utcnow().isoformat() + "Z"

# Test data
test_keys = [
    {
        "id": str(uuid.uuid4()),
        "provider_id": openai_id,
        "name": "test-openai",
        "apiKey": "sk-test-openai-12345",
        "authType": "bearer",
        "isActive": 1,
        "notes": "Test OpenAI key",
        "createdAt": now,
        "updatedAt": now
    },
    {
        "id": str(uuid.uuid4()),
        "provider_id": anthropic_id,
        "name": "test-anthropic",
        "apiKey": "sk-ant-test-12345",
        "authType": "apikey",
        "isActive": 1,
        "notes": "Test Anthropic key",
        "createdAt": now,
        "updatedAt": now
    },
    {
        "id": str(uuid.uuid4()),
        "provider_id": google_id,
        "name": "test-google",
        "apiKey": "AIzaSyTest12345",
        "authType": "apikey",
        "isActive": 0,
        "notes": "Test Google key (inactive)",
        "createdAt": now,
        "updatedAt": now
    }
]

print("Seeding test API keys...")
print("=" * 60)

added = 0
for key in test_keys:
    try:
        cur.execute("""
        INSERT INTO api_keys (id, provider_id, name, apiKey, authType, isActive, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            key['id'], key['provider_id'], key['name'], key['apiKey'],
            key['authType'], key['isActive'], key['notes'],
            key['createdAt'], key['updatedAt']
        ))
        print(f"✓ Added: {key['name']} ({key['apiKey'][:20]}...)")
        added += 1
    except sqlite3.IntegrityError:
        print(f"⚠ Skipped: {key['name']} (duplicate)")

conn.commit()
conn.close()

print("=" * 60)
print(f"Seed completed: {added} keys added")
