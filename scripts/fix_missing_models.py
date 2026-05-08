"""
Fix skipped models: mistral & together
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "apikey.db")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get provider IDs
mistral_id = cur.execute("SELECT id FROM providers WHERE name = 'mistral'").fetchone()['id']
together_id = cur.execute("SELECT id FROM providers WHERE name = 'together'").fetchone()['id']

print(f"Mistral ID: {mistral_id}")
print(f"Together ID: {together_id}")

# Insert missing models manually
import uuid
from datetime import datetime

now = datetime.utcnow().isoformat() + "Z"

# Mistral Small
cur.execute("""
INSERT INTO models (
    id, provider_id, model_name, model_id,
    context_length, is_free, free_tier_type,
    rate_limit_rpm, rate_limit_tpm,
    createdAt, updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    str(uuid.uuid4()), mistral_id, 'Mistral Small', 'mistral-small-latest',
    32000, 1, 'always_free', 1, 1000, now, now
))

# Together Llama 3.1 8B
cur.execute("""
INSERT INTO models (
    id, provider_id, model_name, model_id,
    context_length, is_free, free_tier_type,
    rate_limit_rpm, rate_limit_tpm,
    createdAt, updatedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""", (
    str(uuid.uuid4()), together_id, 'Llama 3.1 8B Instruct Turbo', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    131072, 1, 'always_free', 60, 60000, now, now
))

conn.commit()
conn.close()

print("✓ Added 2 missing models")
