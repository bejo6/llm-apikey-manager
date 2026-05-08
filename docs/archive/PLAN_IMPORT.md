# Plan: Import Feature (JSON & CSV)

## Overview
Add import functionality to API Key Manager, allowing users to bulk-import API keys from JSON or CSV files via the web UI.

---

## Changes Required

### 1. Backend (`app.py`)
Add new endpoint:
- `POST /api/keys/import` → Accept JSON or CSV file upload, parse, and bulk-insert into `api_keys` table.

**Logic:**
- Detect file type from MIME type or file extension
- Parse JSON: expect array of objects with fields `{provider, name, apiKey, authType, notes}`
- Parse CSV: expect header row with columns `provider,name,apiKey,authType,isActive,notes`
- For each record:
  - Generate UUID for `id`
  - Set `createdAt` and `updatedAt` to current UTC time
  - Default `isActive=1`, `authType='apikey'` if not provided
  - Use `db.add()` for each record (handles duplicates via IntegrityError)
- Return summary: `{imported: N, skipped: M, errors: [...]}` 

**Duplicate handling:**
- If record already exists (UNIQUE constraint), skip it (don't overwrite)
- Count as "skipped"

---

### 2. Frontend (`templates/index.html`)

**UI Changes:**
- Add "Import" button in the header/toolbar area (next to Export button)
- On click: show modal with:
  - File input (`<input type="file" accept=".json,.csv">`)
  - Format hint text
  - Import button
- On file selected + Import clicked:
  - Use `FormData` to POST file to `/api/keys/import`
  - Show progress/result in modal
  - On success: refresh table, show toast notification with summary
  - On error: show error message in modal

**JavaScript:**
- Add `importKeys(file)` function
- Handle file reading + FormData upload
- Parse response and show result

---

### 3. CSV Format Specification

Expected CSV columns (case-insensitive):
```
provider,name,apiKey,authType,isActive,notes
openai,user@example.com,sk-xxx,apikey,1,
anthropic,my-key,sk-ant-xxx,apikey,1,Production key
```

- `provider` and `apiKey` are required
- `name`, `authType`, `isActive`, `notes` are optional
- `isActive` should be `1` or `0` (defaults to `1`)
- `authType` defaults to `'apikey'`

---

### 4. JSON Format Specification

Expected JSON structure:
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

- `provider` and `apiKey` are required
- Other fields optional (same defaults as CSV)

---

## Implementation Order

1. **Backend**: Add `POST /api/keys/import` endpoint in `app.py`
2. **Frontend**: Add Import button + modal in `index.html`
3. **Test**: Upload JSON and CSV files, verify import works correctly
4. **Verify**: Run `python -m py_compile app.py` to check syntax

---

## Verification Steps

1. Start app: `source .venv/bin/activate && python app.py`
2. Test JSON import:
   - Create test JSON file with 2-3 keys
   - Use Import button to upload
   - Verify keys appear in table
3. Test CSV import:
   - Create test CSV file with 2-3 keys
   - Use Import button to upload
   - Verify keys appear in table
4. Test duplicate handling:
   - Import same file twice
   - Verify duplicates are skipped (not added again)
5. Test error handling:
   - Upload invalid file (wrong format)
   - Verify error message shown

---

## Files Modified

| File | Changes |
|------|---------|
| `app.py` | Add `POST /api/keys/import` endpoint |
| `templates/index.html` | Add Import button, modal, and JS logic |

---

## Notes

- No changes to `db.py` needed (reuse existing `add()` function)
- Import uses same duplicate-check logic as manual add
- No overwrite/update of existing keys (import only adds new ones)
- Keep it simple: no complex mapping or transformation UI
